import { describe, expect, it } from "vitest";
import { gradeSpelling, ratingForAttempt } from "./grading";
import { emptyRelearningQueue, nextRelearningItem, recordSessionAttempt } from "./relearning";
import { holidayOn, pausedDaysBetween, recentHolidayEnd } from "./calendar";
import { countsForFsrs, introducedCardSchedule, localDayStart, retentionForStatus } from "./card-scheduler";
import { planWordDay, type PlannerCard } from "./daily-plan";
import { localDay } from "./days";
import { evidenceKindFor } from "./types";

describe("gradeSpelling", () => {
  it("separates exact, accent slips, one-letter slips and wrong answers", () => {
    expect(gradeSpelling(" Intrépide ", "intrépide")).toBe("exact");
    expect(gradeSpelling("aujourd’hui", "aujourd'hui")).toBe("exact");
    expect(gradeSpelling("intrepide", "intrépide")).toBe("accent");
    expect(gradeSpelling("intrépid", "intrépide")).toBe("near");
    expect(gradeSpelling("courageux", "intrépide")).toBe("wrong");
    expect(gradeSpelling("", "intrépide")).toBe("wrong");
  });
});

describe("ratingForAttempt (B.4)", () => {
  const base = { correct: true, format: "hear_and_type" as const, responseMs: 4000 };
  it.each([
    ["unaided correct", base, 3],
    ["wrong", { ...base, correct: false }, 1],
    ["answer shown", { ...base, answerRevealed: true }, 1],
    ["hint level 3 is the correction", { ...base, hintLevel: 3 }, 1],
    ["first-letter hint caps at Good", { ...base, hintLevel: 1 }, 3],
    ["any other hint caps at Hard", { ...base, hintLevel: 2 }, 2],
    ["accent mistake is Hard", { ...base, correct: false, accentOnly: true }, 2],
    ["slow answer loses one level", { ...base, responseMs: 60_000 }, 2],
    ["slow correct answer never becomes a lapse", { ...base, hintLevel: 2, responseMs: 60_000 }, 2],
    ["recognition is weak credit", { ...base, format: "pick_definition" as const }, 2],
  ])("%s", (_name, attempt, expected) => {
    expect(ratingForAttempt(attempt)).toBe(expected);
  });
  it("maps formats to evidence kinds", () => {
    expect(evidenceKindFor("dictation", "spelling")).toBe("correct_spelling");
    expect(evidenceKindFor("free_writing", "spelling")).toBe("contextual_use");
    expect(evidenceKindFor("type_from_definition", "meaning")).toBe("meaning_recall");
    expect(evidenceKindFor("pick_spelling", "spelling")).toBe("recognition");
    expect(evidenceKindFor("reading_exposure", null)).toBe("exposure");
    expect(evidenceKindFor("lookup", null)).toBe("help_lookup");
  });
});

describe("in-session relearning (C.4)", () => {
  it("brings a missed word back 2–4 items later in another format until one success", () => {
    let queue = recordSessionAttempt(emptyRelearningQueue(), { senseId: "s1", facet: "spelling", format: "hear_and_type", correct: false, position: 3 });
    const entry = queue.entries[0];
    expect(entry.dueAtPosition - 3).toBeGreaterThanOrEqual(2);
    expect(entry.dueAtPosition - 3).toBeLessThanOrEqual(4);
    expect(nextRelearningItem(queue, 4, () => ["hear_and_type", "gap_fill_typed"])).toBeNull();
    const next = nextRelearningItem(queue, entry.dueAtPosition, () => ["hear_and_type", "gap_fill_typed"]);
    expect(next?.format).toBe("gap_fill_typed");
    queue = recordSessionAttempt(queue, { senseId: "s1", facet: "spelling", format: "gap_fill_typed", correct: true, position: entry.dueAtPosition });
    expect(queue.entries).toHaveLength(0);
    expect(queue.resolved).toEqual(["s1:spelling"]);
  });

  it("only the first attempt of the day updates FSRS", () => {
    const card = { lastReviewedAt: "2026-10-05T07:00:00.000Z", introducedAt: "2026-09-01T07:00:00.000Z" };
    expect(countsForFsrs(card, "2026-10-05T18:00:00.000Z")).toBe(false);
    expect(countsForFsrs(card, "2026-10-06T06:00:00.000Z")).toBe(true);
    expect(countsForFsrs({ lastReviewedAt: null, introducedAt: "2026-10-05T07:00:00.000Z" }, "2026-10-05T19:00:00.000Z")).toBe(false);
    expect(countsForFsrs(null, "2026-10-05T19:00:00.000Z")).toBe(false);
  });
});

describe("introduction and retention (C.1, C.2)", () => {
  it("a new word's first review is the next day, never immediately", () => {
    const { dueAt } = introducedCardSchedule("2026-10-05T19:30:00.000Z");
    expect(localDay(dueAt)).toBe("2026-10-06");
    expect(localDayStart("2026-03-29", 4)).toBe("2026-03-29T02:00:00.000Z");
    expect(localDayStart("2026-01-15", 4)).toBe("2026-01-15T03:00:00.000Z");
  });
  it("uses 0.90 while learning and 0.85 for anchored words", () => {
    expect(retentionForStatus("presque")).toBe(0.9);
    expect(retentionForStatus("ancre")).toBe(0.85);
  });
});

describe("school calendar (C.5)", () => {
  it("knows zone holidays and custom periods", () => {
    expect(holidayOn("2026-10-18", { zone: "A", pauseDuringHolidays: true })?.label).toBe("Vacances de la Toussaint");
    expect(holidayOn("2026-11-02", { zone: "A", pauseDuringHolidays: true })).toBeNull();
    expect(holidayOn("2027-02-08", { zone: "C", pauseDuringHolidays: true })).not.toBeNull();
    expect(holidayOn("2027-02-08", { zone: "A", pauseDuringHolidays: true })).toBeNull();
    expect(holidayOn("2026-05-20", { zone: "custom", customHolidays: [{ start: "2026-05-18", end: "2026-05-25", label: "Pont" }], pauseDuringHolidays: false })?.label).toBe("Pont");
    expect(holidayOn("2026-10-18", { zone: null, pauseDuringHolidays: true })).toBeNull();
  });
  it("counts paused days only when the pause is on", () => {
    expect(pausedDaysBetween("2026-10-16T10:00:00Z", "2026-11-03T10:00:00Z", { zone: "B", pauseDuringHolidays: true })).toBe(16);
    expect(pausedDaysBetween("2026-10-16T10:00:00Z", "2026-11-03T10:00:00Z", { zone: "B", pauseDuringHolidays: false })).toBe(0);
    expect(recentHolidayEnd("2026-11-04", { zone: "B", pauseDuringHolidays: true }, 7)?.end).toBe("2026-11-02");
  });
});

describe("planWordDay (C.5)", () => {
  const card = (id: string, dueAt: string, lastReviewedAt: string | null, stability: number | null, importance = 1): PlannerCard => ({
    id, senseId: id, facet: "spelling", dueAt, lastReviewedAt, introducedAt: "2026-09-01T10:00:00Z", stability, difficulty: 5, importance, learning: (stability ?? 0) < 180,
  });
  const now = "2026-11-03T16:00:00Z";
  it("pauses during holidays when asked", () => {
    const plan = planWordDay({ cards: [card("a", "2026-10-20T03:00:00Z", "2026-10-10T10:00:00Z", 10)], now: "2026-10-20T16:00:00Z", calendar: { zone: "A", pauseDuringHolidays: true }, reviewsDoneToday: 0, newWordsIntroducedToday: 0, recentSuccessRate: 0.9, activeDays: 30 });
    expect(plan.paused).toBe(true);
    expect(plan.reviews).toHaveLength(0);
    expect(plan.newWordAllowance).toBe(0);
  });
  it("caps a post-holiday backlog, orders it by retrievability × importance and stops new words", () => {
    const cards = Array.from({ length: 200 }, (_, index) => card(`c${index}`, "2026-10-20T03:00:00Z", "2026-10-10T10:00:00Z", 2 + (index % 50), index === 150 ? 5 : 1));
    const plan = planWordDay({ cards, now, calendar: { zone: "A", pauseDuringHolidays: false }, reviewsDoneToday: 0, newWordsIntroducedToday: 0, recentSuccessRate: 0.9, activeDays: 30 });
    expect(plan.rampActive).toBe(true);
    expect(plan.dueCount).toBe(200);
    expect(plan.reviews).toHaveLength(15);
    expect(plan.reviews[0].id).toBe("c150");
    expect(plan.reviews.slice(1).every((review, index, list) => index === 0 || list[index - 1].retrievability <= review.retrievability + 1e-9)).toBe(true);
    expect(plan.newWordAllowance).toBe(0);
  });
  it("starts gently, rises when keeping up, drops below 75 % success", () => {
    const base = { cards: [], now, calendar: { zone: null, pauseDuringHolidays: false }, reviewsDoneToday: 0, newWordsIntroducedToday: 0 };
    expect(planWordDay({ ...base, recentSuccessRate: null, activeDays: 2 }).newWordAllowance).toBe(3);
    expect(planWordDay({ ...base, recentSuccessRate: 0.92, activeDays: 20 }).newWordAllowance).toBe(6);
    expect(planWordDay({ ...base, recentSuccessRate: 0.7, activeDays: 20 }).newWordAllowance).toBe(1);
    expect(planWordDay({ ...base, recentSuccessRate: 0.92, activeDays: 20, newWordsIntroducedToday: 4 }).newWordAllowance).toBe(2);
  });
  it("counts reviews already done today against the cap", () => {
    const cards = Array.from({ length: 20 }, (_, index) => card(`c${index}`, "2026-11-02T03:00:00Z", "2026-10-30T10:00:00Z", 3));
    const plan = planWordDay({ cards, now: "2026-11-10T16:00:00Z", calendar: { zone: null, pauseDuringHolidays: false }, reviewsDoneToday: 12, newWordsIntroducedToday: 0, recentSuccessRate: 0.9, activeDays: 30 });
    expect(plan.reviews).toHaveLength(3);
  });
});
