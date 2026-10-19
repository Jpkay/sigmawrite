/**
 * Long-term FSRS scheduling for word cards (roadmap 2026-10 C.1, C.2, C.4).
 *
 *  - Intervals up to 1825 days and fuzz on (LONG_TERM_FSRS_CONFIG).
 *  - Desired retention 0.90 while a word is learning, 0.85 once it is "Ancré".
 *  - A card exists only after the word was introduced (C.2); its first
 *    review comes the next day, never "due immediately".
 *  - Only the first counted attempt of the day updates FSRS (C.4). Retries,
 *    same-day repeats and the introduction day itself are logged but leave
 *    the memory state untouched. FSRS always uses the real time elapsed.
 */
import { LONG_TERM_FSRS_CONFIG, retrievability, scheduleWithConfig, type FsrsConfig } from "@/lib/scoring/fsrs";
import { addDays, elapsedDays, localDay, MEMORY_TIME_ZONE, sameLocalDay } from "./days";
import type { FsrsRating, WordCardState, WordStatus } from "./types";

export const WORD_SCHEDULING = {
  learningRetention: 0.9,
  anchoredRetention: 0.85,
  /** Days between the introduction and the first review. */
  firstReviewDelayDays: 1,
  /** Local hour at which a newly scheduled card becomes due. */
  dueHour: 4,
  timeZone: MEMORY_TIME_ZONE,
} as const;

export function retentionForStatus(status: WordStatus | null | undefined): number {
  return status === "ancre" ? WORD_SCHEDULING.anchoredRetention : WORD_SCHEDULING.learningRetention;
}

/** Start of a Paris calendar day as an ISO instant (handles CET/CEST). */
export function localDayStart(day: string, hour = 0): string {
  // Paris is UTC+1 or UTC+2. Try both offsets and keep the one that maps back to `day`.
  for (const offset of [1, 2]) {
    const candidate = new Date(Date.parse(`${day}T${String(hour).padStart(2, "0")}:00:00Z`) - offset * 3_600_000);
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: WORD_SCHEDULING.timeZone, hour: "2-digit", hourCycle: "h23" }).format(candidate);
    if (localDay(candidate) === day && Number(parts) === hour) return candidate.toISOString();
  }
  return new Date(Date.parse(`${day}T${String(hour).padStart(2, "0")}:00:00Z`) - 3_600_000).toISOString();
}

/** Due instant `days` local days after `at`, at the configured local hour. */
export function dueAfter(at: string | Date, days: number): string {
  return localDayStart(addDays(localDay(at), Math.max(1, Math.round(days))), WORD_SCHEDULING.dueHour);
}

/** The two empty cards created when a word is introduced (D.1 → C.2). */
export function introducedCardSchedule(introducedAt: string) {
  return { dueAt: dueAfter(introducedAt, WORD_SCHEDULING.firstReviewDelayDays), introducedAt };
}

/**
 * C.4: does an attempt at `at` update FSRS? No if the card was already
 * reviewed (or introduced) earlier the same Paris day.
 */
export function countsForFsrs(card: Pick<WordCardState, "lastReviewedAt" | "introducedAt"> | null, at: string | Date): boolean {
  if (!card) return false;
  if (sameLocalDay(card.lastReviewedAt, at)) return false;
  if (!card.lastReviewedAt && sameLocalDay(card.introducedAt, at)) return false;
  return true;
}

export type CardReview = {
  stability: number;
  difficulty: number;
  intervalDays: number;
  dueAt: string;
  reps: number;
  lapses: number;
  elapsedDays: number;
  retrievabilityBefore: number | null;
  retention: number;
};

/** Applies one counted rating to a card with the real elapsed time. */
export function reviewWordCard(input: {
  card: WordCardState;
  rating: FsrsRating;
  at: string;
  status: WordStatus | null;
  weights?: readonly number[];
  config?: FsrsConfig;
}): CardReview {
  const retention = retentionForStatus(input.status);
  const config: FsrsConfig = { ...(input.config ?? LONG_TERM_FSRS_CONFIG), retention, ...(input.weights ? { weights: input.weights } : {}) };
  const prev = input.card.stability != null && input.card.difficulty != null
    ? { stability: input.card.stability, difficulty: input.card.difficulty }
    : null;
  const elapsed = elapsedDays(input.card.lastReviewedAt, input.at);
  const next = scheduleWithConfig({
    prev,
    grade: input.rating,
    elapsedDays: elapsed,
    now: new Date(input.at),
    config,
    reps: input.card.reps,
    lapses: input.card.lapses,
  });
  return {
    stability: next.stability,
    difficulty: next.difficulty,
    intervalDays: next.intervalDays,
    dueAt: dueAfter(input.at, next.intervalDays),
    reps: input.card.reps + 1,
    lapses: input.card.lapses + (prev && input.rating === 1 ? 1 : 0),
    elapsedDays: elapsed,
    retrievabilityBefore: prev ? retrievability(prev, elapsed, input.weights) : null,
    retention,
  };
}

export function cardRetrievability(card: Pick<WordCardState, "stability" | "difficulty" | "lastReviewedAt">, at: string | Date, weights?: readonly number[]): number {
  if (card.stability == null || card.difficulty == null || !card.lastReviewedAt) return 0;
  return retrievability({ stability: card.stability, difficulty: card.difficulty }, elapsedDays(card.lastReviewedAt, at), weights);
}
