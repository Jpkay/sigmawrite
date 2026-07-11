import { describe, expect, it } from "vitest";
import { validateGraph } from "@/lib/graph/invariants";
import { PrereqGraph } from "@/lib/graph/traversal";
import type { CompetencyEdge, CompetencyNode } from "@/lib/graph/types";
import { EDGES, MISCONCEPTIONS, NODES } from "./past-narration";

// Adapt the seed shape (keyed) to the graph types (id = key) for validation.
const nodes: CompetencyNode[] = NODES.map((n) => ({
  id: n.key,
  key: n.key,
  strand: n.strand,
  labelFr: n.labelFr,
  atomicityLevel: n.atomicityLevel,
  nativeGradeMin: n.nativeGradeMin,
  cefrMin: n.cefrMin,
  cefrMax: n.cefrMax,
}));
const edges: CompetencyEdge[] = EDGES.map((e) => ({
  sourceNodeId: e.source,
  targetNodeId: e.target,
  edgeType: e.edgeType,
}));
const keys = new Set(NODES.map((n) => n.key));
const graph = new PrereqGraph(keys, edges);

describe("past-narration slice — Gate-1 validation", () => {
  it("is a valid DAG with no hard errors", () => {
    const { ok, violations } = validateGraph(nodes, edges);
    const errors = violations.filter((v) => v.severity === "error");
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it("is fully CEFR/grade monotone (no warnings) — authored to be clean", () => {
    const { violations } = validateGraph(nodes, edges);
    expect(violations).toEqual([]);
  });

  it("every edge endpoint is a real node", () => {
    for (const e of EDGES) {
      expect(keys.has(e.source)).toBe(true);
      expect(keys.has(e.target)).toBe(true);
    }
  });

  it("every misconception points at a real node", () => {
    for (const m of MISCONCEPTIONS) {
      expect(keys.has(m.primaryNodeKey)).toBe(true);
    }
  });
});

describe("past-narration slice — cross-strand structure", () => {
  it("accord_pp_avoir_cod is the convergence point of tense + agreement + COD", () => {
    const prereqs = graph.prerequisites("accord_pp_avoir_cod");
    // pulls from conjugaison, orthographe, and grammaire strands
    expect(prereqs.has("passe_compose_avoir")).toBe(true); // tense
    expect(prereqs.has("accord_genre_nombre")).toBe(true); // agreement
    expect(prereqs.has("cod_identification")).toBe(true); // syntax
    expect(prereqs.has("pronom_relatif_que")).toBe(true); // "que" as COD
    // and transitively down to the deepest root
    expect(prereqs.has("classes_de_mots")).toBe(true);
  });

  it("accord_pp_etre depends on subject agreement AND the être passé composé", () => {
    const prereqs = graph.prerequisites("accord_pp_etre");
    expect(prereqs.has("passe_compose_etre")).toBe(true);
    expect(prereqs.has("accord_genre_nombre")).toBe(true);
    expect(prereqs.has("fonction_sujet")).toBe(true);
  });

  it("topologically orders foundations before the advanced rule", () => {
    const order = graph.topoOrder();
    const pos = (k: string) => order.indexOf(k);
    expect(pos("classes_de_mots")).toBeLessThan(pos("passe_compose_avoir"));
    expect(pos("passe_compose_avoir")).toBeLessThan(pos("accord_pp_avoir_cod"));
    expect(pos("pc_vs_imparfait")).toBeLessThan(pos("narration_passe"));
  });
});

describe("past-narration slice — diagnosis scenarios", () => {
  it("a student who fails only COD-before-avoir gets the right catch-up path", () => {
    // Mastered everything except cod_identification and its downstream agreement.
    const mastered = new Map(
      NODES.filter(
        (n) =>
          n.key !== "cod_identification" &&
          n.key !== "cod_coi_distinction" &&
          n.key !== "coi_identification" &&
          n.key !== "pronom_personnel_cod" &&
          n.key !== "accord_pp_avoir_cod"
      ).map((n) => [
        n.key,
        { nodeId: n.key, masteryProbability: 0.95, uncertainty: 0, evidenceCount: 3 },
      ])
    );
    const path = graph.catchUpPath("accord_pp_avoir_cod", mastered, 0.85);
    const ids = path.map((r) => r.nodeId);
    // cod_identification (root of the gap) comes before the agreement rule
    expect(ids).toContain("cod_identification");
    expect(ids.indexOf("cod_identification")).toBeLessThan(
      ids.indexOf("accord_pp_avoir_cod")
    );
    // already-mastered foundations are NOT in the path
    expect(ids).not.toContain("classes_de_mots");
    expect(ids).not.toContain("passe_compose_avoir");
  });

  it("frontier surfaces the next teachable node for a beginner", () => {
    // Knows the very basics only.
    const mastered = new Map(
      ["classes_de_mots", "notion_verbe"].map((k) => [
        k,
        { nodeId: k, masteryProbability: 0.95, uncertainty: 0, evidenceCount: 3 },
      ])
    );
    const strandOf = (id: string) => NODES.find((n) => n.key === id)?.strand;
    const frontier = graph.readyToLearn(mastered, { masteryThreshold: 0.85 }, strandOf);
    // radical_terminaison (needs notion_verbe) and groupe_nominal/fonction_sujet
    // (need classes_de_mots) are now teachable; deep nodes are not.
    expect(frontier).toContain("radical_terminaison");
    expect(frontier).not.toContain("accord_pp_avoir_cod");
  });
});
