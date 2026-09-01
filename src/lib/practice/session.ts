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
  const ranked = items
    .map((item, index) => {
      const success = predictedSuccess(learnerRating, item.difficultyRating);
      const inZone = success >= OPTIMAL_SUCCESS_ZONE.min && success <= OPTIMAL_SUCCESS_ZONE.max;
      return { item, index, success, inZone, gap: Math.abs(success - TARGET_SUCCESS) };
    })
    .sort((a, b) => Number(b.inZone) - Number(a.inZone) || a.gap - b.gap || a.index - b.index)
  const selected: typeof ranked = [];
  while (ranked.length && selected.length < Math.max(0, limit)) {
    const previousType = selected.at(-1)?.item.responseType;
    const differentTypeIndex = previousType
      ? ranked.findIndex((candidate) => candidate.item.responseType && candidate.item.responseType !== previousType)
      : -1;
    selected.push(...ranked.splice(differentTypeIndex >= 0 ? differentTypeIndex : 0, 1));
  }
  return selected.map(({ item }) => item);
}

export function remainingSessionSeconds(startedAtMs: number, nowMs: number): number {
  return Math.max(0, PRACTICE_SESSION_SECONDS - Math.floor((nowMs - startedAtMs) / 1000));
}

export function plannedExerciseCount(approvedItemCount: number): number {
  const approved = Math.max(0, Math.floor(approvedItemCount));
  return Math.min(PRACTICE_EXERCISE_TARGET, approved);
}

/** Never repeat an identical reviewed item inside one practice session. */
export function expandReviewedPractice<T>(items: readonly T[], count: number): T[] {
  if (!items.length || count <= 0) return [];
  return items.slice(0, count);
}

export function xpForPractice(input: { completed: boolean; perfect: boolean }) {
  if (!input.completed) return { base: 0, bonus: 0, total: 0 };
  const bonus = input.perfect ? PRACTICE_PERFECT_BONUS_XP : 0;
  return { base: PRACTICE_BASE_XP, bonus, total: PRACTICE_BASE_XP + bonus };
}
