/**
 * Elo/1PL ability–difficulty ratings (gap-analysis Phase 3). The streaming
 * approximation of a Rasch model: each answer is a match between the learner
 * and the item; both ratings move toward the observed outcome with an
 * uncertainty-decayed K (Pelánek, "Applications of the Elo rating system in
 * adaptive educational systems").
 *
 * Practice item selection targets ~82% predicted success — the optimal-
 * difficulty zone (85% rule, Wilson et al. 2019; the app's historic 80–85%
 * success zone) — instead of a static easy→hard ramp. Assessment items keep
 * their own max-information (~50%) selection in the diagnostic.
 *
 * Ratings live on a logit scale (0 = average). Authored 0–100 difficulty
 * seeds an item's prior rating until real attempts calibrate it.
 */

export const TARGET_SUCCESS = 0.82;

const K0 = 0.5;
const K_DECAY_ATTEMPTS = 10;

/** P(correct) for learner θ against item difficulty b (1PL). */
export function eloExpected(theta: number, b: number): number {
  return 1 / (1 + Math.exp(-(theta - b)));
}

/** Uncertainty-decayed K: new players/items move fast, calibrated ones slowly. */
export function eloK(attempts: number): number {
  return K0 / (1 + Math.max(0, attempts) / K_DECAY_ATTEMPTS);
}

/** Learner rating after one observed outcome (item rating moves opposite). */
export function eloUpdate(
  rating: number,
  opponentRating: number,
  correct: boolean,
  attempts: number
): number {
  const expected = eloExpected(rating, opponentRating);
  return rating + eloK(attempts) * ((correct ? 1 : 0) - expected);
}

/** Prior item rating from the authored 0–100 difficulty (50 ≈ average). */
export function itemRatingFromDifficulty(difficulty: number | null): number {
  if (difficulty == null || !Number.isFinite(difficulty)) return 0;
  return (difficulty - 50) / 15;
}

/**
 * Orders items so the first has predicted success closest to `target`.
 * Stable for equal distances (keeps the incoming order as tiebreak).
 */
export function orderByTargetSuccess<T>(
  items: T[],
  ratingOf: (item: T) => number,
  theta: number,
  target: number = TARGET_SUCCESS
): T[] {
  return items
    .map((item, index) => ({ item, index, gap: Math.abs(eloExpected(theta, ratingOf(item)) - target) }))
    .sort((a, b) => a.gap - b.gap || a.index - b.index)
    .map((entry) => entry.item);
}
