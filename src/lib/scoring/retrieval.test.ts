import { describe, it, expect } from "vitest";
import {
  scheduleNext,
  gradeRetrieval,
  dueAtFrom,
  INITIAL_SCHEDULE,
  INTERVAL_LADDER,
} from "./retrieval";

describe("scheduleNext (PRD §L spaced retrieval)", () => {
  it("advances the interval and repetitions on a good recall", () => {
    const next = scheduleNext(INITIAL_SCHEDULE, "good");
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBeGreaterThan(INITIAL_SCHEDULE.intervalDays);
  });

  it("resets to 1 day and lowers ease when forgotten", () => {
    const mature = { intervalDays: 21, ease: 2.5, repetitions: 4 };
    const next = scheduleNext(mature, "forgot");
    expect(next.intervalDays).toBe(1);
    expect(next.repetitions).toBe(0);
    expect(next.ease).toBeLessThan(mature.ease);
  });

  it("raises ease on easy and lowers it on hard", () => {
    expect(scheduleNext(INITIAL_SCHEDULE, "easy").ease).toBeGreaterThan(
      INITIAL_SCHEDULE.ease
    );
    expect(scheduleNext(INITIAL_SCHEDULE, "hard").ease).toBeLessThan(
      INITIAL_SCHEDULE.ease
    );
  });

  it("climbs the ladder over successive good recalls", () => {
    let s = INITIAL_SCHEDULE;
    const intervals: number[] = [];
    for (let i = 0; i < 4; i++) {
      s = scheduleNext(s, "good");
      intervals.push(s.intervalDays);
    }
    // Non-decreasing and bounded by the top of the ladder scaled by ease.
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
    }
    expect(Math.max(...intervals)).toBeLessThanOrEqual(
      INTERVAL_LADDER[INTERVAL_LADDER.length - 1] * 2
    );
  });

  it("clamps ease to a sane floor", () => {
    let s = { intervalDays: 1, ease: 1.4, repetitions: 0 };
    for (let i = 0; i < 5; i++) s = scheduleNext(s, "forgot");
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });
});

describe("gradeRetrieval", () => {
  it("marks blank/very short answers as forgot", () => {
    expect(gradeRetrieval("", ["migration"])).toBe("forgot");
    expect(gradeRetrieval("euh non", ["migration"])).toBe("forgot");
  });
  it("rewards keyword coverage", () => {
    expect(
      gradeRetrieval(
        "La migration est le déplacement de personnes vers un autre pays.",
        ["migration"]
      )
    ).not.toBe("forgot");
  });
});

describe("dueAtFrom", () => {
  it("offsets by whole days from an epoch", () => {
    const base = Date.parse("2026-01-01T00:00:00.000Z");
    expect(dueAtFrom(base, 3)).toBe("2026-01-04T00:00:00.000Z");
  });
});
