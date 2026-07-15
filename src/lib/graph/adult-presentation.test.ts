import { describe, expect, it } from "vitest";
import { adultGraphConfidenceLabel, adultGraphStatusLabel, adultGraphSummary } from "./adult-presentation";
import type { StudentGraphView } from "./presentation";

describe("adult graph presentation", () => {
  it("uses supportive parent language and precise teacher language", () => {
    expect(adultGraphStatusLabel("fragile", "parent", "fr")).toBe("En consolidation");
    expect(adultGraphStatusLabel("fragile", "teacher", "fr")).toBe("Fragile");
    expect(adultGraphStatusLabel("missing", "parent", "en")).toBe("To build");
  });

  it("turns uncertainty into plain-language evidence confidence", () => {
    expect(adultGraphConfidenceLabel(0.1, "fr")).toBe("Preuves solides");
    expect(adultGraphConfidenceLabel(0.35, "en")).toBe("Developing evidence");
    expect(adultGraphConfidenceLabel(0.8, "fr")).toBe("Preuves limitées");
  });

  it("summarizes only learner-facing graph states", () => {
    const node = (id: string, classification: "mastered" | "fragile" | "missing" | "unknown", ready = false, path = false) => ({
      id, key: id, label: id, strand: "conjugaison" as const, classification, isReadyToLearn: ready,
      masteryProbability: 0.5, uncertainty: 0.4, evidenceCount: 1, blockedBy: [],
      path: path ? { position: 1, stage: "consolidation" as const, status: "available" as const, rationaleFr: "Next", requiredEvidenceExpectation: null } : null,
    });
    const view: StudentGraphView = {
      meta: { releaseId: "r", runId: "d", nodeCount: 4, edgeCount: 0, readyCount: 1, pathStepCount: 1 },
      nodes: [node("a", "mastered"), node("b", "fragile", true, true), node("c", "missing"), node("d", "unknown")],
      edges: [],
    };
    expect(adultGraphSummary(view)).toEqual({ strengths: 1, consolidating: 1, foundations: 1, ready: 1, pathSteps: 1 });
  });
});
