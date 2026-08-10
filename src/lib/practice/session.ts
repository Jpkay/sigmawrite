import { eloExpected, TARGET_SUCCESS } from "@/lib/scoring/elo";

export const PRACTICE_SESSION_SECONDS = 7 * 60;
export const PRACTICE_EXERCISE_TARGET = 6;
export const PRACTICE_BASE_XP = 7;
export const PRACTICE_PERFECT_BONUS_XP = 3;
export const OPTIMAL_SUCCESS_ZONE = { min: 0.75, max: 0.85 } as const;

export type RatedPracticeItem = {
  difficultyRating: number;
  responseType?: string;
};

export function predictedSuccess(learnerRating: number, itemRating: number): number {
  return eloExpected(learnerRating, itemRating);
}

/**
 * Put items in the learner's 75–85% success zone first, closest to 82%.
 * Items outside the zone are retained as fallbacks so sparse reviewed banks
 * still produce a useful session. Response types are interleaved on ties.
 */
export function selectOptimalPracticeItems<T extends RatedPracticeItem>(
  items: T[],
  learnerRating: number,
  limit = PRACTICE_EXERCISE_TARGET,
): T[] {
  return items
    .map((item, index) => {
      const success = predictedSuccess(learnerRating, item.difficultyRating);
      const inZone = success >= OPTIMAL_SUCCESS_ZONE.min && success <= OPTIMAL_SUCCESS_ZONE.max;
      return { item, index, success, inZone, gap: Math.abs(success - TARGET_SUCCESS) };
    })
    .sort((a, b) => Number(b.inZone) - Number(a.inZone) || a.gap - b.gap || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map(({ item }) => item);
}

export function remainingSessionSeconds(startedAtMs: number, nowMs: number): number {
  return Math.max(0, PRACTICE_SESSION_SECONDS - Math.floor((nowMs - startedAtMs) / 1000));
}

export function plannedExerciseCount(approvedItemCount: number): number {
  const approved = Math.max(0, Math.floor(approvedItemCount));
  return approved >= 3 ? PRACTICE_EXERCISE_TARGET : approved;
}

/** Revisit a small reviewed bank within the session instead of inventing content. */
export function expandReviewedPractice<T>(items: readonly T[], count: number): T[] {
  if (!items.length || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => items[index % items.length]);
}

export function xpForPractice(input: { completed: boolean; perfect: boolean }) {
  if (!input.completed) return { base: 0, bonus: 0, total: 0 };
  const bonus = input.perfect ? PRACTICE_PERFECT_BONUS_XP : 0;
  return { base: PRACTICE_BASE_XP, bonus, total: PRACTICE_BASE_XP + bonus };
}
