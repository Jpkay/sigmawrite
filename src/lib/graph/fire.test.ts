import { describe, expect, it } from "vitest";
import { fireImplicitUpdates, type EncompassingEdge, type FireEstimate } from "./fire";

const now = Date.parse("2026-07-31T00:00:00Z");
const DAY = 86_400_000;
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString();

// passé composé (avoir) encompasses présent-aux and participle formation;
// participle formation encompasses nothing further here.
const edges: EncompassingEdge[] = [
  { sourceNodeId: "pc_avoir", targetNodeId: "present_aux", strength: 0.8 },
  { sourceNodeId: "pc_avoir", targetNodeId: "pp_formation", strength: 0.9 },
  { sourceNodeId: "narration", targetNodeId: "pc_avoir", strength: 0.6 },
];

const estimate = (over: Partial<FireEstimate> = {}): FireEstimate => ({
  mastery: 0.9,
  memoryStability: 10,
  memoryDifficulty: 5,
  lastEvidenceAt: daysAgo(10),
  ...over,
});

describe("fireImplicitUpdates — success flows down", () => {
  it("credits encompassed sub-skills with fractional weight", () => {
    const updates = fireImplicitUpdates({
      practicedNodeId: "pc_avoir", correct: true, nowMs: now, edges,
      estimates: new Map([["present_aux", estimate()], ["pp_formation", estimate()]]),
    });
    const byNode = new Map(updates.map((u) => [u.nodeId, u]));
    expect(byNode.get("present_aux")?.weight).toBeCloseTo(0.8, 5);
    expect(byNode.get("pp_formation")?.weight).toBeCloseTo(0.9, 5);
    // does not flow upward to the encompassing narration node
    expect(byNode.has("narration")).toBe(false);
  });

  it("multiplies strengths along multi-hop paths", () => {
    const updates = fireImplicitUpdates({
      practicedNodeId: "narration", correct: true, nowMs: now, edges,
      estimates: new Map([["pc_avoir", estimate()], ["present_aux", estimate()]]),
    });
    const byNode = new Map(updates.map((u) => [u.nodeId, u]));
    expect(byNode.get("pc_avoir")?.weight).toBeCloseTo(0.6, 5);
    expect(byNode.get("present_aux")?.weight).toBeCloseTo(0.48, 5); // 0.6 × 0.8
  });

  it("refreshes memory stability (the review-avalanche prevention)", () => {
    const updates = fireImplicitUpdates({
      practicedNodeId: "pc_avoir", correct: true, nowMs: now, edges,
      estimates: new Map([["pp_formation", estimate()]]),
    });
    expect(updates[0].memoryStability).toBeGreaterThan(10);
  });

  it("discards credit for weak sub-skills (mastery < 0.5)", () => {
    const updates = fireImplicitUpdates({
      practicedNodeId: "pc_avoir", correct: true, nowMs: now, edges,
      estimates: new Map([["pp_formation", estimate({ mastery: 0.3 })]]),
    });
    expect(updates).toHaveLength(0);
  });

  it("never confirms mastery implicitly: sub-threshold stays capped at 0.84", () => {
    const updates = fireImplicitUpdates({
      practicedNodeId: "pc_avoir", correct: true, nowMs: now, edges,
      estimates: new Map([["pp_formation", estimate({ mastery: 0.83 })]]),
    });
    expect(updates[0].mastery).toBeLessThanOrEqual(0.84);
  });

  it("skips nodes without an existing estimate", () => {
    const updates = fireImplicitUpdates({
      practicedNodeId: "pc_avoir", correct: true, nowMs: now, edges,
      estimates: new Map(),
    });
    expect(updates).toHaveLength(0);
  });

  it("does not fabricate memory state where none exists", () => {
    const updates = fireImplicitUpdates({
      practicedNodeId: "pc_avoir", correct: true, nowMs: now, edges,
      estimates: new Map([["pp_formation", estimate({ memoryStability: null, memoryDifficulty: null })]]),
    });
    expect(updates[0].memoryStability).toBeUndefined();
    expect(updates[0].mastery).toBeGreaterThan(0.9);
  });
});

describe("fireImplicitUpdates — failure flows up", () => {
  it("penalizes the skills that encompass the failed sub-skill", () => {
    const updates = fireImplicitUpdates({
      practicedNodeId: "pp_formation", correct: false, nowMs: now, edges,
      estimates: new Map([["pc_avoir", estimate()], ["narration", estimate()]]),
    });
    const byNode = new Map(updates.map((u) => [u.nodeId, u]));
    expect(byNode.get("pc_avoir")?.mastery).toBeLessThan(0.9);
    expect(byNode.get("pc_avoir")?.weight).toBeCloseTo(0.9, 5);
    // two hops: pp_formation → pc_avoir (0.9) → narration (0.6)
    expect(byNode.get("narration")?.weight).toBeCloseTo(0.54, 5);
    expect(byNode.get("narration")?.mastery).toBeLessThan(0.9);
  });

  it("failure penalty applies even to weak nodes (no floor on bad news)", () => {
    const updates = fireImplicitUpdates({
      practicedNodeId: "pp_formation", correct: false, nowMs: now, edges,
      estimates: new Map([["pc_avoir", estimate({ mastery: 0.4 })]]),
    });
    expect(updates[0].mastery).toBeLessThan(0.4);
  });
});

describe("bounds", () => {
  it("respects maxDepth and minWeight cutoffs", () => {
    const chain: EncompassingEdge[] = [
      { sourceNodeId: "a", targetNodeId: "b", strength: 0.9 },
      { sourceNodeId: "b", targetNodeId: "c", strength: 0.9 },
      { sourceNodeId: "c", targetNodeId: "d", strength: 0.9 },
      { sourceNodeId: "d", targetNodeId: "e", strength: 0.9 },
    ];
    const all = new Map(["b", "c", "d", "e"].map((k) => [k, estimate()]));
    const updates = fireImplicitUpdates({
      practicedNodeId: "a", correct: true, nowMs: now, edges: chain, estimates: all,
    });
    const nodes = updates.map((u) => u.nodeId).sort();
    expect(nodes).toEqual(["b", "c", "d"]); // depth 3, no e
  });

  it("weight below minWeight is dropped", () => {
    const weak: EncompassingEdge[] = [
      { sourceNodeId: "a", targetNodeId: "b", strength: 0.2 },
      { sourceNodeId: "b", targetNodeId: "c", strength: 0.2 },
    ];
    const updates = fireImplicitUpdates({
      practicedNodeId: "a", correct: true, nowMs: now, edges: weak,
      estimates: new Map([["b", estimate()], ["c", estimate()]]),
    });
    expect(updates.map((u) => u.nodeId)).toEqual(["b"]); // 0.04 < 0.1 cutoff
  });

  it("handles cycles without infinite loops", () => {
    const cyclic: EncompassingEdge[] = [
      { sourceNodeId: "a", targetNodeId: "b", strength: 0.8 },
      { sourceNodeId: "b", targetNodeId: "a", strength: 0.8 },
    ];
    const updates = fireImplicitUpdates({
      practicedNodeId: "a", correct: true, nowMs: now, edges: cyclic,
      estimates: new Map([["b", estimate()]]),
    });
    expect(updates).toHaveLength(1);
  });
});
