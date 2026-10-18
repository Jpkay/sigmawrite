/**
 * Long-term simulations for the roadmap 2026-10 acceptance criteria:
 *  - C.1: a word answered "Good" at every review reaches an interval of
 *    180 days or more within 12 months, with 8 reviews or fewer.
 *  - C.5: over two school years with holidays (zone A, holiday pause on),
 *    the daily load never goes above the cap and no review of a word that
 *    is still learning is more than 3× overdue.
 */
import { describe, expect, it } from "vitest";
import { addDays, localDay } from "./days";
import { cardRetrievability, introducedCardSchedule, localDayStart, reviewWordCard } from "./card-scheduler";
import { DAILY_CAPS, overdueFactor, planWordDay, type PlannerCard } from "./daily-plan";
import type { CalendarSettings } from "./calendar";
import type { WordCardState } from "./types";

function emptyCard(facet: "spelling" | "meaning", introducedAt: string): WordCardState {
  const schedule = introducedCardSchedule(introducedAt);
  return { facet, stability: null, difficulty: null, reps: 0, lapses: 0, dueAt: schedule.dueAt, lastReviewedAt: null, introducedAt };
}

/** Deterministic PRNG (mulberry32) so the simulation is reproducible. */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("C.1 long-term intervals", () => {
  it("reaches a 180-day interval within 12 months with at most 8 Good reviews", () => {
    const introducedAt = "2026-09-07T15:00:00.000Z";
    let card = emptyCard("spelling", introducedAt);
    let reviews = 0;
    let reached: { reviews: number; day: number } | null = null;
    const end = Date.parse(introducedAt) + 365 * 86_400_000;
    while (Date.parse(card.dueAt) <= end && !reached) {
      const at = new Date(Date.parse(card.dueAt) + 12 * 3_600_000).toISOString();
      const next = reviewWordCard({ card, rating: 3, at, status: "en_route" });
      reviews++;
      card = { ...card, stability: next.stability, difficulty: next.difficulty, reps: next.reps, lapses: next.lapses, dueAt: next.dueAt, lastReviewedAt: at };
      if (next.intervalDays >= 180) reached = { reviews, day: Math.round((Date.parse(at) - Date.parse(introducedAt)) / 86_400_000) };
    }
    expect(reached).not.toBeNull();
    expect(reached!.reviews).toBeLessThanOrEqual(8);
    expect(reached!.day).toBeLessThanOrEqual(365);
  });

  it("schedules intervals up to five years and spreads equal cards with fuzz", () => {
    const base: WordCardState = { facet: "meaning", stability: 900, difficulty: 3, reps: 8, lapses: 0, dueAt: "2027-01-01T03:00:00.000Z", lastReviewedAt: "2024-07-01T10:00:00.000Z", introducedAt: "2023-09-01T10:00:00.000Z" };
    const intervals = new Set<number>();
    for (let day = 0; day < 6; day++) {
      const at = new Date(Date.parse("2027-01-01T10:00:00.000Z") + day * 86_400_000).toISOString();
      const next = reviewWordCard({ card: base, rating: 3, at, status: "ancre" });
      expect(next.intervalDays).toBeLessThanOrEqual(1825);
      expect(next.retention).toBe(0.85);
      intervals.add(next.intervalDays);
    }
    expect(Math.max(...intervals)).toBeGreaterThan(365);
    expect(intervals.size).toBeGreaterThan(1);
  });
});

describe("C.5 two school years with holidays", () => {
  it("never exceeds the daily cap and keeps learning words under 3× overdue", () => {
    const calendar: CalendarSettings = { zone: "A", pauseDuringHolidays: true };
    const random = rng(20261018);
    const cards: (WordCardState & { id: string; senseId: string })[] = [];
    const byId = new Map<string, (typeof cards)[number]>();
    const firstAttempts: boolean[] = [];
    let wordCount = 0;
    let activeDays = 0;
    let maxDailyReviews = 0;
    let maxOverdue = 0;
    let totalReviews = 0;
    for (let day = "2025-09-01"; day < "2027-07-03"; day = addDays(day, 1)) {
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      if (weekday === 0) continue; // Sundays off
      const now = localDayStart(day, 17);
      const planner: PlannerCard[] = cards.map((card) => ({
        id: card.id, senseId: card.senseId, facet: card.facet, dueAt: card.dueAt, lastReviewedAt: card.lastReviewedAt,
        introducedAt: card.introducedAt, stability: card.stability, difficulty: card.difficulty, importance: 1,
        learning: (card.stability ?? 0) < 180,
      }));
      const recent = firstAttempts.slice(-60);
      const plan = planWordDay({
        cards: planner, now, calendar, reviewsDoneToday: 0, newWordsIntroducedToday: 0,
        recentSuccessRate: recent.length >= 20 ? recent.filter(Boolean).length / recent.length : null, activeDays,
      });
      if (plan.paused) continue;
      activeDays++;
      expect(plan.reviews.length).toBeLessThanOrEqual(DAILY_CAPS.maxReviews);
      maxDailyReviews = Math.max(maxDailyReviews, plan.reviews.length);
      for (const planned of plan.reviews) {
        const card = byId.get(planned.id)!;
        if (planned.learning) maxOverdue = Math.max(maxOverdue, planned.overdueFactor);
        const p = card.lastReviewedAt ? cardRetrievability(card, now) : 0.85;
        const recalled = random() < p;
        firstAttempts.push(recalled);
        const next = reviewWordCard({ card, rating: recalled ? 3 : 1, at: now, status: planned.learning ? "en_route" : "ancre" });
        Object.assign(card, { stability: next.stability, difficulty: next.difficulty, reps: next.reps, lapses: next.lapses, dueAt: next.dueAt, lastReviewedAt: now });
        totalReviews++;
      }
      for (let index = 0; index < plan.newWordAllowance; index++) {
        const senseId = `w${wordCount++}`;
        for (const facet of ["spelling", "meaning"] as const) {
          const card = { ...emptyCard(facet, now), id: `${senseId}:${facet}`, senseId };
          cards.push(card);
          byId.set(card.id, card);
        }
      }
      // Nothing left behind: no learning card waiting more than 3 intervals.
      for (const card of cards) {
        if ((card.stability ?? 0) >= 180 || !card.lastReviewedAt) continue;
        maxOverdue = Math.max(maxOverdue, overdueFactor(card, now, calendar));
      }
    }
    expect(maxDailyReviews).toBeLessThanOrEqual(DAILY_CAPS.maxReviews);
    expect(maxOverdue).toBeLessThanOrEqual(3);
    // The system keeps teaching: a few hundred words over two years.
    expect(wordCount).toBeGreaterThan(150);
    expect(totalReviews).toBeGreaterThan(1000);
    expect(localDay(cards[0].introducedAt!)).toBe("2025-09-01");
  }, 180_000);
});
