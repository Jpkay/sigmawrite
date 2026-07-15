/**
 * Frontier report (Roadmap Phase 10, E4/E5) — turns the diagnostic estimates +
 * the graph into the student-facing picture: what is mastered, fragile, or
 * missing; what is ready to learn next; what blocks each gap; and the ordered
 * catch-up path to a goal target.
 */

import { PrereqGraph } from "@/lib/graph/traversal";
import type { GoalScope, Strand } from "@/lib/graph/types";
import {
  hasConfirmedDirectEvidence,
  toMasteryMap,
  type DiagnosticNodeClassification,
  type DiagEstimate,
} from "./engine";

export type NodeClass = DiagnosticNodeClassification;

/** No evidence stays unknown; it must never be silently turned into a gap. */
export function classify(e: DiagEstimate, threshold = 0.85): NodeClass {
  if (e.classification) return e.classification;
  if (e.evidenceCount === 0 && !e.presumed) return "unknown";
  if (!e.presumed && !hasConfirmedDirectEvidence(e)) return "fragile";
  if (e.masteryProbability >= threshold && (e.presumed || hasConfirmedDirectEvidence(e))) return "mastered";
  if (e.masteryProbability >= 0.5) return "fragile";
  return "missing";
}

export type FrontierReport = {
  mastered: string[];
  fragile: string[];
  missing: string[];
  unknown: string[];
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
      evidenceCoverageConfirmed: false,
      presumed: false,
    };
  const isMastered = (id: string) => classify(get(id), threshold) === "mastered";

  const mastered: string[] = [];
  const fragile: string[] = [];
  const missing: string[] = [];
  const unknown: string[] = [];
  const blockers: { nodeId: string; blockedBy: string[] }[] = [];

  for (const id of graph.nodeIds) {
    if (!inScope(id)) continue;
    const cls = classify(get(id), threshold);
    (
      cls === "mastered" ? mastered
        : cls === "fragile" ? fragile
          : cls === "missing" ? missing
            : unknown
    ).push(id);

    if (cls !== "mastered" && cls !== "unknown") {
      const blockedBy = graph.directPrerequisites(id).filter((p) => !isMastered(p));
      if (blockedBy.length) blockers.push({ nodeId: id, blockedBy });
    }
  }

  const readyToLearn = graph.readyToLearn(
    toMasteryMap(estimates, threshold),
    scope,
    strandOf
  );

  return {
    mastered: mastered.sort(),
    fragile: fragile.sort(),
    missing: missing.sort(),
    unknown: unknown.sort(),
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
  return graph.catchUpPath(targetNodeId, toMasteryMap(estimates, threshold), threshold);
}
