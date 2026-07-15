import type { Strand } from "@/lib/graph/types";
import {
  DIAGNOSTIC_SECTIONS,
  sectionForStrand,
  type DiagnosticSectionKey,
} from "./protocol";

export type DiagnosticPathNode = {
  id: string;
  key: string;
  label: string;
  strand: Strand;
};

export type DiagnosticPathEdge = {
  sourceNodeId: string;
  targetNodeId: string;
  prerequisiteClass?: "hard" | "soft" | null;
};

export type DiagnosticPathEstimate = {
  masteryProbability: number;
  uncertainty: number;
  directEvidenceCount: number;
  evidenceCoverageConfirmed?: boolean;
  evidenceKind: "direct" | "inferred_prerequisite" | "historical";
  /** Persisted diagnostic classification is expectation-aware. When present,
   * it is authoritative over the aggregate probability. */
  classification?: "mastered" | "fragile" | "missing" | "unknown";
};

export type DiagnosticLearningPathStep = {
  nodeId: string;
  nodeKey: string;
  label: string;
  section: DiagnosticSectionKey;
  position: number;
  stage: "remediation" | "consolidation" | "verification";
  mastery: number;
  uncertainty: number;
  prerequisiteNodeIds: string[];
  rationaleFr: string;
};

export type DiagnosticLearningPath = {
  steps: DiagnosticLearningPathStep[];
  sectionCounts: Record<DiagnosticSectionKey, number>;
  firstStepBySection: Partial<Record<DiagnosticSectionKey, string>>;
};

const SECTION_INDEX = new Map(
  DIAGNOSTIC_SECTIONS.map((section, index) => [section.key, index]),
);

/**
 * Convert the jagged diagnostic profile into a prerequisite-safe path. All hard
 * prerequisites appear before the nodes they unlock. Confidently mastered nodes
 * are omitted; unresolved nodes stay in the path as explicit verification work
 * rather than being silently labelled missing.
 */
export function buildDiagnosticLearningPath(input: {
  nodes: DiagnosticPathNode[];
  edges: DiagnosticPathEdge[];
  estimates: Map<string, DiagnosticPathEstimate>;
  /** Nodes whose pinned taxonomy still requires an unaided, connected task
   * that the live diagnostic intentionally does not grade. */
  requiresIndependentVerification?: ReadonlySet<string>;
  masteryThreshold?: number;
}): DiagnosticLearningPath {
  const masteryThreshold = input.masteryThreshold ?? 0.85;
  const nodeById = new Map(input.nodes.map((node) => [node.id, node]));
  const sectionByNode = new Map(
    input.nodes.flatMap((node) => {
      const section = sectionForStrand(node.strand);
      return section ? [[node.id, section] as const] : [];
    }),
  );
  const inScope = new Set(sectionByNode.keys());
  const isMastered = (nodeId: string) => {
    if (input.requiresIndependentVerification?.has(nodeId)) return false;
    const estimate = input.estimates.get(nodeId);
    if (estimate?.classification) return estimate.classification === "mastered";
    return !!estimate
      && estimate.masteryProbability >= masteryThreshold
      && (
        estimate.evidenceKind === "inferred_prerequisite"
        || (estimate.evidenceCoverageConfirmed ?? estimate.directEvidenceCount >= 2)
      );
  };
  const candidates = new Set(
    [...inScope].filter((nodeId) => !isMastered(nodeId)),
  );
  const hardEdges = input.edges.filter((edge) =>
    edge.prerequisiteClass !== "soft" &&
    candidates.has(edge.sourceNodeId) &&
    candidates.has(edge.targetNodeId)
  );
  const prerequisites = new Map<string, string[]>();
  const dependents = new Map<string, string[]>();
  const indegree = new Map([...candidates].map((nodeId) => [nodeId, 0]));

  for (const edge of hardEdges) {
    add(prerequisites, edge.targetNodeId, edge.sourceNodeId);
    add(dependents, edge.sourceNodeId, edge.targetNodeId);
    indegree.set(edge.targetNodeId, (indegree.get(edge.targetNodeId) ?? 0) + 1);
  }

  const ordered: string[] = [];
  const available = [...candidates].filter((nodeId) => indegree.get(nodeId) === 0);
  while (available.length) {
    available.sort((left, right) => comparePathCandidates(
      left,
      right,
      nodeById,
      sectionByNode,
      input.estimates,
    ));
    const nodeId = available.shift() as string;
    ordered.push(nodeId);
    for (const dependent of dependents.get(nodeId) ?? []) {
      const next = (indegree.get(dependent) ?? 0) - 1;
      indegree.set(dependent, next);
      if (next === 0) available.push(dependent);
    }
  }

  // Taxonomy validation rejects cycles; retaining the unresolved nodes here is
  // a defensive fallback that also makes a corrupted import visible in tests.
  for (const nodeId of [...candidates].sort()) {
    if (!ordered.includes(nodeId)) ordered.push(nodeId);
  }

  const steps = ordered.flatMap((nodeId, index) => {
    const node = nodeById.get(nodeId);
    const section = sectionByNode.get(nodeId);
    if (!node || !section) return [];
    const estimate = input.estimates.get(nodeId);
    const independentVerification = input.requiresIndependentVerification?.has(nodeId) ?? false;
    const mastery = estimate?.masteryProbability ?? 0.5;
    const uncertainty = estimate?.uncertainty ?? 1;
    const directEvidenceUnconfirmed = estimate?.evidenceKind === "direct"
      && !(estimate.evidenceCoverageConfirmed ?? estimate.directEvidenceCount >= 2);
    const stage = independentVerification || !estimate || directEvidenceUnconfirmed || estimate.classification === "unknown"
      ? "verification"
      : estimate.classification === "missing" || (!estimate.classification && mastery < 0.5)
        ? "remediation"
        : estimate.classification === "fragile" || (!estimate.classification && mastery < masteryThreshold)
          ? "consolidation"
          : "verification";
    const rationaleFr = independentVerification
      ? "Une production autonome en contexte reste à vérifier avant de confirmer cette compétence."
      : directEvidenceUnconfirmed
      ? "Première indication à vérifier avec un autre type de preuve avant de conclure."
      : stage === "remediation"
      ? "Fondation non maîtrisée repérée par le diagnostic."
      : stage === "consolidation"
        ? "Compétence partiellement maîtrisée à stabiliser."
        : "Compétence encore incertaine à vérifier avant de progresser.";
    return [{
      nodeId,
      nodeKey: node.key,
      label: node.label,
      section,
      position: index + 1,
      stage,
      mastery,
      uncertainty,
      prerequisiteNodeIds: [...(prerequisites.get(nodeId) ?? [])].sort(),
      rationaleFr,
    } satisfies DiagnosticLearningPathStep];
  });

  const sectionCounts = Object.fromEntries(
    DIAGNOSTIC_SECTIONS.map((section) => [
      section.key,
      steps.filter((step) => step.section === section.key).length,
    ]),
  ) as Record<DiagnosticSectionKey, number>;
  const firstStepBySection = Object.fromEntries(
    DIAGNOSTIC_SECTIONS.flatMap((section) => {
      const first = steps.find((step) => step.section === section.key);
      return first ? [[section.key, first.nodeId]] : [];
    }),
  ) as Partial<Record<DiagnosticSectionKey, string>>;

  return { steps, sectionCounts, firstStepBySection };
}

function comparePathCandidates(
  left: string,
  right: string,
  nodeById: Map<string, DiagnosticPathNode>,
  sectionByNode: Map<string, DiagnosticSectionKey>,
  estimates: Map<string, DiagnosticPathEstimate>,
) {
  const score = (nodeId: string) => {
    const estimate = estimates.get(nodeId);
    const stage = !estimate ? 2 : estimate.masteryProbability < 0.5 ? 0 : 1;
    const section = SECTION_INDEX.get(sectionByNode.get(nodeId) as DiagnosticSectionKey) ?? 99;
    return { stage, section, mastery: estimate?.masteryProbability ?? 0.5, key: nodeById.get(nodeId)?.key ?? nodeId };
  };
  const a = score(left);
  const b = score(right);
  return a.stage - b.stage || a.section - b.section || a.mastery - b.mastery || a.key.localeCompare(b.key);
}

function add(map: Map<string, string[]>, key: string, value: string) {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}
