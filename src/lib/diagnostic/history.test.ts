import { describe, expect, it } from "vitest";
import {
  buildDiagnosticPriorStateSnapshot,
  mergeDiagnosticHistorySnapshots,
} from "./history";

const identity = {
  taxonomyReleaseId: "taxonomy-v2-id",
  protocolVersion: "graph-sections-v2",
};

describe("diagnostic re-entry history", () => {
  it("preserves compatible coverage confirmation for an unprobed node", () => {
    const snapshot = buildDiagnosticPriorStateSnapshot({
      ...identity,
      globalEstimates: [
        { node_id: "confirmed", mastery_probability: 0.96, uncertainty: 0.08, evidence_count: 20 },
        { node_id: "global-only", mastery_probability: 0.91, uncertainty: 0.2, evidence_count: 7 },
      ],
      latestCompletedDiagnostic: {
        ...identity,
        runId: "completed-run",
        completedAt: "2026-06-01T10:00:00.000Z",
        resultRows: [{
          node_id: "confirmed",
          mastery_probability: 0.9,
          uncertainty: 0.12,
          direct_evidence_count: 4,
          evidence_coverage_confirmed: true,
          evidence_kind: "direct",
          classification: "mastered",
        }],
      },
    });

    const merged = mergeDiagnosticHistorySnapshots(snapshot, [], identity);
    expect(merged.get("confirmed")).toMatchObject({
      masteryProbability: 0.9,
      evidenceCoverageConfirmed: true,
      evidenceKind: "direct",
      classification: "mastered",
    });
    expect(merged.get("global-only")).toMatchObject({
      masteryProbability: 0.91,
      evidenceCoverageConfirmed: false,
      evidenceKind: "historical",
    });
  });

  it("keeps current-run evidence authoritative over compatible history", () => {
    const snapshot = buildDiagnosticPriorStateSnapshot({
      ...identity,
      globalEstimates: [],
      latestCompletedDiagnostic: {
        ...identity,
        runId: "completed-run",
        completedAt: null,
        resultRows: [{
          node_id: "retested",
          mastery_probability: 0.92,
          uncertainty: 0.1,
          direct_evidence_count: 4,
          evidence_coverage_confirmed: true,
          evidence_kind: "direct",
          classification: "mastered",
        }],
      },
    });
    const merged = mergeDiagnosticHistorySnapshots(snapshot, [{
      node_id: "retested",
      mastery_probability: 0.35,
      uncertainty: 0.18,
      direct_evidence_count: 4,
      evidence_coverage_confirmed: true,
      evidence_kind: "direct",
      classification: "missing",
    }], identity);

    expect(merged.get("retested")).toMatchObject({
      masteryProbability: 0.35,
      evidenceCoverageConfirmed: true,
      classification: "missing",
    });
  });

  it.each([
    { taxonomyReleaseId: "other-release", protocolVersion: identity.protocolVersion },
    { taxonomyReleaseId: identity.taxonomyReleaseId, protocolVersion: "other-protocol" },
  ])("rejects confirmation from incompatible history: $taxonomyReleaseId/$protocolVersion", (historyIdentity) => {
    const snapshot = buildDiagnosticPriorStateSnapshot({
      ...identity,
      globalEstimates: [{
        node_id: "node",
        mastery_probability: 0.8,
        uncertainty: 0.3,
        evidence_count: 5,
      }],
      latestCompletedDiagnostic: {
        ...historyIdentity,
        runId: "incompatible-run",
        completedAt: null,
        resultRows: [{
          node_id: "node",
          mastery_probability: 0.99,
          uncertainty: 0.01,
          direct_evidence_count: 10,
          evidence_coverage_confirmed: true,
          evidence_kind: "direct",
          classification: "mastered",
        }],
      },
    });

    const merged = mergeDiagnosticHistorySnapshots(snapshot, [], identity);
    expect(merged.get("node")).toMatchObject({
      masteryProbability: 0.8,
      evidenceCoverageConfirmed: false,
      evidenceKind: "historical",
    });
    expect(merged.get("node")?.classification).toBeUndefined();
  });

  it("remains backward compatible with legacy array snapshots", () => {
    const merged = mergeDiagnosticHistorySnapshots([{
      node_id: "legacy",
      mastery_probability: 0.88,
      uncertainty: 0.2,
      evidence_count: 8,
    }], [], identity);

    expect(merged.get("legacy")).toMatchObject({
      masteryProbability: 0.88,
      evidenceCoverageConfirmed: false,
      evidenceKind: "historical",
    });
  });
});
