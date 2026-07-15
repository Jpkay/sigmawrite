import { describe, expect, it } from "vitest";
import { buildAdminGraphView, type AdminGraphRelease } from "./admin-presentation";

const release: AdminGraphRelease = {
  id: "release-1",
  key: "french-taxonomy-v2",
  version: "2.0.0",
  status: "validating",
  checksum: "sha256:release",
  createdAt: "2026-07-15T00:00:00Z",
  publishedAt: null,
};

const membership = (recordType: string, id: string, stableKey: string, snapshot: unknown) => ({
  record_id: id,
  record_type: recordType,
  stable_key: stableKey,
  record_version: 1,
  record_snapshot: snapshot,
  record_checksum: `sha256:${id}`,
});

describe("admin graph presentation", () => {
  it("builds an immutable release view with provenance and prerequisite classes", () => {
    const view = buildAdminGraphView({
      release,
      memberships: [
        membership("competency_node", "a", "a", { key: "a", labelFr: "Base", strand: "conjugaison", sourceKeys: ["sigma"], evidence: [{ key: "read" }] }),
        membership("competency_node", "b", "b", { key: "b", labelFr: "Suite", strand: "conjugaison", evidence: [{ key: "write" }] }),
        membership("competency_edge", "a-b", "a:b:prerequisite", { source: "a", target: "b", type: "prerequisite", prerequisiteClass: "hard", rationale: "Base requise." }),
        membership("mastery_evidence", "ev-a", "a:read", { key: "read" }),
      ],
      currentNodes: [{ id: "a", review_status: "human_approved", generation_type: "human" }],
      currentEdges: [{ id: "a-b", review_status: "human_approved" }],
    });

    expect(view.meta).toMatchObject({ nodeCount: 2, edgeCount: 1, hardPrerequisiteCount: 1, evidenceDefinitionCount: 1 });
    expect(view.nodes[0]).toMatchObject({ label: "Base", evidenceCount: 1, sourceKeys: ["sigma"], reviewStatus: "human_approved" });
    expect(view.edges[0]).toMatchObject({ sourceNodeId: "a", targetNodeId: "b", prerequisiteClass: "hard" });
    expect(view.warnings).toEqual([]);
  });

  it("surfaces dangling, orphan, missing-evidence, and unknown-class warnings", () => {
    const view = buildAdminGraphView({
      release,
      memberships: [
        membership("competency_node", "a", "a", { key: "a", labelFr: "Isolée", strand: "analyse" }),
        membership("competency_edge", "bad", "a:ghost:prerequisite", { source: "a", target: "ghost", type: "prerequisite" }),
      ],
    });
    expect(new Set(view.warnings.map((warning) => warning.code))).toEqual(new Set(["dangling_edge", "orphan_node", "missing_evidence"]));
    expect(view.meta.unknownPrerequisiteCount).toBe(1);
  });

  it("detects prerequisite cycles", () => {
    const nodes = ["a", "b"].map((key) => membership("competency_node", key, key, { key, labelFr: key, strand: "conjugaison", evidence: [{}] }));
    const edges = [
      membership("competency_edge", "a-b", "a:b:prerequisite", { source: "a", target: "b", type: "prerequisite", prerequisiteClass: "hard" }),
      membership("competency_edge", "b-a", "b:a:prerequisite", { source: "b", target: "a", type: "prerequisite", prerequisiteClass: "soft" }),
    ];
    const view = buildAdminGraphView({ release, memberships: [...nodes, ...edges] });
    expect(view.warnings[0]).toMatchObject({ code: "cycle", severity: "error" });
  });
});
