const DAY = 86_400_000;
const dateKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const DAILY_XP_GOALS = [10, 15, 20] as const;
export type DailyXpGoal = (typeof DAILY_XP_GOALS)[number];
export const MAX_BANKED_FREEZES = 2;
export const FREEZE_MILESTONE_DAYS = 7;

/** Effort-calibrated awards: roughly one XP per focused minute, bonus only for unaided quality. */
export const XP_AWARDS = {
  practiceBase: 7,
  practicePerfectBonus: 3,
  readingBase: 8,
  readingSuccessBonus: 2,
  retrievalReview: 1,
  vocabularyReview: 1,
  productionBase: 8,
  productionDemonstratedBonus: 2,
  dictationBase: 6,
  dictationCleanBonus: 2,
} as const;

export type ActivityDay = { date: string; goalCompleted: boolean; freezeUsed?: boolean };

/**
 * Consecutive calendar days ending today (or yesterday when today is still
 * pending) on which the goal was completed or a freeze covered the gap.
 */
export function calculateStreak(activityDates: string[], nowMs: number): number;
export function calculateStreak(days: ActivityDay[], nowMs: number): number;
export function calculateStreak(input: string[] | ActivityDay[], nowMs: number) {
  const qualifying = new Set<string>();
  for (const entry of input) {
    if (typeof entry === "string") qualifying.add(entry);
    else if (entry.goalCompleted || entry.freezeUsed) qualifying.add(entry.date);
  }
  let cursor = Date.parse(`${dateKey(nowMs)}T00:00:00.000Z`);
  if (!qualifying.has(dateKey(cursor))) cursor -= DAY;
  let streak = 0;
  while (qualifying.has(dateKey(cursor))) { streak++; cursor -= DAY; }
  return streak;
}

/**
 * The day a banked freeze should cover: yesterday, when yesterday is a real
 * gap and the day before was a qualifying day. Returns null otherwise so
 * freezes never pad an inactive account.
 */
export function freezeCandidate(days: ActivityDay[], nowMs: number, freezesAvailable: number): string | null {
  if (freezesAvailable <= 0) return null;
  const byDate = new Map(days.map((day) => [day.date, day]));
  const yesterday = dateKey(Date.parse(`${dateKey(nowMs)}T00:00:00.000Z`) - DAY);
  const before = dateKey(Date.parse(`${yesterday}T00:00:00.000Z`) - DAY);
  const gap = byDate.get(yesterday);
  const prior = byDate.get(before);
  if (gap && (gap.goalCompleted || gap.freezeUsed)) return null;
  if (!prior || !(prior.goalCompleted || prior.freezeUsed)) return null;
  return yesterday;
}

/** Milestone (multiple of seven) reached by a streak that has not been rewarded yet. */
export function unrewardedMilestone(streak: number, lastMilestone: number): number | null {
  const milestone = Math.floor(streak / FREEZE_MILESTONE_DAYS) * FREEZE_MILESTONE_DAYS;
  return milestone >= FREEZE_MILESTONE_DAYS && milestone > lastMilestone ? milestone : null;
}

export function isDailyXpGoal(value: number): value is DailyXpGoal {
  return (DAILY_XP_GOALS as readonly number[]).includes(value);
}

/** Seven calendar days ending today, oldest first, filled from sparse rows. */
export function weekStrip(days: ActivityDay[], nowMs: number, xpByDate: Record<string, number> = {}) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const today = Date.parse(`${dateKey(nowMs)}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = dateKey(today - (6 - index) * DAY);
    const day = byDate.get(date);
    return { date, xp: xpByDate[date] ?? 0, goalCompleted: !!day?.goalCompleted, freezeUsed: !!day?.freezeUsed, isToday: index === 6 };
  });
}
