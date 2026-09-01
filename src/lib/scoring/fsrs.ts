/**
 * Maintained FSRS-6 adapter. SigmaWrite stores only the durable DSR state
 * (difficulty + stability); ts-fsrs owns the scheduling formulas and default
 * 21-parameter model. This keeps existing database rows compatible while
 * replacing the former hand-coded FSRS-4.5 implementation.
 */
import {
  Rating,
  State,
  createEmptyCard,
  default_w,
  forgetting_curve,
  fsrs,
  type Card,
} from "ts-fsrs";
import type { RetrievalResult } from "./retrieval";

export type FsrsGrade = 1 | 2 | 3 | 4;
export type MemoryState = { stability: number; difficulty: number };
export const DESIRED_RETENTION = 0.9;
export const FSRS_WEIGHTS = default_w;

export const gradeOf = (result: RetrievalResult): FsrsGrade =>
  result === "forgot" ? 1 : result === "hard" ? 2 : result === "good" ? 3 : 4;

export function retrievability(state: MemoryState, elapsedDays: number): number {
  return forgetting_curve(default_w, Math.max(0, elapsedDays), Math.max(0.01, state.stability));
}

export function intervalForRetention(stability: number, retention = DESIRED_RETENTION): number {
  const decay = -default_w[20];
  const factor = Math.exp(Math.log(0.9) / decay) - 1;
  return Math.max(0, stability * (Math.pow(retention, 1 / decay) - 1) / factor);
}

const scheduler = (retention = DESIRED_RETENTION) => fsrs({
  request_retention: retention,
  maximum_interval: 365,
  enable_fuzz: false,
  enable_short_term: false,
  learning_steps: [],
  relearning_steps: [],
});

function rating(grade: FsrsGrade) {
  return grade === 1 ? Rating.Again : grade === 2 ? Rating.Hard : grade === 3 ? Rating.Good : Rating.Easy;
}

function reviewedCard(state: MemoryState, elapsedDays: number, now: Date): Card {
  const elapsed = Math.max(0, elapsedDays);
  return {
    due: now,
    stability: Math.max(0.01, state.stability),
    difficulty: Math.max(1, Math.min(10, state.difficulty)),
    elapsed_days: elapsed,
    scheduled_days: Math.max(1, Math.round(elapsed)),
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: State.Review,
    last_review: new Date(now.getTime() - elapsed * 86_400_000),
  };
}

export function initialState(grade: FsrsGrade): MemoryState {
  const now = new Date(0);
  const card = scheduler().next(createEmptyCard(now), now, rating(grade)).card;
  return { stability: card.stability, difficulty: card.difficulty };
}

export function review(state: MemoryState, elapsedDays: number, grade: FsrsGrade): MemoryState {
  const now = new Date(1_000_000_000_000);
  const card = scheduler().next(reviewedCard(state, elapsedDays, now), now, rating(grade)).card;
  return { stability: card.stability, difficulty: card.difficulty };
}

export type FsrsSchedule = MemoryState & { intervalDays: number };

export function scheduleFsrs(
  prev: MemoryState | null,
  result: RetrievalResult,
  elapsedDays: number,
  retention = DESIRED_RETENTION,
): FsrsSchedule {
  const now = new Date(1_000_000_000_000);
  const input = prev ? reviewedCard(prev, elapsedDays, now) : createEmptyCard(now);
  const card = scheduler(retention).next(input, now, rating(gradeOf(result))).card;
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    intervalDays: Math.max(1, Math.min(365, card.scheduled_days)),
  };
}
