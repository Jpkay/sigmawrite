import type { Strand } from "@/lib/graph/types";

/**
 * The placement diagnostic is deliberately broader than a lesson quiz. Each
 * section runs its own adaptive loop and may consume a different number of
 * probes. The protocol stops on evidence quality, never on a cosmetic global
 * question count.
 */
export const DIAGNOSTIC_SECTIONS = [
  {
    key: "reading_comprehension",
    labelFr: "Compréhension écrite",
    shortLabelFr: "Lecture",
    descriptionFr: "Comprendre, relier et justifier les informations d’un texte.",
    strands: ["comprehension_ecrite"],
    minProbes: 8,
    maxProbes: 20,
    minDistinctNodes: 6,
  },
  {
    key: "grammar",
    labelFr: "Grammaire",
    shortLabelFr: "Grammaire",
    descriptionFr: "Analyser la phrase, ses groupes et leurs relations.",
    strands: ["grammaire_syntaxe"],
    minProbes: 8,
    maxProbes: 20,
    minDistinctNodes: 6,
  },
  {
    key: "spelling",
    labelFr: "Orthographe",
    shortLabelFr: "Orthographe",
    descriptionFr: "Maîtriser l’orthographe lexicale et les accords grammaticaux.",
    strands: ["orthographe_lexicale", "orthographe_grammaticale"],
    minProbes: 8,
    maxProbes: 20,
    minDistinctNodes: 6,
  },
  {
    key: "conjugation",
    labelFr: "Conjugaison",
    shortLabelFr: "Conjugaison",
    descriptionFr: "Reconnaître, former et interpréter les temps et les modes.",
    strands: ["conjugaison"],
    minProbes: 8,
    maxProbes: 20,
    minDistinctNodes: 6,
  },
] as const satisfies ReadonlyArray<{
  key: string;
  labelFr: string;
  shortLabelFr: string;
  descriptionFr: string;
  strands: readonly Strand[];
  minProbes: number;
  maxProbes: number;
  minDistinctNodes: number;
}>;

export type DiagnosticSectionKey = (typeof DIAGNOSTIC_SECTIONS)[number]["key"];
export type DiagnosticSection = (typeof DIAGNOSTIC_SECTIONS)[number];

export const DIAGNOSTIC_PROTOCOL_VERSION = "graph-sections-v2";
export const DIAGNOSTIC_TAXONOMY_RELEASE_KEY = "french-taxonomy-v2";
export const DIAGNOSTIC_ITEM_BANK_RELEASE_KEY = "french-diagnostic-bank-v2";
export const DIAGNOSTIC_MIN_TOTAL_PROBES = DIAGNOSTIC_SECTIONS.reduce(
  (total, section) => total + section.minProbes,
  0,
);
export const DIAGNOSTIC_MAX_TOTAL_PROBES = DIAGNOSTIC_SECTIONS.reduce(
  (total, section) => total + section.maxProbes,
  0,
);

export const DIAGNOSTIC_STRANDS = [
  ...new Set(DIAGNOSTIC_SECTIONS.flatMap((section) => [...section.strands])),
] as Strand[];

export function diagnosticSection(key: DiagnosticSectionKey): DiagnosticSection {
  return DIAGNOSTIC_SECTIONS.find((section) => section.key === key) as DiagnosticSection;
}

export function sectionForStrand(strand: Strand): DiagnosticSectionKey | null {
  return DIAGNOSTIC_SECTIONS.find((section) =>
    (section.strands as readonly Strand[]).includes(strand)
  )?.key ?? null;
}

export type SectionStopReason =
  | "resolved"
  | "max_probes"
  | "low_information_gain"
  | "insufficient_items"
  | "continue";

export type DiagnosticSectionProgress = {
  key: DiagnosticSectionKey;
  probeCount: number;
  distinctNodesTested: number;
  confirmedNodeCount: number;
  targetNodeCount: number;
  resolvedNodeCount: number;
  meanUncertainty: number;
  nextInformationGain: number;
  eligibleItemCount: number;
  confidence?: "low" | "medium" | "high";
  status: "pending" | "active" | "completed" | "insufficient_items";
  stoppingReason?: Exclude<SectionStopReason, "continue">;
};

export type SectionDecision = {
  stop: boolean;
  reason: SectionStopReason;
  confidence: "low" | "medium" | "high";
  coverageRatio: number;
};

/**
 * A section is resolved only after it has both direct breadth and graph breadth.
 * Direct breadth prevents one lucky answer at a high node from closing a whole
 * domain; graph breadth lets a correct high-level probe prune prerequisites.
 */
export function evaluateDiagnosticSection(
  progress: DiagnosticSectionProgress,
  options: { uncertaintyTarget?: number; coverageTarget?: number; minimumInformationGain?: number } = {},
): SectionDecision {
  const config = diagnosticSection(progress.key);
  const uncertaintyTarget = options.uncertaintyTarget ?? 0.4;
  const coverageTarget = options.coverageTarget ?? 0.7;
  const minimumInformationGain = options.minimumInformationGain ?? 0.04;
  const coverageRatio = progress.targetNodeCount > 0
    ? Math.min(1, progress.resolvedNodeCount / progress.targetNodeCount)
    : 0;
  const directBreadth =
    progress.probeCount >= config.minProbes &&
    progress.distinctNodesTested >= config.minDistinctNodes &&
    progress.confirmedNodeCount >= 2;

  if (progress.probeCount >= config.maxProbes) {
    return {
      stop: true,
      reason: "max_probes",
      confidence: directBreadth && coverageRatio >= 0.5 ? "medium" : "low",
      coverageRatio,
    };
  }
  if (progress.eligibleItemCount === 0) {
    return {
      stop: true,
      reason: directBreadth && coverageRatio >= coverageTarget
        ? "low_information_gain"
        : "insufficient_items",
      confidence: directBreadth && coverageRatio >= coverageTarget ? "medium" : "low",
      coverageRatio,
    };
  }
  if (
    directBreadth &&
    coverageRatio >= coverageTarget &&
    progress.meanUncertainty <= uncertaintyTarget
  ) {
    return { stop: true, reason: "resolved", confidence: "high", coverageRatio };
  }
  if (
    directBreadth &&
    coverageRatio >= coverageTarget &&
    progress.nextInformationGain < minimumInformationGain
  ) {
    return {
      stop: true,
      reason: "low_information_gain",
      confidence: progress.meanUncertainty <= 0.5 ? "high" : "medium",
      coverageRatio,
    };
  }
  return {
    stop: false,
    reason: "continue",
    confidence: directBreadth ? "medium" : "low",
    coverageRatio,
  };
}

export function nextDiagnosticSection(
  progress: DiagnosticSectionProgress[],
): DiagnosticSectionKey | null {
  for (const section of DIAGNOSTIC_SECTIONS) {
    const current = progress.find((row) => row.key === section.key);
    if (!current || current.status === "pending" || current.status === "active") {
      return section.key;
    }
    if (current.status === "insufficient_items") return null;
  }
  return null;
}

export type DiagnosticBankSectionReadiness = {
  key: DiagnosticSectionKey;
  targetNodeCount: number;
  nodesWithItems: number;
  approvedItemCount: number;
  confirmableNodeCount?: number;
  productionItemCount?: number;
  promptFamilyCount?: number;
  difficultyTierCount?: number;
  ready?: boolean;
};

export function assessDiagnosticBankReadiness(
  sections: DiagnosticBankSectionReadiness[],
) {
  const results = DIAGNOSTIC_SECTIONS.map((config) => {
    const actual = sections.find((section) => section.key === config.key) ?? {
      key: config.key,
      targetNodeCount: 0,
      nodesWithItems: 0,
      approvedItemCount: 0,
    };
    const ready =
      actual.targetNodeCount >= config.minDistinctNodes &&
      actual.nodesWithItems >= config.minDistinctNodes &&
      actual.approvedItemCount >= config.minProbes &&
      (actual.confirmableNodeCount === undefined || actual.confirmableNodeCount >= 2) &&
      (actual.productionItemCount === undefined || actual.productionItemCount >= (
        config.key === "reading_comprehension" || config.key === "grammar" ? 2 : 4
      )) &&
      (actual.promptFamilyCount === undefined || actual.promptFamilyCount >= 2) &&
      (actual.difficultyTierCount === undefined || actual.difficultyTierCount >= 2) &&
      actual.ready !== false;
    return { ...actual, ready };
  });
  return { ready: results.every((section) => section.ready), sections: results };
}

export type DiagnosticTargetReason =
  | "initial_scope"
  | "stale"
  | "uncertain"
  | "prerequisite"
  | "calibration";

export type DiagnosticScopeNode = {
  id: string;
  sectionKey: DiagnosticSectionKey;
};

export type ReleasePinnedProgressionMapping = {
  nodeId: string;
  learnerMode: string;
  framework: string;
  levelMin: string | null;
};

export type ReleasePinnedPrerequisiteEdge = {
  sourceNodeId: string;
  targetNodeId: string;
  prerequisiteClass: "hard" | "soft" | null;
};

export type DiagnosticTarget = DiagnosticScopeNode & {
  targetReason: DiagnosticTargetReason;
};

/**
 * Limit a diagnostic to the active goal's progression ceiling, then retain the
 * transitive hard foundations needed to interpret those targets. Re-entry runs
 * focus on stale/uncertain nodes when a section still has enough breadth; a
 * section that would become too narrow explicitly falls back to its full goal
 * scope instead of silently weakening the protocol.
 */
export function selectDiagnosticTargets(input: {
  nodes: DiagnosticScopeNode[];
  mappings: ReleasePinnedProgressionMapping[];
  edges: ReleasePinnedPrerequisiteEdge[];
  goal: { learnerMode: string; framework: string; targetLevel: string };
  assessmentKind: "initial" | "reentry" | "calibration";
  focusNodeIds?: readonly string[];
  focusReason?: "stale" | "uncertain";
}) {
  const nodeById = new Map(input.nodes.map((node) => [node.id, node]));
  const targetRank = diagnosticLevelRank(input.goal.framework, input.goal.targetLevel);
  const goalSeeds = new Set<string>();

  if (targetRank !== null) {
    for (const mapping of input.mappings) {
      if (
        nodeById.has(mapping.nodeId)
        && mapping.learnerMode === input.goal.learnerMode
        && mapping.framework === input.goal.framework
      ) {
        const mappingRank = diagnosticLevelRank(mapping.framework, mapping.levelMin);
        if (mappingRank !== null && mappingRank <= targetRank) goalSeeds.add(mapping.nodeId);
      }
    }
  }

  const prerequisitesByTarget = new Map<string, string[]>();
  for (const edge of input.edges) {
    if (
      edge.prerequisiteClass !== "hard"
      || !nodeById.has(edge.sourceNodeId)
      || !nodeById.has(edge.targetNodeId)
    ) continue;
    const prerequisites = prerequisitesByTarget.get(edge.targetNodeId) ?? [];
    prerequisites.push(edge.sourceNodeId);
    prerequisitesByTarget.set(edge.targetNodeId, prerequisites);
  }

  const hardClosure = (seeds: Iterable<string>) => {
    const selected = new Set<string>();
    const pending = [...seeds].filter((nodeId) => nodeById.has(nodeId));
    while (pending.length) {
      const nodeId = pending.pop() as string;
      if (selected.has(nodeId)) continue;
      selected.add(nodeId);
      for (const prerequisite of prerequisitesByTarget.get(nodeId) ?? []) {
        if (!selected.has(prerequisite)) pending.push(prerequisite);
      }
    }
    return selected;
  };

  const goalScope = hardClosure(goalSeeds);
  const goalNodesBySection = new Map<DiagnosticSectionKey, DiagnosticScopeNode[]>();
  for (const section of DIAGNOSTIC_SECTIONS) goalNodesBySection.set(section.key, []);
  for (const nodeId of goalScope) {
    const node = nodeById.get(nodeId);
    if (node) goalNodesBySection.get(node.sectionKey)?.push(node);
  }
  const insufficientGoalSections = DIAGNOSTIC_SECTIONS
    .filter((section) => (goalNodesBySection.get(section.key)?.length ?? 0) < section.minDistinctNodes)
    .map((section) => section.key);

  const selectedById = new Map<string, DiagnosticTarget>();
  const fallbackSections: DiagnosticSectionKey[] = [];
  const addGoalSection = (sectionKey: DiagnosticSectionKey, reason: DiagnosticTargetReason) => {
    for (const node of goalNodesBySection.get(sectionKey) ?? []) {
      selectedById.set(node.id, { ...node, targetReason: reason });
    }
  };

  if (input.assessmentKind === "initial") {
    for (const section of DIAGNOSTIC_SECTIONS) addGoalSection(section.key, "initial_scope");
  } else if (input.assessmentKind === "reentry" && input.focusNodeIds?.length) {
    const directFocus = new Set(input.focusNodeIds.filter((nodeId) => goalScope.has(nodeId)));
    const focusedScope = hardClosure(directFocus);
    for (const section of DIAGNOSTIC_SECTIONS) {
      const focusedNodes = [...focusedScope]
        .map((nodeId) => nodeById.get(nodeId))
        .filter((node): node is DiagnosticScopeNode => node?.sectionKey === section.key);
      if (focusedNodes.length < section.minDistinctNodes) {
        fallbackSections.push(section.key);
        for (const node of goalNodesBySection.get(section.key) ?? []) {
          selectedById.set(node.id, {
            ...node,
            targetReason: directFocus.has(node.id)
              ? input.focusReason ?? "uncertain"
              : focusedScope.has(node.id)
                ? "prerequisite"
                : "calibration",
          });
        }
        continue;
      }
      for (const node of focusedNodes) {
        selectedById.set(node.id, {
          ...node,
          targetReason: directFocus.has(node.id)
            ? input.focusReason ?? "uncertain"
            : "prerequisite",
        });
      }
    }
  } else {
    for (const section of DIAGNOSTIC_SECTIONS) {
      fallbackSections.push(section.key);
      addGoalSection(section.key, "calibration");
    }
  }

  const sectionPosition = new Map(
    DIAGNOSTIC_SECTIONS.map((section, index) => [section.key, index]),
  );
  const targets = [...selectedById.values()].sort((left, right) =>
    (sectionPosition.get(left.sectionKey) ?? 99) - (sectionPosition.get(right.sectionKey) ?? 99)
    || left.id.localeCompare(right.id)
  );

  return {
    targets,
    goalNodeIds: [...goalScope].sort(),
    fallbackSections,
    insufficientGoalSections,
  };
}

export type DiagnosticEstimateSnapshot = {
  nodeId: string;
  masteryProbability: number;
  uncertainty: number;
  directEvidenceCount: number;
  evidenceCoverageConfirmed: boolean;
  evidenceKind: "direct" | "inferred_prerequisite" | "historical";
  classification?: "mastered" | "fragile" | "missing" | "unknown";
};

/**
 * Carry untested prior estimates into the final profile without upgrading them
 * to confirmed mastery. Current-run results replace history node by node and
 * are the only rows allowed to carry coverage-aware classifications.
 */
export function mergeDiagnosticEstimateSnapshots(
  priorState: unknown,
  currentRows: readonly Record<string, unknown>[],
) {
  const merged = new Map<string, DiagnosticEstimateSnapshot>();
  if (Array.isArray(priorState)) {
    for (const value of priorState) {
      if (!value || typeof value !== "object") continue;
      const row = value as Record<string, unknown>;
      const nodeId = typeof row.node_id === "string" ? row.node_id : null;
      if (!nodeId) continue;
      merged.set(nodeId, {
        nodeId,
        masteryProbability: boundedNumber(row.mastery_probability, 0.5),
        uncertainty: boundedNumber(row.uncertainty, 1),
        directEvidenceCount: nonNegativeInteger(row.evidence_count),
        evidenceCoverageConfirmed: false,
        evidenceKind: "historical",
      });
    }
  }

  const evidenceKinds = new Set(["direct", "inferred_prerequisite", "historical"]);
  const classifications = new Set(["mastered", "fragile", "missing", "unknown"]);
  for (const row of currentRows) {
    const nodeId = typeof row.node_id === "string" ? row.node_id : null;
    if (!nodeId) continue;
    const evidenceKind = evidenceKinds.has(String(row.evidence_kind))
      ? String(row.evidence_kind) as DiagnosticEstimateSnapshot["evidenceKind"]
      : "direct";
    const classification = classifications.has(String(row.classification))
      ? String(row.classification) as NonNullable<DiagnosticEstimateSnapshot["classification"]>
      : undefined;
    merged.set(nodeId, {
      nodeId,
      masteryProbability: boundedNumber(row.mastery_probability, 0.5),
      uncertainty: boundedNumber(row.uncertainty, 1),
      directEvidenceCount: nonNegativeInteger(row.direct_evidence_count),
      evidenceCoverageConfirmed: row.evidence_coverage_confirmed === true,
      evidenceKind,
      classification,
    });
  }
  return merged;
}

function diagnosticLevelRank(framework: string, level: string | null) {
  if (!level) return null;
  if (framework === "native_grade") {
    const grade = Number(level);
    return Number.isFinite(grade) ? grade : null;
  }
  if (framework === "cefr") {
    const rank = ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(level.toUpperCase());
    return rank < 0 ? null : rank + 1;
  }
  return null;
}

function boundedNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

function nonNegativeInteger(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}
