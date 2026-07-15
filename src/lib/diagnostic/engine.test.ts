import { describe, expect, it } from "vitest";
import { PrereqGraph } from "@/lib/graph/traversal";
import type { CompetencyEdge, GoalScope, Strand } from "@/lib/graph/types";
import { EDGES, NODES } from "@/lib/content/slices/past-narration";
import {
  applyEvidence,
  initDiagState,
  selectNextProbe,
  type DiagState,
} from "./engine";
import { buildFrontierReport, catchUpToTarget, classify } from "./report";

const edges: CompetencyEdge[] = EDGES.map((e) => ({
  sourceNodeId: e.source,
  targetNodeId: e.target,
  edgeType: e.edgeType,
}));
const graph = new PrereqGraph(NODES.map((n) => n.key), edges);
const strandOf = (id: string): Strand | undefined =>
  NODES.find((n) => n.key === id)?.strand;
const scope: GoalScope = { masteryThreshold: 0.85 };

/** Run the full adaptive loop against a fixed "truth" oracle of known nodes. */
function runDiagnostic(known: Set<string>, budget = 80) {
  let state: DiagState = initDiagState();
  const order: { node: string; correct: boolean }[] = [];
  let probes = 0;
  for (; probes < budget; probes++) {
    const next = selectNextProbe(graph, state, scope, strandOf, { guess: 0.1 });
    if (!next) break;
    const correct = known.has(next);
    order.push({ node: next, correct });
    state = applyEvidence(graph, state, next, correct, { guess: 0.1 });
  }
  return { state, order, probes };
}

describe("adaptive diagnostic on the real past-narration slice", () => {
  it("localizes a COD-only gap to its true root, not the surface error", () => {
    // Student knows everything EXCEPT the COD subtree.
    const codGap = new Set([
      "cod_identification",
      "coi_identification",
      "cod_coi_distinction",
      "pronom_personnel_cod",
      "pronom_relatif_que",
      "accord_pp_avoir_cod",
    ]);
    const known = new Set(NODES.map((n) => n.key).filter((k) => !codGap.has(k)));

    const { state, probes } = runDiagnostic(known);

    // Terminated by resolution, not by exhausting the budget.
    expect(probes).toBeLessThan(80);
    // No worse than testing every node — and in practice fewer (presumption prunes).
    expect(probes).toBeLessThanOrEqual(NODES.length);

    const report = buildFrontierReport(graph, state.estimates, scope, strandOf);

    // The true root of the gap is identified as missing.
    expect(report.missing).toContain("cod_identification");
    // The surface error node is not mastered…
    expect(report.mastered).not.toContain("accord_pp_avoir_cod");
    // …but its OTHER prerequisites are not marked missing. A single direct
    // success remains fragile until a second distinct item confirms mastery.
    expect([...report.mastered, ...report.fragile]).toContain("passe_compose_avoir");
    expect([...report.mastered, ...report.fragile]).toContain("accord_genre_nombre");

    // The catch-up path to the surface node is rooted at the real gap.
    const path = catchUpToTarget(graph, state.estimates, "accord_pp_avoir_cod").map(
      (r) => r.nodeId
    );
    expect(path).toContain("cod_identification");
    expect(path.indexOf("cod_identification")).toBeLessThan(
      path.indexOf("accord_pp_avoir_cod")
    );
    // Mastered foundations are excluded from the path.
    expect(path).not.toContain("classes_de_mots");
  });

  it("a complete beginner: everything missing, frontier is the roots", () => {
    const { state, probes } = runDiagnostic(new Set());
    expect(probes).toBeLessThan(80);
    const report = buildFrontierReport(graph, state.estimates, scope, strandOf);
    expect(report.mastered).toHaveLength(0);
    expect(report.readyToLearn).toContain("classes_de_mots");
    // Deep nodes are blocked, not ready.
    expect(report.readyToLearn).not.toContain("accord_pp_avoir_cod");
  });

  it("a strong student: resolves quickly with presumption, all mastered", () => {
    const known = new Set(NODES.map((n) => n.key));
    const { state, probes } = runDiagnostic(known);
    // Presumption prunes deep chains → meaningfully fewer probes than nodes.
    expect(probes).toBeLessThan(NODES.length);
    const report = buildFrontierReport(graph, state.estimates, scope, strandOf);
    expect(report.missing).toHaveLength(0);
    expect(report.mastered.length).toBeGreaterThan(NODES.length / 2);
  });

  it("classify thresholds", () => {
    expect(classify({ masteryProbability: 0.9, uncertainty: 0.2, evidenceCount: 2, presumed: false })).toBe("mastered");
    expect(classify({ masteryProbability: 0.9, uncertainty: 0.2, evidenceCount: 2, evidenceCoverageConfirmed: false, presumed: false })).toBe("fragile");
    expect(classify({ masteryProbability: 0.6, uncertainty: 0.5, evidenceCount: 1, presumed: false })).toBe("fragile");
    expect(classify({ masteryProbability: 0.2, uncertainty: 0.5, evidenceCount: 1, presumed: false })).toBe("fragile");
    expect(classify({ masteryProbability: 0.2, uncertainty: 0.2, evidenceCount: 2, evidenceCoverageConfirmed: true, presumed: false })).toBe("missing");
    expect(classify({ masteryProbability: 0.5, uncertainty: 1, evidenceCount: 0, presumed: false })).toBe("unknown");
    expect(classify({ masteryProbability: 0.86, uncertainty: 0.4, evidenceCount: 0, presumed: true })).toBe("mastered");
  });

  it("uses expectation-aware classification over a misleading aggregate score", () => {
    expect(classify({
      masteryProbability: 0.91,
      uncertainty: 0.2,
      evidenceCount: 4,
      evidenceCoverageConfirmed: true,
      presumed: false,
      classification: "fragile",
    })).toBe("fragile");
  });
});
