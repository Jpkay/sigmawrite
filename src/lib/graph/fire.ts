/**
 * FIRe — Fractional Implicit Repetition (gap-analysis Phase 2, after Math
 * Academy's model). Practicing an advanced skill implicitly practices the
 * sub-skills it encompasses: a correct passé-composé sentence is also a
 * repetition of auxiliary conjugation and participle formation. Credit flows
 * DOWN `encompasses` edges (source → target = target is a sub-skill),
 * weighted by the product of edge strengths along the path; failures flow UP
 * to the encompassing skills that depend on the failed sub-skill.
 *
 * Guards (also from Math Academy):
 * - implicit credit is DISCARDED for sub-skills the student is weak on
 *   (mastery < 0.5) — those must be reviewed explicitly;
 * - implicit credit can refresh but never confirm mastery: below the 0.85
 *   gate it is capped at 0.84 (consistent with the anti-inflation guards);
 * - memory state is only refreshed where it already exists — implicit
 *   evidence never fabricates FSRS state.
 *
 * Pure → unit-tested. DB integration lives in actions/student.ts.
 */

import { bktUpdateWeighted } from "@/lib/scoring/bkt";
import { scheduleFsrs, type MemoryState } from "@/lib/scoring/fsrs";

export type EncompassingEdge = {
  sourceNodeId: string;
  targetNodeId: string;
  /** Fraction of source practice that exercises the target sub-skill (0–1). */
  strength: number;
};

export type FireEstimate = {
  mastery: number;
  memoryStability?: number | null;
  memoryDifficulty?: number | null;
  lastEvidenceAt?: string | null;
};

export type ImplicitUpdate = {
  nodeId: string;
  /** Accumulated fractional weight of the implicit repetition (0–1). */
  weight: number;
  mastery: number;
  memoryStability?: number;
  memoryDifficulty?: number;
};

/** Down-weights implicit evidence relative to a direct observation, in line
 * with the 0.20–0.35 evidence weights used for writing-detected errors. */
const IMPLICIT_EVIDENCE_WEIGHT = 0.35;
const MASTERY_GATE = 0.85;
const WEAK_SUBSKILL_FLOOR = 0.5;

const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_MIN_WEIGHT = 0.1;

/** Best (max) accumulated path weight from `start` over `next` adjacency. */
function reachableWeights(
  start: string,
  adjacency: Map<string, Array<{ node: string; strength: number }>>,
  maxDepth: number,
  minWeight: number
): Map<string, number> {
  const weights = new Map<string, number>();
  let layer = new Map<string, number>([[start, 1]]);
  for (let depth = 0; depth < maxDepth && layer.size; depth += 1) {
    const nextLayer = new Map<string, number>();
    for (const [node, weight] of layer) {
      for (const edge of adjacency.get(node) ?? []) {
        const w = weight * edge.strength;
        if (w < minWeight || edge.node === start) continue;
        if (w > (weights.get(edge.node) ?? 0)) {
          weights.set(edge.node, w);
          nextLayer.set(edge.node, Math.max(w, nextLayer.get(edge.node) ?? 0));
        }
      }
    }
    layer = nextLayer;
  }
  return weights;
}

function refreshMemory(
  prev: MemoryState,
  correct: boolean,
  elapsedDays: number,
  weight: number
): MemoryState {
  const full = scheduleFsrs(prev, correct ? "good" : "forgot", elapsedDays);
  return {
    stability: prev.stability + weight * (full.stability - prev.stability),
    difficulty: prev.difficulty + weight * (full.difficulty - prev.difficulty),
  };
}

/**
 * Computes the implicit-repetition updates triggered by one direct
 * observation on `practicedNodeId`. Only nodes with an existing estimate are
 * updated — implicit evidence never creates estimate rows.
 */
export function fireImplicitUpdates(input: {
  practicedNodeId: string;
  correct: boolean;
  nowMs: number;
  edges: EncompassingEdge[];
  estimates: Map<string, FireEstimate>;
  maxDepth?: number;
  minWeight?: number;
}): ImplicitUpdate[] {
  const maxDepth = input.maxDepth ?? DEFAULT_MAX_DEPTH;
  const minWeight = input.minWeight ?? DEFAULT_MIN_WEIGHT;

  // Success flows down into sub-skills; failure flows up to the skills that
  // encompass (depend on) the failed one.
  const adjacency = new Map<string, Array<{ node: string; strength: number }>>();
  for (const edge of input.edges) {
    const from = input.correct ? edge.sourceNodeId : edge.targetNodeId;
    const to = input.correct ? edge.targetNodeId : edge.sourceNodeId;
    const list = adjacency.get(from) ?? [];
    list.push({ node: to, strength: Math.max(0, Math.min(1, edge.strength)) });
    adjacency.set(from, list);
  }

  const weights = reachableWeights(input.practicedNodeId, adjacency, maxDepth, minWeight);
  const updates: ImplicitUpdate[] = [];

  for (const [nodeId, weight] of weights) {
    const estimate = input.estimates.get(nodeId);
    if (!estimate) continue;
    // Weak sub-skills earn no implicit credit — they need explicit review.
    if (input.correct && estimate.mastery < WEAK_SUBSKILL_FLOOR) continue;

    const updated = bktUpdateWeighted(
      estimate.mastery,
      input.correct,
      weight * IMPLICIT_EVIDENCE_WEIGHT
    );
    const mastery = input.correct && estimate.mastery < MASTERY_GATE
      ? Math.min(updated, MASTERY_GATE - 0.01)
      : updated;

    const update: ImplicitUpdate = { nodeId, weight, mastery };

    if (estimate.memoryStability != null && estimate.memoryDifficulty != null) {
      const lastMs = estimate.lastEvidenceAt ? Date.parse(estimate.lastEvidenceAt) : NaN;
      const elapsedDays = Number.isFinite(lastMs)
        ? Math.max(0, (input.nowMs - lastMs) / 86_400_000)
        : 0;
      const memory = refreshMemory(
        { stability: Number(estimate.memoryStability), difficulty: Number(estimate.memoryDifficulty) },
        input.correct,
        elapsedDays,
        weight
      );
      update.memoryStability = memory.stability;
      update.memoryDifficulty = memory.difficulty;
    }
    updates.push(update);
  }
  return updates;
}
