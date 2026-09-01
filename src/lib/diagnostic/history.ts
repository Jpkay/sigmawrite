import {
  mergeDiagnosticEstimateSnapshots,
  type DiagnosticEstimateSnapshot,
} from "./protocol";

const SNAPSHOT_SCHEMA = "diagnostic-prior-state-v2";

type PinnedDiagnosticIdentity = {
  taxonomyReleaseId: string;
  protocolVersion: string;
};

export type CompatibleDiagnosticHistory = PinnedDiagnosticIdentity & {
  runId: string;
  completedAt: string | null;
  resultRows: readonly Record<string, unknown>[];
};

type FrozenDiagnosticPriorState = {
  schema_version: typeof SNAPSHOT_SCHEMA;
  taxonomy_release_id: string;
  protocol_version: string;
  global_estimates: readonly Record<string, unknown>[];
  compatible_diagnostic: {
    run_id: string;
    taxonomy_release_id: string;
    protocol_version: string;
    completed_at: string | null;
    result_rows: readonly Record<string, unknown>[];
  } | null;
};

/**
 * Freeze longitudinal estimates together with the latest compatible
 * coverage-aware diagnostic result. Compatibility is checked here as well as
 * in the database query so a caller cannot accidentally carry confirmation
 * semantics across a taxonomy or protocol boundary.
 */
export function buildDiagnosticPriorStateSnapshot(input: PinnedDiagnosticIdentity & {
  globalEstimates: readonly Record<string, unknown>[];
  latestCompletedDiagnostic?: CompatibleDiagnosticHistory | null;
}): FrozenDiagnosticPriorState {
  const history = input.latestCompletedDiagnostic;
  const compatible = history
    && history.taxonomyReleaseId === input.taxonomyReleaseId
    && history.protocolVersion === input.protocolVersion
    ? {
        run_id: history.runId,
        taxonomy_release_id: history.taxonomyReleaseId,
        protocol_version: history.protocolVersion,
        completed_at: history.completedAt,
        result_rows: history.resultRows,
      }
    : null;
  return {
    schema_version: SNAPSHOT_SCHEMA,
    taxonomy_release_id: input.taxonomyReleaseId,
    protocol_version: input.protocolVersion,
    global_estimates: input.globalEstimates,
    compatible_diagnostic: compatible,
  };
}

/**
 * Rehydrate the frozen baseline for path/frontier generation. A compatible
 * completed diagnostic overlays global estimates, preserving its evidence
 * coverage and classification for nodes this run did not probe. Current-run
 * rows are applied last and are therefore always authoritative.
 */
export function mergeDiagnosticHistorySnapshots(
  priorState: unknown,
  currentRows: readonly Record<string, unknown>[],
  expected: PinnedDiagnosticIdentity,
) {
  if (!isFrozenDiagnosticPriorState(priorState)) {
    return mergeDiagnosticEstimateSnapshots(priorState, currentRows);
  }

  const merged = mergeDiagnosticEstimateSnapshots(
    priorState.global_estimates,
    [],
  );
  const history = priorState.compatible_diagnostic;
  if (
    priorState.taxonomy_release_id === expected.taxonomyReleaseId
    && priorState.protocol_version === expected.protocolVersion
    && history?.taxonomy_release_id === expected.taxonomyReleaseId
    && history.protocol_version === expected.protocolVersion
  ) {
    overlay(merged, mergeDiagnosticEstimateSnapshots([], history.result_rows));
  }
  overlay(merged, mergeDiagnosticEstimateSnapshots([], currentRows));
  return merged;
}

function isFrozenDiagnosticPriorState(value: unknown): value is FrozenDiagnosticPriorState {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return row.schema_version === SNAPSHOT_SCHEMA
    && typeof row.taxonomy_release_id === "string"
    && typeof row.protocol_version === "string"
    && Array.isArray(row.global_estimates)
    && (row.compatible_diagnostic === null || (
      !!row.compatible_diagnostic
      && typeof row.compatible_diagnostic === "object"
      && typeof (row.compatible_diagnostic as Record<string, unknown>).run_id === "string"
      && typeof (row.compatible_diagnostic as Record<string, unknown>).taxonomy_release_id === "string"
      && typeof (row.compatible_diagnostic as Record<string, unknown>).protocol_version === "string"
      && Array.isArray((row.compatible_diagnostic as Record<string, unknown>).result_rows)
    ));
}

function overlay(
  target: Map<string, DiagnosticEstimateSnapshot>,
  source: Map<string, DiagnosticEstimateSnapshot>,
) {
  for (const [nodeId, estimate] of source) target.set(nodeId, estimate);
}
