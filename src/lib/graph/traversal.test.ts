import { describe, expect, it } from "vitest";
import { PrereqGraph } from "./traversal";
import type { CompetencyEdge, CompetencyEstimate, GoalScope } from "./types";

/**
 * Toy past-narration slice:
 *   classes_de_mots → notion_verbe → present → passe_compose_avoir → accord_pp_avoir
 *   accord_genre_nombre → accord_pp_avoir   (cross-strand prerequisite)
 *   cod_identification → accord_pp_avoir
 */
const prereq = (s: string, t: string): CompetencyEdge => ({
  sourceNodeId: s,
  targetNodeId: t,
  edgeType: "prerequisite",
});

const NODES = [
  "classes_de_mots",
  "notion_verbe",
  "present",
  "passe_compose_avoir",
  "accord_genre_nombre",
  "cod_identification",
  "accord_pp_avoir",
];

const EDGES: CompetencyEdge[] = [
  prereq("classes_de_mots", "notion_verbe"),
  prereq("notion_verbe", "present"),
  prereq("present", "passe_compose_avoir"),
  prereq("passe_compose_avoir", "accord_pp_avoir"),
  prereq("accord_genre_nombre", "accord_pp_avoir"),
  prereq("cod_identification", "accord_pp_avoir"),
  // a non-prerequisite edge should be ignored by traversal
  { sourceNodeId: "present", targetNodeId: "passe_compose_avoir", edgeType: "same_family" },
];

const est = (
  m: Record<string, number>
): Map<string, CompetencyEstimate> =>
  new Map(
    Object.entries(m).map(([nodeId, masteryProbability]) => [
      nodeId,
      { nodeId, masteryProbability, uncertainty: 0, evidenceCount: 1 },
    ])
  );

describe("PrereqGraph traversal", () => {
  const g = new PrereqGraph(NODES, EDGES);

  it("finds direct prerequisites", () => {
    expect(g.directPrerequisites("accord_pp_avoir").sort()).toEqual(
      ["accord_genre_nombre", "cod_identification", "passe_compose_avoir"].sort()
    );
  });

  it("finds all transitive prerequisites with depth", () => {
    const p = g.prerequisites("passe_compose_avoir");
    expect(p.get("present")).toBe(1);
    expect(p.get("notion_verbe")).toBe(2);
    expect(p.get("classes_de_mots")).toBe(3);
    expect(p.has("accord_pp_avoir")).toBe(false); // downstream, not a prereq
  });

  it("finds transitive dependents", () => {
    const d = g.dependents("present");
    expect(d.has("passe_compose_avoir")).toBe(true);
    expect(d.has("accord_pp_avoir")).toBe(true);
    expect(d.has("classes_de_mots")).toBe(false);
  });

  it("ignores non-prerequisite edge types", () => {
    // same_family edge present→passe_compose must not create extra structure
    expect(g.directDependents("present")).toEqual(["passe_compose_avoir"]);
  });
});

describe("ready-to-learn frontier (KST fringe)", () => {
  const g = new PrereqGraph(NODES, EDGES);
  const scope: GoalScope = { masteryThreshold: 0.85 };
  const strandOf = () => undefined; // unscoped

  it("returns the node whose prereqs are all mastered but itself is not", () => {
    // Mastered up to 'present'; passe_compose is the frontier.
    const e = est({
      classes_de_mots: 0.9,
      notion_verbe: 0.9,
      present: 0.9,
    });
    const frontier = g.readyToLearn(e, scope, strandOf);
    expect(frontier).toContain("passe_compose_avoir");
    // accord_pp_avoir is NOT ready: it has unmastered prereqs.
    expect(frontier).not.toContain("accord_pp_avoir");
    // mastered nodes are excluded.
    expect(frontier).not.toContain("present");
  });

  it("excludes nodes with any unmastered prerequisite", () => {
    const e = est({ classes_de_mots: 0.9 });
    const frontier = g.readyToLearn(e, scope, strandOf);
    expect(frontier).toContain("notion_verbe");
    expect(frontier).not.toContain("present");
  });

  it("roots with no prerequisites are always on the frontier when unmastered", () => {
    const frontier = g.readyToLearn(new Map(), scope, strandOf);
    expect(frontier).toContain("classes_de_mots");
    expect(frontier).toContain("accord_genre_nombre");
  });
});

describe("catch-up path", () => {
  const g = new PrereqGraph(NODES, EDGES);

  it("orders unmastered prerequisites deepest-foundation-first, target last", () => {
    const e = est({ classes_de_mots: 0.9 }); // only the deepest root mastered
    const path = g.catchUpPath("accord_pp_avoir", e, 0.85);
    const ids = path.map((r) => r.nodeId);

    expect(ids).not.toContain("classes_de_mots"); // mastered → excluded
    expect(ids[ids.length - 1]).toBe("accord_pp_avoir"); // target last
    // notion_verbe (deeper) precedes present (shallower)
    expect(ids.indexOf("notion_verbe")).toBeLessThan(ids.indexOf("present"));
    // every prerequisite precedes the target
    expect(ids.indexOf("passe_compose_avoir")).toBeLessThan(
      ids.indexOf("accord_pp_avoir")
    );
  });

  it("returns just the target when all prerequisites are mastered", () => {
    const e = est({
      classes_de_mots: 0.9,
      notion_verbe: 0.9,
      present: 0.9,
      passe_compose_avoir: 0.9,
      accord_genre_nombre: 0.9,
      cod_identification: 0.9,
    });
    const path = g.catchUpPath("accord_pp_avoir", e, 0.85);
    expect(path.map((r) => r.nodeId)).toEqual(["accord_pp_avoir"]);
  });
});

describe("topological order and cycle detection", () => {
  it("produces a valid topo order on a DAG", () => {
    const g = new PrereqGraph(NODES, EDGES);
    const order = g.topoOrder();
    const pos = new Map(order.map((id, i) => [id, i]));
    for (const e of EDGES) {
      if (e.edgeType !== "prerequisite") continue;
      expect(pos.get(e.sourceNodeId)!).toBeLessThan(pos.get(e.targetNodeId)!);
    }
    expect(g.findCycle()).toBeNull();
  });

  it("detects a cycle", () => {
    const cyclic = [
      ...EDGES,
      prereq("accord_pp_avoir", "classes_de_mots"), // closes a loop
    ];
    const g = new PrereqGraph(NODES, cyclic);
    const cycle = g.findCycle();
    expect(cycle).not.toBeNull();
    expect(() => g.topoOrder()).toThrow();
  });
});
