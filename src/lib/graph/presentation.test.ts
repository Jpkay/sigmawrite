import { describe, expect, it } from "vitest";
import {
  buildStudentGraphView,
  layoutStudentGraphNodes,
  selectPersonalizedNodeIds,
} from "./presentation";

const nodes = [
  { id: "foundation", key: "foundation", label: "Fondation", strand: "conjugaison" as const },
  { id: "ready", key: "ready", label: "Étape prête", strand: "conjugaison" as const },
  { id: "next", key: "next", label: "Étape suivante", strand: "conjugaison" as const },
  { id: "reading", key: "reading", label: "Comprendre", strand: "comprehension_ecrite" as const },
];

function makeView() {
  return buildStudentGraphView({
    releaseId: "release-v1",
    runId: "run-1",
    nodes,
    edges: [
      { sourceNodeId: "foundation", targetNodeId: "ready", edgeType: "prerequisite", prerequisiteClass: "hard" },
      { sourceNodeId: "ready", targetNodeId: "next", edgeType: "prerequisite", prerequisiteClass: "soft" },
    ],
    estimates: new Map([
      ["foundation", { masteryProbability: 0.92, uncertainty: 0.1, evidenceCount: 4 }],
      ["ready", { masteryProbability: 0.58, uncertainty: 0.35, evidenceCount: 2 }],
    ]),
    report: {
      mastered: ["foundation"],
      fragile: ["ready"],
      missing: ["next"],
      unknown: ["reading"],
      readyToLearn: ["ready"],
      blockers: [{ nodeId: "next", blockedBy: ["ready"] }],
    },
    pathSteps: [{
      nodeId: "ready",
      position: 1,
      stage: "consolidation",
      status: "available",
      rationaleFr: "Compétence à stabiliser.",
      requiredEvidenceExpectation: "controlled_production",
    }],
  });
}

describe("student graph presentation", () => {
  it("combines frontier, estimates, path, and edge metadata into a serializable view", () => {
    const view = makeView();
    expect(view.meta).toEqual({
      releaseId: "release-v1",
      runId: "run-1",
      nodeCount: 4,
      edgeCount: 2,
      readyCount: 1,
      pathStepCount: 1,
    });
    expect(view.nodes.find((node) => node.id === "ready")).toMatchObject({
      classification: "fragile",
      isReadyToLearn: true,
      masteryProbability: 0.58,
      evidenceCount: 2,
      path: { position: 1, status: "available" },
    });
    expect(view.nodes.find((node) => node.id === "next")?.blockedBy).toEqual(["ready"]);
    expect(view.edges[1]).toMatchObject({ prerequisiteClass: "soft" });
  });

  it("selects the active path and its immediate graph neighbourhood", () => {
    const selected = selectPersonalizedNodeIds(makeView());
    expect(selected).toEqual(new Set(["ready", "foundation", "next"]));
    expect(selected.has("reading")).toBe(false);
  });

  it("creates deterministic strand-clustered positions", () => {
    const view = makeView();
    const first = layoutStudentGraphNodes(view.nodes);
    const second = layoutStudentGraphNodes([...view.nodes].reverse());
    expect(second).toEqual(first);
    expect(first.foundation.x).not.toBe(first.reading.x);
    expect(first.foundation.y).not.toBe(first.reading.y);
  });

  it("drops stale release references from counts, blockers, paths, and edges", () => {
    const view = buildStudentGraphView({
      releaseId: "release-v2",
      runId: "run-2",
      nodes: nodes.slice(0, 2),
      edges: [
        { sourceNodeId: "foundation", targetNodeId: "ready", edgeType: "prerequisite" },
        { sourceNodeId: "ready", targetNodeId: "outside", edgeType: "prerequisite" },
      ],
      estimates: new Map(),
      report: {
        mastered: ["foundation", "outside"],
        fragile: [],
        missing: ["ready"],
        unknown: [],
        readyToLearn: ["ready", "outside"],
        blockers: [{ nodeId: "ready", blockedBy: ["foundation", "outside"] }],
      },
      pathSteps: [
        { nodeId: "ready", position: 1, stage: "remediation", status: "available", rationaleFr: "À revoir.", requiredEvidenceExpectation: null },
        { nodeId: "outside", position: 2, stage: "verification", status: "pending", rationaleFr: "Hors version.", requiredEvidenceExpectation: null },
      ],
    });

    expect(view.meta).toMatchObject({ nodeCount: 2, edgeCount: 1, readyCount: 1, pathStepCount: 1 });
    expect(view.nodes.find((node) => node.id === "ready")?.blockedBy).toEqual(["foundation"]);
    expect(view.nodes.some((node) => node.id === "outside")).toBe(false);
  });

  it("handles empty and pathless graph views without inventing selections", () => {
    const empty = buildStudentGraphView({
      releaseId: null,
      runId: null,
      nodes: [],
      edges: [],
      estimates: new Map(),
      report: { mastered: [], fragile: [], missing: [], unknown: [], readyToLearn: [], blockers: [] },
    });
    expect(empty.meta).toMatchObject({ nodeCount: 0, edgeCount: 0, readyCount: 0, pathStepCount: 0 });
    expect(selectPersonalizedNodeIds(empty)).toEqual(new Set());
    expect(layoutStudentGraphNodes(empty.nodes)).toEqual({});

    const pathless = makeView();
    pathless.nodes = pathless.nodes.map((node) => ({ ...node, path: null }));
    expect(selectPersonalizedNodeIds(pathless)).toEqual(new Set(["ready", "foundation", "next"]));
  });
});
