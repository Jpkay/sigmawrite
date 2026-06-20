import { describe, expect, it } from "vitest";
import { validateGraph } from "./invariants";
import type { CompetencyEdge, CompetencyNode } from "./types";

const node = (
  id: string,
  over: Partial<CompetencyNode> = {}
): CompetencyNode => ({
  id,
  key: id,
  strand: "conjugaison",
  labelFr: id,
  atomicityLevel: 3,
  ...over,
});

const prereq = (s: string, t: string): CompetencyEdge => ({
  sourceNodeId: s,
  targetNodeId: t,
  edgeType: "prerequisite",
});

describe("Gate-1 graph validation", () => {
  it("passes a clean monotone DAG", () => {
    const nodes = [
      node("a", { cefrMin: "A1", nativeGradeMin: 6 }),
      node("b", { cefrMin: "A2", nativeGradeMin: 7 }),
      node("c", { cefrMin: "B1", nativeGradeMin: 8 }),
    ];
    const edges = [prereq("a", "b"), prereq("b", "c")];
    const { ok, violations } = validateGraph(nodes, edges);
    expect(ok).toBe(true);
    expect(violations).toHaveLength(0);
  });

  it("hard-rejects a cycle", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [prereq("a", "b"), prereq("b", "c"), prereq("c", "a")];
    const { ok, violations } = validateGraph(nodes, edges);
    expect(ok).toBe(false);
    expect(violations.some((v) => v.code === "cycle")).toBe(true);
  });

  it("hard-rejects a dangling edge", () => {
    const nodes = [node("a")];
    const edges = [prereq("a", "ghost")];
    const { ok, violations } = validateGraph(nodes, edges);
    expect(ok).toBe(false);
    expect(violations.some((v) => v.code === "dangling_edge")).toBe(true);
  });

  it("warns (not rejects) on CEFR non-monotonicity", () => {
    const nodes = [
      node("hard", { cefrMin: "B2" }),
      node("easy", { cefrMin: "A1" }),
    ];
    const edges = [prereq("hard", "easy")]; // a B2 prereq for an A1 node
    const { ok, violations } = validateGraph(nodes, edges);
    expect(ok).toBe(true); // warning only
    expect(violations.some((v) => v.code === "cefr_monotonicity")).toBe(true);
  });

  it("warns on grade non-monotonicity", () => {
    const nodes = [
      node("hard", { nativeGradeMin: 10 }),
      node("easy", { nativeGradeMin: 6 }),
    ];
    const { violations } = validateGraph(nodes, [prereq("hard", "easy")]);
    expect(violations.some((v) => v.code === "grade_monotonicity")).toBe(true);
  });
});
