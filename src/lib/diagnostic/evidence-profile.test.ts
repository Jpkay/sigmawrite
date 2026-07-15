import { describe, expect, it } from "vitest";
import { buildDiagnosticEvidenceProfile } from "./evidence-profile";

describe("granular diagnostic evidence profile", () => {
  it("keeps exact pinned definitions separate and preserves their own minima", () => {
    const profile = buildDiagnosticEvidenceProfile({
      nodes: [{ id: "node-1", key: "accord" }],
      memberships: [
        {
          recordId: "ev-read",
          stableKey: "accord:recognition",
          snapshot: {
            key: "recognition",
            actionFr: "Reconnaître l’accord correct.",
            expectation: "receptive",
            successCriteria: { minimumDistinctItems: 3, minimumOccasions: 2, minimumAccuracy: .8 },
          },
        },
        {
          recordId: "ev-write",
          stableKey: "accord:production",
          snapshot: {
            key: "production",
            actionFr: "Produire l’accord correct.",
            expectation: "controlled_production",
            successCriteria: { minimumDistinctItems: 3, minimumOccasions: 2, minimumAccuracy: .8 },
          },
        },
      ],
      results: [{
        nodeId: "node-1",
        evidenceId: "ev-read",
        classification: "mastered",
        masteryProbability: .91,
        observedAccuracy: 1,
        distinctItemCount: 3,
        occasionCount: 3,
      }],
    });
    expect(profile).toHaveLength(2);
    expect(profile[0]).toMatchObject({ evidenceKey: "production", classification: "unknown", requiredDistinctItems: 3 });
    expect(profile[1]).toMatchObject({ evidenceKey: "recognition", classification: "mastered", observedAccuracy: 1 });
  });

  it("surfaces independent production as deferred rather than silently mastered", () => {
    const [row] = buildDiagnosticEvidenceProfile({
      nodes: [{ id: "node-1", key: "transfer" }],
      memberships: [{
        recordId: "ev-independent",
        stableKey: "transfer:connected-writing",
        snapshot: {
          key: "connected-writing",
          actionFr: "Réutiliser la compétence dans un texte autonome.",
          expectation: "independent_production",
          successCriteria: { minimumDistinctTexts: 3 },
        },
      }],
      results: [],
    });
    expect(row).toMatchObject({ classification: "deferred", requiredDistinctItems: 3 });
  });
});
