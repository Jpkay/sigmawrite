/**
 * Daily word workload (roadmap 2026-10 C.5): caps, holiday pause and the
 * back-to-school ramp. Pure: the server loads cards and settings, this
 * decides which reviews fit today and how many new words may be introduced.
 *
 *  - At most ~15 card reviews a day (~3 minutes) and 3–6 new words.
 *  - New words drop automatically when reviews pile up or when recent
 *    success falls below 75 %. The first week stays gentle (rule 6).
 *  - With the holiday pause on, nothing is planned during holidays and the
 *    paused days do not count as "overdue"; FSRS itself still sees the real
 *    elapsed time, so memory estimates stay right.
 *  - Due cards are ordered by (1 − retrievability) × importance, learning
 *    words first, plus an urgency term for learning cards more than one
 *    interval late, and capped. After a holiday this is the back-to-school
 *    ramp: nobody faces 200 overdue reviews and new words wait.
 */
import { addDays, elapsedDays, localDay } from "./days";
import { cardRetrievability } from "./card-scheduler";
import { holidayOn, isPausedDay, pausedDaysBetween, recentHolidayEnd, type CalendarSettings, type HolidayPeriod } from "./calendar";
import type { WordFacet } from "./types";

export const DAILY_CAPS = {
  maxReviews: 15,
  newWordsMin: 3,
  newWordsMax: 6,
  /** New words per day during the first week of use. */
  gentleNewWords: 3,
  gentleDays: 7,
  lowSuccessThreshold: 0.75,
  highSuccessThreshold: 0.85,
  /** New words per day while recent success is below the low threshold. */
  lowSuccessNewWords: 1,
  /** Card reviews one new word adds over its first week (two cards, ~2 reviews each). */
  newWordWeeklyLoad: 4,
  forecastDays: 7,
  rampDays: 7,
  /** Priority multiplier for words that are not yet "Ancré". */
  learningBoost: 1.5,
  /**
   * Safety term: a learning card more than one interval late gains this much
   * priority per extra interval, so short intervals (after a lapse) are never
   * starved by a post-holiday backlog.
   */
  overdueUrgency: 1,
} as const;
export type DailyCaps = { -readonly [K in keyof typeof DAILY_CAPS]: number };

export type PlannerCard = {
  id: string;
  senseId: string;
  facet: WordFacet;
  dueAt: string;
  lastReviewedAt: string | null;
  introducedAt: string | null;
  stability: number | null;
  difficulty: number | null;
  /** 0–10, default 1. Curriculum words and words due inside today's content can weigh more. */
  importance: number;
  /** False once the word is "Ancré". */
  learning: boolean;
};

export type PlannedReview = PlannerCard & {
  retrievability: number;
  overdueFactor: number;
  priority: number;
  effectiveDueAt: string;
};

export type DailyPlanInput = {
  cards: PlannerCard[];
  now: string | Date;
  calendar: CalendarSettings;
  reviewsDoneToday: number;
  newWordsIntroducedToday: number;
  /** Share of correct first attempts over the recent reviews, null if too few. */
  recentSuccessRate: number | null;
  /** Distinct days the student has done word work. */
  activeDays: number;
  caps?: Partial<DailyCaps>;
  weights?: readonly number[];
};

export type DailyPlan = {
  day: string;
  paused: boolean;
  holiday: HolidayPeriod | null;
  rampActive: boolean;
  /** Cards due today (after the pause stretch), before the cap. */
  dueCount: number;
  reviewSlotsLeft: number;
  reviews: PlannedReview[];
  newWordAllowance: number;
  reasons: string[];
};

const DAY_MS = 86_400_000;

/** Due date stretched by the paused holiday days since the card's last touch. */
export function effectiveDueAt(card: Pick<PlannerCard, "dueAt" | "lastReviewedAt" | "introducedAt">, now: string | Date, calendar: CalendarSettings): string {
  const paused = pausedDaysBetween(card.lastReviewedAt ?? card.introducedAt, now, calendar);
  return paused ? new Date(Date.parse(card.dueAt) + paused * DAY_MS).toISOString() : card.dueAt;
}

/**
 * How late a review is relative to its interval, counting only days that
 * were not paused: 1 = on time, 3 = three intervals late.
 */
export function overdueFactor(card: Pick<PlannerCard, "dueAt" | "lastReviewedAt" | "introducedAt">, now: string | Date, calendar: CalendarSettings): number {
  if (!card.lastReviewedAt) return 0;
  const interval = Math.max(1, elapsedDays(card.lastReviewedAt, card.dueAt));
  const elapsed = elapsedDays(card.lastReviewedAt, now) - pausedDaysBetween(card.lastReviewedAt, now, calendar);
  return Math.max(0, elapsed) / interval;
}

export function planWordDay(input: DailyPlanInput): DailyPlan {
  const caps: DailyCaps = { ...DAILY_CAPS, ...input.caps };
  const day = localDay(input.now);
  const holiday = holidayOn(day, input.calendar);
  const reasons: string[] = [];
  if (isPausedDay(day, input.calendar)) {
    return { day, paused: true, holiday, rampActive: false, dueCount: 0, reviewSlotsLeft: 0, reviews: [], newWordAllowance: 0, reasons: ["holiday_pause"] };
  }
  const rampActive = recentHolidayEnd(day, input.calendar, caps.rampDays) !== null;
  const due: PlannedReview[] = [];
  let upcoming = 0;
  const horizon = addDays(day, caps.forecastDays);
  for (const card of input.cards) {
    if (card.lastReviewedAt && localDay(card.lastReviewedAt) === day) continue;
    const effective = effectiveDueAt(card, input.now, input.calendar);
    const dueDay = localDay(effective);
    if (dueDay > day) {
      if (dueDay <= horizon) upcoming++;
      continue;
    }
    const retrievability = card.lastReviewedAt ? cardRetrievability(card, input.now, input.weights) : 0;
    const importance = Math.max(0, Number.isFinite(card.importance) ? card.importance : 1);
    const late = overdueFactor(card, input.now, input.calendar);
    due.push({
      ...card,
      retrievability,
      overdueFactor: late,
      priority: (1 - retrievability) * Math.max(0.1, importance) * (card.learning ? caps.learningBoost : 1)
        + (card.learning ? caps.overdueUrgency * Math.max(0, late - 1) : 0),
      effectiveDueAt: effective,
    });
  }
  due.sort((a, b) => b.priority - a.priority || a.effectiveDueAt.localeCompare(b.effectiveDueAt) || a.id.localeCompare(b.id));
  const reviewSlotsLeft = Math.max(0, caps.maxReviews - input.reviewsDoneToday);
  const reviews = due.slice(0, reviewSlotsLeft);
  if (due.length > reviewSlotsLeft) reasons.push("review_cap");
  if (rampActive) reasons.push("back_to_school_ramp");

  let allowance: number;
  if (input.activeDays < caps.gentleDays) {
    allowance = caps.gentleNewWords;
    reasons.push("gentle_start");
  } else if (input.recentSuccessRate == null) {
    allowance = caps.newWordsMin;
  } else if (input.recentSuccessRate < caps.lowSuccessThreshold) {
    allowance = caps.lowSuccessNewWords;
    reasons.push("low_success");
  } else if (input.recentSuccessRate >= caps.highSuccessThreshold) {
    allowance = caps.newWordsMax;
  } else {
    allowance = Math.round((caps.newWordsMin + caps.newWordsMax) / 2);
  }
  const backlog = Math.max(0, due.length - reviewSlotsLeft);
  const projectedDaily = (due.length + upcoming) / caps.forecastDays;
  const headroom = caps.maxReviews - projectedDaily;
  const byLoad = Math.max(0, Math.floor((headroom * caps.forecastDays) / caps.newWordWeeklyLoad));
  if (byLoad < allowance) { allowance = byLoad; reasons.push("review_load"); }
  if (backlog > 0 || (rampActive && due.length > caps.maxReviews / 2)) { allowance = 0; reasons.push("backlog"); }
  else if (due.length > caps.maxReviews / 2) { allowance = Math.max(0, allowance - 2); reasons.push("reviews_piling_up"); }
  const newWordAllowance = Math.max(0, Math.min(caps.newWordsMax, allowance) - input.newWordsIntroducedToday);
  return { day, paused: false, holiday, rampActive, dueCount: due.length, reviewSlotsLeft, reviews, newWordAllowance, reasons };
}
