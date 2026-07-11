/**
 * Gate-1 structural validation (Roadmap Phase 9, D2) — the deterministic graph
 * checks every LLM-authored batch must pass before persistence.
 *
 * Two severities:
 *  - error: hard reject (cycles break traversal; dangling edges are corrupt).
 *  - warning: route to human review, don't auto-reject (monotonicity has real
 *    pedagogical exceptions, e.g. a foundational node reused at a higher level).
 */

import { PrereqGraph } from "./traversal";
import { cefrRank, type CompetencyEdge, type CompetencyNode } from "./types";

export type Violation = {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodeIds?: string[];
};

export function validateGraph(
  nodes: CompetencyNode[],
  edges: CompetencyEdge[]
): { ok: boolean; violations: Violation[] } {
  const violations: Violation[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Dangling edges — endpoints must exist.
  for (const e of edges) {
    for (const ref of [e.sourceNodeId, e.targetNodeId]) {
      if (!byId.has(ref)) {
        violations.push({
          severity: "error",
          code: "dangling_edge",
          message: `Edge references unknown node ${ref}`,
          nodeIds: [e.sourceNodeId, e.targetNodeId],
        });
      }
    }
  }

  const graph = new PrereqGraph(byId.keys(), edges);

  // The prerequisite graph must be acyclic.
  const cycle = graph.findCycle();
  if (cycle) {
    violations.push({
      severity: "error",
      code: "cycle",
      message: `Prerequisite cycle: ${cycle.join(" → ")}`,
      nodeIds: cycle,
    });
  }

  // Framework monotonicity — a prerequisite should not sit at a higher level
  // than the node that depends on it (warning, not hard reject).
  for (const e of edges) {
    if (e.edgeType !== "prerequisite") continue;
    const src = byId.get(e.sourceNodeId);
    const tgt = byId.get(e.targetNodeId);
    if (!src || !tgt) continue;

    const sC = cefrRank(src.cefrMin);
    const tC = cefrRank(tgt.cefrMin);
    if (sC != null && tC != null && sC > tC) {
      violations.push({
        severity: "warning",
        code: "cefr_monotonicity",
        message: `Prerequisite ${src.key} (${src.cefrMin}) is above dependent ${tgt.key} (${tgt.cefrMin})`,
        nodeIds: [src.id, tgt.id],
      });
    }

    const sG = src.nativeGradeMin;
    const tG = tgt.nativeGradeMin;
    if (sG != null && tG != null && sG > tG) {
      violations.push({
        severity: "warning",
        code: "grade_monotonicity",
        message: `Prerequisite ${src.key} (grade ${sG}) is above dependent ${tgt.key} (grade ${tG})`,
        nodeIds: [src.id, tgt.id],
      });
    }
  }

  return { ok: !violations.some((v) => v.severity === "error"), violations };
}
