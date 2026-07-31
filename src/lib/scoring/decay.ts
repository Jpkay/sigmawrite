/**
 * Mastery decay (gap-analysis Phase 2). A BKT mastery probability is evidence
 * about the past; what sequencing needs is the probability the skill is still
 * retrievable NOW. We decay P(known) by the FSRS retrievability of the node's
 * memory state: effective = P(known) × R(elapsed, stability).
 *
 * Estimates without FSRS state (legacy rows, diagnostic inferences) are
 * returned unchanged — the 60-day re-entry staleness trigger still covers
 * them. This supersedes the never-wired decay_rate column.
 */

import { retrievability } from "./fsrs";

export type DecayableEstimate = {
  mastery: number;
  /** FSRS stability in days (null/undefined = no memory state yet). */
  memoryStability?: number | null;
  /** ISO timestamp of the last direct evidence. */
  lastEvidenceAt?: string | null;
};

/** Mastery adjusted for forgetting since the last evidence. */
export function effectiveMastery(estimate: DecayableEstimate, nowMs: number): number {
  const { mastery, memoryStability, lastEvidenceAt } = estimate;
  if (memoryStability == null || memoryStability <= 0 || !lastEvidenceAt) return mastery;
  const lastMs = Date.parse(lastEvidenceAt);
  if (!Number.isFinite(lastMs)) return mastery;
  const elapsedDays = Math.max(0, (nowMs - lastMs) / 86_400_000);
  return mastery * retrievability({ stability: memoryStability, difficulty: 5 }, elapsedDays);
}
