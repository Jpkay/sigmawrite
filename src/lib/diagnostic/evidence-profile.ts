import type { DiagnosticEvidenceExpectation } from "./item-bank";

export type DiagnosticEvidenceProfileRow = {
  nodeId: string;
  evidenceId: string;
  evidenceKey: string;
  actionFr: string;
  expectation: DiagnosticEvidenceExpectation;
  classification: "mastered" | "fragile" | "missing" | "unknown" | "deferred";
  masteryProbability: number;
  observedAccuracy: number | null;
  distinctItemCount: number;
  requiredDistinctItems: number;
  occasionCount: number;
  requiredOccasions: number;
  requiredAccuracy: number;
};

type EvidenceMembership = {
  recordId: string;
  stableKey: string;
  snapshot: Record<string, unknown>;
};

type EvidenceResult = {
  nodeId: string;
  evidenceId: string;
  classification: "mastered" | "fragile" | "missing";
  masteryProbability: number;
  observedAccuracy: number;
  distinctItemCount: number;
  occasionCount: number;
};

/**
 * Materialize every pinned evidence definition, including requirements that
 * the live diagnostic intentionally defers. This is the granular, auditable
 * layer beneath the node-level frontier classification.
 */
export function buildDiagnosticEvidenceProfile(input: {
  nodes: Array<{ id: string; key: string }>;
  memberships: EvidenceMembership[];
  results: EvidenceResult[];
}): DiagnosticEvidenceProfileRow[] {
  const nodeIdByKey = new Map(input.nodes.map((node) => [node.key, node.id]));
  const resultByEvidenceId = new Map(input.results.map((result) => [result.evidenceId, result]));
  return input.memberships.flatMap((membership) => {
    const separator = membership.stableKey.lastIndexOf(":");
    const nodeKey = separator < 0 ? "" : membership.stableKey.slice(0, separator);
    const nodeId = nodeIdByKey.get(nodeKey);
    if (!nodeId) return [];
    const snapshot = membership.snapshot;
    const criteria = isRecord(snapshot.successCriteria) ? snapshot.successCriteria : {};
    const expectation = evidenceExpectation(snapshot.expectation);
    if (!expectation) return [];
    const result = resultByEvidenceId.get(membership.recordId);
    const requiredDistinctItems = positiveInteger(
      criteria.minimumDistinctItems ?? criteria.minimumDistinctTexts,
      2,
    );
    const requiredOccasions = positiveInteger(criteria.minimumOccasions, 2);
    const requiredAccuracy = boundedNumber(criteria.minimumAccuracy, .85);
    return [{
      nodeId,
      evidenceId: membership.recordId,
      evidenceKey: typeof snapshot.key === "string"
        ? snapshot.key
        : membership.stableKey.slice(separator + 1),
      actionFr: typeof snapshot.actionFr === "string"
        ? snapshot.actionFr
        : "Preuve à vérifier.",
      expectation,
      classification: result?.classification
        ?? (expectation === "independent_production" ? "deferred" : "unknown"),
      masteryProbability: result?.masteryProbability ?? .5,
      observedAccuracy: result ? result.observedAccuracy : null,
      distinctItemCount: result?.distinctItemCount ?? 0,
      requiredDistinctItems,
      occasionCount: result?.occasionCount ?? 0,
      requiredOccasions,
      requiredAccuracy,
    } satisfies DiagnosticEvidenceProfileRow];
  }).sort((left, right) =>
    left.nodeId.localeCompare(right.nodeId)
    || left.expectation.localeCompare(right.expectation)
    || left.evidenceKey.localeCompare(right.evidenceKey)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function evidenceExpectation(value: unknown): DiagnosticEvidenceExpectation | null {
  return value === "receptive" || value === "controlled_production" || value === "independent_production"
    ? value
    : null;
}

function positiveInteger(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.ceil(number) : fallback;
}

function boundedNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}
