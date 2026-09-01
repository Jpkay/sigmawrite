import { describe, expect, it } from "vitest";
import type { Strand } from "@/lib/graph/types";
import { buildDiagnosticLearningPath, type DiagnosticPathEstimate } from "./learning-path";

const nodes = [
  ["spell-root", "orthographe_lexicale"],
  ["spell-target", "orthographe_lexicale"],
  ["grammar-root", "grammaire_syntaxe"],
  ["grammar-target", "grammaire_syntaxe"],
  ["reading", "comprehension_ecrite"],
  ["conjugation", "conjugaison"],
].map(([id, strand]) => ({ id, key: id, label: id, strand: strand as Strand }));

const edges = [
  { sourceNodeId: "spell-root", targetNodeId: "spell-target", prerequisiteClass: "hard" as const },
  { sourceNodeId: "grammar-root", targetNodeId: "grammar-target", prerequisiteClass: "hard" as const },
];

function estimate(masteryProbability: number, uncertainty = 0.25): DiagnosticPathEstimate {
  return { masteryProbability, uncertainty, directEvidenceCount: 2, evidenceKind: "direct" };
}

describe("graph-derived diagnostic learning path", () => {
  it("orders every unmastered prerequisite before the competency it unlocks", () => {
    const path = buildDiagnosticLearningPath({
      nodes,
      edges,
      estimates: new Map([
        ["spell-root", estimate(0.2)],
        ["spell-target", estimate(0.4)],
        ["grammar-root", estimate(0.55)],
        ["grammar-target", estimate(0.7)],
        ["reading", estimate(0.9)],
        ["conjugation", estimate(0.9)],
      ]),
    });
    const ids = path.steps.map((step) => step.nodeId);
    expect(ids.indexOf("spell-root")).toBeLessThan(ids.indexOf("spell-target"));
    expect(ids.indexOf("grammar-root")).toBeLessThan(ids.indexOf("grammar-target"));
    expect(ids).not.toContain("reading");
    expect(path.sectionCounts.spelling).toBe(2);
  });

  it("does not silently call an untested node missing", () => {
    const path = buildDiagnosticLearningPath({ nodes, edges, estimates: new Map() });
    expect(path.steps.every((step) => step.stage === "verification")).toBe(true);
    expect(path.steps.every((step) => step.mastery === 0.5 && step.uncertainty === 1)).toBe(true);
  });

  it("keeps a high score in verification when required evidence types are missing", () => {
    const path = buildDiagnosticLearningPath({
      nodes: [nodes[4]],
      edges: [],
      estimates: new Map([["reading", {
        ...estimate(0.92),
        evidenceCoverageConfirmed: false,
      }]]),
    });
    expect(path.steps).toHaveLength(1);
    expect(path.steps[0]).toMatchObject({ nodeId: "reading", stage: "verification" });
  });

  it("does not omit a node whose aggregate score hides a weak evidence mode", () => {
    const path = buildDiagnosticLearningPath({
      nodes: [nodes[2]],
      edges: [],
      estimates: new Map([["grammar-root", {
        ...estimate(0.9),
        evidenceCoverageConfirmed: true,
        classification: "fragile",
      }]]),
    });
    expect(path.steps).toHaveLength(1);
    expect(path.steps[0]).toMatchObject({ nodeId: "grammar-root", stage: "consolidation" });
  });

  it("retains independently produced evidence as an explicit verification step", () => {
    const path = buildDiagnosticLearningPath({
      nodes: [nodes[5]],
      edges: [],
      estimates: new Map([["conjugation", {
        ...estimate(0.94),
        evidenceCoverageConfirmed: true,
        classification: "mastered",
      }]]),
      requiresIndependentVerification: new Set(["conjugation"]),
    });
    expect(path.steps).toHaveLength(1);
    expect(path.steps[0]).toMatchObject({ nodeId: "conjugation", stage: "verification" });
    expect(path.steps[0].rationaleFr).toContain("production autonome");
  });

  it("preserves cross-section hard prerequisites", () => {
    const path = buildDiagnosticLearningPath({
      nodes,
      edges: [{ sourceNodeId: "grammar-root", targetNodeId: "conjugation", prerequisiteClass: "hard" }],
      estimates: new Map([
        ["grammar-root", estimate(0.3)],
        ["conjugation", estimate(0.4)],
      ]),
    });
    const ids = path.steps.map((step) => step.nodeId);
    expect(ids.indexOf("grammar-root")).toBeLessThan(ids.indexOf("conjugation"));
  });
});
