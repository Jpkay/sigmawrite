import type { FrontierReport, NodeClass } from "@/lib/diagnostic/report";
import type { Strand } from "./types";

export type StudentGraphPathStage = "remediation" | "consolidation" | "verification";
export type StudentGraphPathStatus = "pending" | "available" | "in_progress" | "completed" | "skipped";
export type StudentGraphPrerequisiteClass = "hard" | "soft" | "unknown";

export type StudentGraphNode = {
  id: string;
  key: string;
  label: string;
  strand: Strand;
  classification: NodeClass;
  isReadyToLearn: boolean;
  masteryProbability: number;
  uncertainty: number;
  evidenceCount: number;
  blockedBy: string[];
  path: {
    position: number;
    stage: StudentGraphPathStage;
    status: StudentGraphPathStatus;
    rationaleFr: string;
    requiredEvidenceExpectation: "receptive" | "controlled_production" | "independent_production" | null;
  } | null;
};

export type StudentGraphEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: "prerequisite";
  prerequisiteClass: StudentGraphPrerequisiteClass;
  rationale: string | null;
};

export type StudentGraphView = {
  meta: {
    releaseId: string | null;
    runId: string | null;
    nodeCount: number;
    edgeCount: number;
    readyCount: number;
    pathStepCount: number;
  };
  nodes: StudentGraphNode[];
  edges: StudentGraphEdge[];
};

export type StudentGraphPathInput = {
  nodeId: string;
  position: number;
  stage: StudentGraphPathStage;
  status: StudentGraphPathStatus;
  rationaleFr: string;
  requiredEvidenceExpectation: "receptive" | "controlled_production" | "independent_production" | null;
};

export type StudentGraphEdgeInput = {
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: "prerequisite";
  prerequisiteClass?: "hard" | "soft" | null;
  rationale?: string | null;
};

type StudentGraphEstimateInput = {
  masteryProbability: number;
  uncertainty: number;
  evidenceCount: number;
};

export const GRAPH_STRAND_LABELS: Partial<Record<Strand, string>> = {
  comprehension_ecrite: "Comprendre un texte",
  conjugaison: "Conjuguer",
  grammaire_syntaxe: "Construire des phrases",
  orthographe_lexicale: "Orthographier les mots",
  orthographe_grammaticale: "Accords et orthographe",
  lexique: "Lexique",
  analyse: "Analyser",
  comprehension_orale: "Comprendre à l'oral",
  production_orale: "S'exprimer à l'oral",
  expression_ecrite: "Écrire",
};

export const GRAPH_STRAND_CENTERS: Partial<Record<Strand, { x: number; y: number }>> = {
  comprehension_ecrite: { x: 225, y: 190 },
  grammaire_syntaxe: { x: 595, y: 175 },
  conjugaison: { x: 955, y: 300 },
  orthographe_lexicale: { x: 300, y: 535 },
  orthographe_grammaticale: { x: 690, y: 535 },
  lexique: { x: 155, y: 405 },
  analyse: { x: 480, y: 345 },
  comprehension_orale: { x: 1020, y: 130 },
  production_orale: { x: 1060, y: 535 },
  expression_ecrite: { x: 840, y: 160 },
};

export function buildStudentGraphView(input: {
  releaseId: string | null;
  runId: string | null;
  nodes: Array<{ id: string; key: string; label: string; strand: Strand }>;
  edges: StudentGraphEdgeInput[];
  estimates: Map<string, StudentGraphEstimateInput>;
  report: FrontierReport;
  pathSteps?: StudentGraphPathInput[];
}): StudentGraphView {
  const nodeIds = new Set(input.nodes.map((node) => node.id));
  const classificationById = new Map<string, NodeClass>();
  for (const classification of ["mastered", "fragile", "missing", "unknown"] as const) {
    for (const nodeId of input.report[classification]) {
      if (nodeIds.has(nodeId)) classificationById.set(nodeId, classification);
    }
  }
  const ready = new Set(input.report.readyToLearn.filter((nodeId) => nodeIds.has(nodeId)));
  const blockers = new Map(input.report.blockers
    .filter((row) => nodeIds.has(row.nodeId))
    .map((row) => [row.nodeId, row.blockedBy.filter((nodeId) => nodeIds.has(nodeId))]));
  const pathByNode = new Map((input.pathSteps ?? [])
    .filter((step) => nodeIds.has(step.nodeId))
    .map((step) => [step.nodeId, step]));

  const nodes = input.nodes.map((node) => {
    const estimate = input.estimates.get(node.id);
    const path = pathByNode.get(node.id);
    return {
      ...node,
      classification: classificationById.get(node.id) ?? "unknown",
      isReadyToLearn: ready.has(node.id),
      masteryProbability: estimate?.masteryProbability ?? 0,
      uncertainty: estimate?.uncertainty ?? 1,
      evidenceCount: estimate?.evidenceCount ?? 0,
      blockedBy: blockers.get(node.id) ?? [],
      path: path ? {
        position: path.position,
        stage: path.stage,
        status: path.status,
        rationaleFr: path.rationaleFr,
        requiredEvidenceExpectation: path.requiredEvidenceExpectation,
      } : null,
    } satisfies StudentGraphNode;
  });

  const edges = input.edges
    .filter((edge) => nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId))
    .map((edge) => ({
      id: `${edge.sourceNodeId}:${edge.targetNodeId}:prerequisite`,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      edgeType: "prerequisite" as const,
      prerequisiteClass: (edge.prerequisiteClass ?? "unknown") as StudentGraphPrerequisiteClass,
      rationale: edge.rationale ?? null,
    } satisfies StudentGraphEdge));

  return {
    meta: {
      releaseId: input.releaseId,
      runId: input.runId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      readyCount: ready.size,
      pathStepCount: pathByNode.size,
    },
    nodes,
    edges,
  };
}

export function selectPersonalizedNodeIds(view: StudentGraphView, limit = 24): Set<string> {
  const activePath = view.nodes
    .filter((node) => node.path && !["completed", "skipped"].includes(node.path.status))
    .sort((a, b) => (a.path?.position ?? Infinity) - (b.path?.position ?? Infinity));
  const fallback = view.nodes
    .filter((node) => node.isReadyToLearn)
    .sort(compareGraphNodes);
  const gaps = view.nodes
    .filter((node) => node.classification === "missing" || node.classification === "fragile")
    .sort(compareGraphNodes);
  const seeds = (activePath.length ? activePath : fallback.length ? fallback : gaps.length ? gaps : view.nodes)
    .slice(0, Math.min(12, limit));
  const selected = new Set(seeds.map((node) => node.id));

  const connectedEdges = view.edges
    .filter((edge) => selected.has(edge.sourceNodeId) || selected.has(edge.targetNodeId))
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const edge of connectedEdges) {
    if (selected.size >= limit) break;
    selected.add(edge.sourceNodeId);
    if (selected.size >= limit) break;
    selected.add(edge.targetNodeId);
  }
  return selected;
}

type GraphLayoutNode = Pick<StudentGraphNode, "id" | "key" | "strand"> & Partial<Pick<StudentGraphNode, "path" | "isReadyToLearn">>;

export function layoutStudentGraphNodes(nodes: GraphLayoutNode[]): Record<string, { x: number; y: number }> {
  const byStrand = new Map<Strand, GraphLayoutNode[]>();
  for (const node of nodes) {
    const group = byStrand.get(node.strand) ?? [];
    group.push(node);
    byStrand.set(node.strand, group);
  }

  const positions: Record<string, { x: number; y: number }> = {};
  for (const [strand, group] of byStrand) {
    const center = GRAPH_STRAND_CENTERS[strand] ?? { x: 600, y: 360 };
    group.sort(compareGraphNodes);
    for (const [index, node] of group.entries()) {
      const angle = index * 2.399963229728653 + stableFraction(strand) * Math.PI;
      const radius = index === 0 ? 0 : 22 + 22 * Math.sqrt(index);
      positions[node.id] = {
        x: center.x + Math.cos(angle) * radius * 1.18,
        y: center.y + Math.sin(angle) * radius * 0.82,
      };
    }
  }
  return positions;
}

function compareGraphNodes(a: GraphLayoutNode, b: GraphLayoutNode) {
  const pathDifference = (a.path?.position ?? Infinity) - (b.path?.position ?? Infinity);
  if (pathDifference) return pathDifference;
  if (a.isReadyToLearn !== b.isReadyToLearn) return a.isReadyToLearn ? -1 : 1;
  return a.key.localeCompare(b.key);
}

function stableFraction(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return (hash % 1000) / 1000;
}
