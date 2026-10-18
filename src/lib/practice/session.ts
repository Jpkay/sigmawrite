import { eloExpected, TARGET_SUCCESS } from "@/lib/scoring/elo";
import { interestAffinity } from "@/lib/content/interest-matching";

export const PRACTICE_SESSION_SECONDS = 7 * 60;
export const PRACTICE_EXERCISE_TARGET = 6;
export const PRACTICE_BASE_XP = 7;
export const PRACTICE_PERFECT_BONUS_XP = 3;
export const OPTIMAL_SUCCESS_ZONE = { min: 0.75, max: 0.85 } as const;

export type RatedPracticeItem = {
  difficultyRating: number;
  responseType?: string;
  interestKeys?: string[];
};

export function predictedSuccess(learnerRating: number, itemRating: number): number {
  return eloExpected(learnerRating, itemRating);
}

/**
 * How much an interest match is worth, in predicted-success points: an exact
 * interest match may be up to 5 points further from the 82% target than a
 * neutral item and still win (same group: 2.5, neighbour group: 1.25).
 * Roadmap E.4: a real weight, yet it only ever reorders items that are
 * already inside the success zone.
 */
export const INTEREST_FIT_BONUS = 0.05;

/**
 * Put items in the learner's 75–85% success zone first, closest to 82%.
 * Items outside the zone are retained as fallbacks so sparse reviewed banks
 * still produce a useful session; an interest never lifts an out-of-zone item
 * above an in-zone one. Inside the zone, interest shifts the fit by up to
 * `INTEREST_FIT_BONUS`. Response types are interleaved on near-ties, and the
 * session opens on a themed item when one was selected (roadmap rule 2).
 */
export function selectOptimalPracticeItems<T extends RatedPracticeItem>(
  items: T[],
  learnerRating: number,
  limit = PRACTICE_EXERCISE_TARGET,
  interests: string[] = [],
): T[] {
  const ranked = items
    .map((item, index) => {
      const success = predictedSuccess(learnerRating, item.difficultyRating);
      const inZone = success >= OPTIMAL_SUCCESS_ZONE.min && success <= OPTIMAL_SUCCESS_ZONE.max;
      const gap = Math.abs(success - TARGET_SUCCESS);
      const affinity = interestAffinity(item.interestKeys ?? [], interests);
      const fit = inZone ? Math.max(0, gap - INTEREST_FIT_BONUS * affinity) : gap;
      return { item, index, success, inZone, gap, fit, fitBand: Math.floor((fit + 1e-9) / 0.03), affinity };
    })
    .sort((a, b) => Number(b.inZone) - Number(a.inZone) || a.fitBand - b.fitBand || b.affinity - a.affinity || a.gap - b.gap || a.index - b.index);
  const selected: typeof ranked = [];
  while (ranked.length && selected.length < Math.max(0, limit)) {
    const previousType = selected.at(-1)?.item.responseType;
    const differentTypeIndex = previousType
      ? ranked.findIndex((candidate) => candidate.inZone === ranked[0].inZone && candidate.fit <= ranked[0].fit + 0.03 && candidate.affinity === ranked[0].affinity && candidate.item.responseType && candidate.item.responseType !== previousType)
      : -1;
    selected.push(...ranked.splice(differentTypeIndex >= 0 ? differentTypeIndex : 0, 1));
  }
  // Interest first: open on the best themed in-zone pick when it is not already first.
  const themedIndex = selected.findIndex((entry) => entry.inZone && entry.affinity > 0);
  if (themedIndex > 0 && selected[0].affinity === 0 && selected[0].inZone) selected.unshift(...selected.splice(themedIndex, 1));
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
