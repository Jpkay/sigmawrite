/**
 * FSRS scheduler (gap-analysis Phase 2). Implements the DSR memory model of
 * the open-spaced-repetition project (FSRS-4.5 formulas): each reviewed item
 * carries a Difficulty (1–10) and a Stability (days for retrievability to fall
 * to 90%); Retrievability decays along a power-law forgetting curve. Reviews
 * update D and S from the grade and the retrievability at review time, and the
 * next interval is the time for R to reach the desired retention (0.90).
 *
 * Replaces the SM-2 ladder in retrieval.ts: FSRS predicts recall better than
 * SM-2 for ~99% of users at the same retention with ~20–30% fewer reviews
 * (open benchmark on 500M+ reviews). Default weights are the published
 * FSRS-4.5 defaults fitted on ~700M Anki reviews. Pure → unit-tested.
 */

import type { RetrievalResult } from "./retrieval";

/** FSRS grade: 1=Again, 2=Hard, 3=Good, 4=Easy. */
export type FsrsGrade = 1 | 2 | 3 | 4;

export type MemoryState = {
  /** Days for retrievability to decay from 100% to 90%. */
  stability: number;
  /** 1 (easiest) to 10 (hardest); dampens stability growth. */
  difficulty: number;
};

export const DESIRED_RETENTION = 0.9;

/** Published FSRS-4.5 default parameters (open-spaced-repetition). */
export const FSRS_WEIGHTS = [
  0.4872, 1.4003, 3.7145, 13.8206, // w0–w3: initial stability per first grade
  5.1618, 1.2298,                  // w4–w5: initial difficulty
  0.8975, 0.031,                   // w6–w7: difficulty update + mean reversion
  1.6474, 0.1367, 1.0461,          // w8–w10: recall stability growth
  2.1072, 0.0793, 0.3246, 1.587,   // w11–w14: post-lapse stability
  0.2272, 2.8755,                  // w15–w16: hard penalty / easy bonus
] as const;

// Power-law forgetting curve: R(t, S) = (1 + FACTOR·t/S)^DECAY, R(S, S) = 0.9.
const DECAY = -0.5;
const FACTOR = 19 / 81;

const clampDifficulty = (d: number) => Math.max(1, Math.min(10, d));
const clampStability = (s: number) => Math.max(0.01, s);

export const gradeOf = (result: RetrievalResult): FsrsGrade =>
  result === "forgot" ? 1 : result === "hard" ? 2 : result === "good" ? 3 : 4;

/** Probability of recall after `elapsedDays` at stability `S`. */
export function retrievability(state: MemoryState, elapsedDays: number): number {
  const t = Math.max(0, elapsedDays);
  return Math.pow(1 + (FACTOR * t) / state.stability, DECAY);
}

/** Days until retrievability drops to `retention` (interval to next review). */
export function intervalForRetention(
  stability: number,
  retention: number = DESIRED_RETENTION
): number {
  return (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
}

const initialDifficulty = (grade: FsrsGrade) =>
  clampDifficulty(FSRS_WEIGHTS[4] - (grade - 3) * FSRS_WEIGHTS[5]);

/** Memory state after the FIRST graded review of an item. */
export function initialState(grade: FsrsGrade): MemoryState {
  return {
    stability: clampStability(FSRS_WEIGHTS[grade - 1]),
    difficulty: initialDifficulty(grade),
  };
}

function nextDifficulty(d: number, grade: FsrsGrade): number {
  const updated = d - FSRS_WEIGHTS[6] * (grade - 3);
  // Mean reversion toward the initial difficulty of a "Good" first grade.
  return clampDifficulty(
    FSRS_WEIGHTS[7] * initialDifficulty(3) + (1 - FSRS_WEIGHTS[7]) * updated
  );
}

function recallStability(state: MemoryState, r: number, grade: FsrsGrade): number {
  const hardPenalty = grade === 2 ? FSRS_WEIGHTS[15] : 1;
  const easyBonus = grade === 4 ? FSRS_WEIGHTS[16] : 1;
  const growth =
    Math.exp(FSRS_WEIGHTS[8]) *
    (11 - state.difficulty) *
    Math.pow(state.stability, -FSRS_WEIGHTS[9]) *
    (Math.exp(FSRS_WEIGHTS[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;
  return clampStability(state.stability * (1 + growth));
}

function forgetStability(state: MemoryState, r: number): number {
  const s =
    FSRS_WEIGHTS[11] *
    Math.pow(state.difficulty, -FSRS_WEIGHTS[12]) *
    (Math.pow(state.stability + 1, FSRS_WEIGHTS[13]) - 1) *
    Math.exp(FSRS_WEIGHTS[14] * (1 - r));
  // Post-lapse stability can never exceed pre-lapse stability.
  return clampStability(Math.min(s, state.stability));
}

/** Memory state after a review `elapsedDays` after the previous one. */
export function review(
  state: MemoryState,
  elapsedDays: number,
  grade: FsrsGrade
): MemoryState {
  const r = retrievability(state, elapsedDays);
  return {
    stability:
      grade === 1 ? forgetStability(state, r) : recallStability(state, r, grade),
    difficulty: nextDifficulty(state.difficulty, grade),
  };
}

export type FsrsSchedule = MemoryState & { intervalDays: number };

/**
 * One-call scheduler: folds a graded review into the (possibly null) memory
 * state and returns the new state plus the next interval in whole days.
 */
export function scheduleFsrs(
  prev: MemoryState | null,
  result: RetrievalResult,
  elapsedDays: number,
  retention: number = DESIRED_RETENTION
): FsrsSchedule {
  const grade = gradeOf(result);
  const state = prev ? review(prev, elapsedDays, grade) : initialState(grade);
  const intervalDays = Math.max(
    1,
    Math.min(365, Math.round(intervalForRetention(state.stability, retention)))
  );
  return { ...state, intervalDays };
}
