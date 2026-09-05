import { describe, expect, it } from "vitest";
import { calculateStreak, freezeCandidate, unrewardedMilestone, weekStrip } from "./motivation";

const now = Date.parse("2026-07-10T12:00:00Z");

describe("calculateStreak", () => {
  it("counts each qualifying calendar day once", () => {
    expect(calculateStreak(["2026-07-10", "2026-07-10", "2026-07-09", "2026-07-08"], now)).toBe(3);
  });
  it("allows today to be pending when yesterday qualified", () => {
    expect(calculateStreak(["2026-07-09", "2026-07-08"], now)).toBe(2);
  });
  it("treats a frozen day as streak-preserving but not as goal completion", () => {
    const days = [
      { date: "2026-07-10", goalCompleted: true },
      { date: "2026-07-09", goalCompleted: false, freezeUsed: true },
      { date: "2026-07-08", goalCompleted: true },
    ];
    expect(calculateStreak(days, now)).toBe(3);
    expect(calculateStreak(days.filter((day) => day.goalCompleted), now)).toBe(1);
  });
});

describe("freezeCandidate", () => {
  it("covers yesterday only when it is a gap after a completed day", () => {
    const days = [{ date: "2026-07-08", goalCompleted: true }];
    expect(freezeCandidate(days, now, 1)).toBe("2026-07-09");
  });
  it("never pads an inactive account or a completed day", () => {
    expect(freezeCandidate([], now, 2)).toBeNull();
    expect(freezeCandidate([{ date: "2026-07-09", goalCompleted: true }, { date: "2026-07-08", goalCompleted: true }], now, 2)).toBeNull();
    expect(freezeCandidate([{ date: "2026-07-08", goalCompleted: true }], now, 0)).toBeNull();
  });
});

describe("unrewardedMilestone", () => {
  it("rewards each seven-day milestone once", () => {
    expect(unrewardedMilestone(6, 0)).toBeNull();
    expect(unrewardedMilestone(7, 0)).toBe(7);
    expect(unrewardedMilestone(9, 7)).toBeNull();
    expect(unrewardedMilestone(14, 7)).toBe(14);
  });
});

describe("weekStrip", () => {
  it("returns seven days ending today with XP and flags", () => {
    const strip = weekStrip([{ date: "2026-07-09", goalCompleted: true }], now, { "2026-07-09": 12 });
    expect(strip).toHaveLength(7);
    expect(strip[0].date).toBe("2026-07-04");
    expect(strip[6]).toMatchObject({ date: "2026-07-10", isToday: true, xp: 0 });
    expect(strip[5]).toMatchObject({ date: "2026-07-09", goalCompleted: true, xp: 12 });
  });
});
