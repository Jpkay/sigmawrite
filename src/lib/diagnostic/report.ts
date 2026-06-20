/**
 * Frontier report (Roadmap Phase 10, E4/E5) — turns the diagnostic estimates +
 * the graph into the student-facing picture: what is mastered, fragile, or
 * missing; what is ready to learn next; what blocks each gap; and the ordered
 * catch-up path to a goal target.
 */

import { PrereqGraph } from "@/lib/graph/traversal";
import type { GoalScope, Strand } from "@/lib/graph/types";
import { toMasteryMap, type DiagEstimate } from "./engine";

export type NodeClass = "mastered" | "fragile" | "missing";

/** mastered ≥ threshold · fragile ≥ 0.5 · missing below. */
export function classify(e: DiagEstimate, threshold = 0.85): NodeClass {
  if (e.masteryProbability >= threshold) return "mastered";
  if (e.masteryProbability >= 0.5) return "fragile";
  return "missing";
}

export type FrontierReport = {
  mastered: string[];
  fragile: string[];
  missing: string[];
  /** KST fringe: not-yet-mastered nodes whose prerequisites are all mastered. */
  readyToLearn: string[];
  /** For each unmastered node, the unmastered prerequisites blocking it. */
  blockers: { nodeId: string; blockedBy: string[] }[];
};

export function buildFrontierReport(
  graph: PrereqGraph,
  estimates: Map<string, DiagEstimate>,
  scope: GoalScope,
  strandOf: (id: string) => Strand | undefined
): FrontierReport {
  const threshold = scope.masteryThreshold;
  const inScope = (id: string) =>
    !scope.strands || scope.strands.includes(strandOf(id) as Strand);

  const get = (id: string): DiagEstimate =>
    estimates.get(id) ?? {
      masteryProbability: 0,
      uncertainty: 1,
      evidenceCount: 0,
      presumed: false,
    };
  const isMastered = (id: string) => get(id).masteryProbability >= threshold;

  const mastered: string[] = [];
  const fragile: string[] = [];
  const missing: string[] = [];
  const blockers: { nodeId: string; blockedBy: string[] }[] = [];

  for (const id of graph.nodeIds) {
    if (!inScope(id)) continue;
    const cls = classify(get(id), threshold);
    (cls === "mastered" ? mastered : cls === "fragile" ? fragile : missing).push(id);

    if (cls !== "mastered") {
      const blockedBy = graph.directPrerequisites(id).filter((p) => !isMastered(p));
      if (blockedBy.length) blockers.push({ nodeId: id, blockedBy });
    }
  }

  const readyToLearn = graph.readyToLearn(
    toMasteryMap(estimates),
    scope,
    strandOf
  );

  return {
    mastered: mastered.sort(),
    fragile: fragile.sort(),
    missing: missing.sort(),
    readyToLearn: readyToLearn.sort(),
    blockers,
  };
}

/** Ordered catch-up path (deepest foundation first) to a goal target node. */
export function catchUpToTarget(
  graph: PrereqGraph,
  estimates: Map<string, DiagEstimate>,
  targetNodeId: string,
  threshold = 0.85
) {
  return graph.catchUpPath(targetNodeId, toMasteryMap(estimates), threshold);
}
