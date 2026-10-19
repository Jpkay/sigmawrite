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

/**
 * Injectable scheduler settings. Existing callers (graph nodes, concept
 * cards) keep the LEGACY profile so their stored schedules do not shift.
 * Word memory (src/lib/vocabulary) uses LONG_TERM: up to five years between
 * reviews so a word can stay scheduled across the whole of collège, and fuzz
 * so reviews introduced together do not all fall due on the same day
 * (roadmap 2026-10 C.1). `weights` lets fitted parameters (C.3) replace the
 * ts-fsrs defaults without touching call sites.
 */
export type FsrsConfig = {
  weights?: readonly number[];
  maximumInterval: number;
  enableFuzz: boolean;
  retention: number;
};
export const LEGACY_FSRS_CONFIG: FsrsConfig = { maximumInterval: 365, enableFuzz: false, retention: DESIRED_RETENTION };
export const LONG_TERM_FSRS_CONFIG: FsrsConfig = { maximumInterval: 1825, enableFuzz: true, retention: DESIRED_RETENTION };

export const gradeOf = (result: RetrievalResult): FsrsGrade =>
  result === "forgot" ? 1 : result === "hard" ? 2 : result === "good" ? 3 : 4;

export function retrievability(state: MemoryState, elapsedDays: number, weights: readonly number[] = default_w): number {
  return forgetting_curve(weights, Math.max(0, elapsedDays), Math.max(0.01, state.stability));
}

export function intervalForRetention(stability: number, retention = DESIRED_RETENTION, weights: readonly number[] = default_w): number {
  const decay = -weights[20];
  const factor = Math.exp(Math.log(0.9) / decay) - 1;
  return Math.max(0, stability * (Math.pow(retention, 1 / decay) - 1) / factor);
}

const configuredScheduler = (config: FsrsConfig) => fsrs({
  request_retention: config.retention,
  maximum_interval: config.maximumInterval,
  enable_fuzz: config.enableFuzz,
  enable_short_term: false,
  learning_steps: [],
  relearning_steps: [],
  ...(config.weights ? { w: [...config.weights] } : {}),
});

const scheduler = (retention = DESIRED_RETENTION) => configuredScheduler({ ...LEGACY_FSRS_CONFIG, retention });

function rating(grade: FsrsGrade) {
  return grade === 1 ? Rating.Again : grade === 2 ? Rating.Hard : grade === 3 ? Rating.Good : Rating.Easy;
}

function reviewedCard(state: MemoryState, elapsedDays: number, now: Date, reps = 1, lapses = 0): Card {
  const elapsed = Math.max(0, elapsedDays);
  return {
    due: now,
    stability: Math.max(0.01, state.stability),
    difficulty: Math.max(1, Math.min(10, state.difficulty)),
    elapsed_days: elapsed,
    scheduled_days: Math.max(1, Math.round(elapsed)),
    learning_steps: 0,
    reps: Math.max(1, reps),
    lapses: Math.max(0, lapses),
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
  config: Partial<Omit<FsrsConfig, "retention">> = {},
): FsrsSchedule {
  const now = new Date(1_000_000_000_000);
  const resolved: FsrsConfig = { ...LEGACY_FSRS_CONFIG, ...config, retention };
  const input = prev ? reviewedCard(prev, elapsedDays, now) : createEmptyCard(now);
  const card = configuredScheduler(resolved).next(input, now, rating(gradeOf(result))).card;
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    intervalDays: Math.max(1, Math.min(resolved.maximumInterval, card.scheduled_days)),
  };
}

/**
 * Reviews one card with an explicit configuration and the real review time.
 * The real time seeds fuzz, so two cards with the same memory state reviewed
 * on different days get different (but reproducible) intervals.
 */
export function scheduleWithConfig(input: {
  prev: MemoryState | null;
  grade: FsrsGrade;
  elapsedDays: number;
  now: Date;
  config: FsrsConfig;
  reps?: number;
  lapses?: number;
}): FsrsSchedule {
  const card = input.prev
    ? reviewedCard(input.prev, input.elapsedDays, input.now, input.reps, input.lapses)
    : createEmptyCard(input.now);
  const next = configuredScheduler(input.config).next(card, input.now, rating(input.grade)).card;
  return {
    stability: next.stability,
    difficulty: next.difficulty,
    intervalDays: Math.max(1, Math.min(input.config.maximumInterval, next.scheduled_days)),
  };
}
