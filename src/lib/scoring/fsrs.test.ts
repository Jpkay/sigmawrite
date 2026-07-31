import { describe, expect, it } from "vitest";
import {
  DESIRED_RETENTION,
  initialState,
  intervalForRetention,
  retrievability,
  review,
  scheduleFsrs,
} from "./fsrs";

describe("retrievability", () => {
  it("is 100% at t=0 and 90% at t=S (the definition of stability)", () => {
    const state = { stability: 10, difficulty: 5 };
    expect(retrievability(state, 0)).toBeCloseTo(1, 5);
    expect(retrievability(state, 10)).toBeCloseTo(0.9, 5);
  });
  it("decays monotonically", () => {
    const state = { stability: 5, difficulty: 5 };
    expect(retrievability(state, 1)).toBeGreaterThan(retrievability(state, 10));
    expect(retrievability(state, 10)).toBeGreaterThan(retrievability(state, 100));
  });
  it("never goes negative even far past due", () => {
    expect(retrievability({ stability: 1, difficulty: 5 }, 1000)).toBeGreaterThan(0);
  });
});

describe("intervalForRetention", () => {
  it("equals stability at the 0.9 default (R(S,S)=0.9)", () => {
    expect(intervalForRetention(12, DESIRED_RETENTION)).toBeCloseTo(12, 5);
  });
  it("is shorter for higher retention, longer for lower", () => {
    expect(intervalForRetention(10, 0.95)).toBeLessThan(10);
    expect(intervalForRetention(10, 0.8)).toBeGreaterThan(10);
  });
});

describe("initialState", () => {
  it("stability grows with first-grade quality", () => {
    const s = [1, 2, 3, 4].map((g) => initialState(g as 1 | 2 | 3 | 4).stability);
    expect(s[0]).toBeLessThan(s[1]);
    expect(s[1]).toBeLessThan(s[2]);
    expect(s[2]).toBeLessThan(s[3]);
  });
  it("difficulty is higher for worse first grades, clamped to [1,10]", () => {
    expect(initialState(1).difficulty).toBeGreaterThan(initialState(4).difficulty);
    expect(initialState(1).difficulty).toBeLessThanOrEqual(10);
    expect(initialState(4).difficulty).toBeGreaterThanOrEqual(1);
  });
});

describe("review", () => {
  const state = { stability: 5, difficulty: 5 };

  it("success grows stability; easy grows more than hard", () => {
    const hard = review(state, 5, 2);
    const good = review(state, 5, 3);
    const easy = review(state, 5, 4);
    expect(hard.stability).toBeGreaterThan(state.stability);
    expect(good.stability).toBeGreaterThan(hard.stability);
    expect(easy.stability).toBeGreaterThan(good.stability);
  });

  it("a lapse shrinks stability and never exceeds pre-lapse stability", () => {
    const lapsed = review({ stability: 50, difficulty: 5 }, 50, 1);
    expect(lapsed.stability).toBeLessThan(50);
  });

  it("later (lower-R) successful reviews earn more stability (spacing effect)", () => {
    const early = review(state, 1, 3);
    const onTime = review(state, 5, 3);
    const late = review(state, 15, 3);
    expect(onTime.stability).toBeGreaterThan(early.stability);
    expect(late.stability).toBeGreaterThan(onTime.stability);
  });

  it("harder items grow stability slower", () => {
    const easyItem = review({ stability: 5, difficulty: 2 }, 5, 3);
    const hardItem = review({ stability: 5, difficulty: 9 }, 5, 3);
    expect(easyItem.stability).toBeGreaterThan(hardItem.stability);
  });

  it("failure raises difficulty, easy lowers it, both clamped", () => {
    expect(review(state, 5, 1).difficulty).toBeGreaterThan(state.difficulty);
    expect(review(state, 5, 4).difficulty).toBeLessThan(state.difficulty);
    expect(review({ stability: 5, difficulty: 10 }, 5, 1).difficulty).toBeLessThanOrEqual(10);
    expect(review({ stability: 5, difficulty: 1 }, 5, 4).difficulty).toBeGreaterThanOrEqual(1);
  });
});

describe("scheduleFsrs", () => {
  it("initializes state on first review (prev=null)", () => {
    const first = scheduleFsrs(null, "good", 0);
    expect(first.stability).toBeGreaterThan(0);
    expect(first.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it("interval ≈ stability at default retention, integer-clamped [1,365]", () => {
    const s = scheduleFsrs({ stability: 20, difficulty: 4 }, "good", 20);
    expect(s.intervalDays).toBe(Math.round(s.stability));
    const tiny = scheduleFsrs(null, "forgot", 0);
    expect(tiny.intervalDays).toBeGreaterThanOrEqual(1);
    const huge = scheduleFsrs({ stability: 4000, difficulty: 1 }, "easy", 4000);
    expect(huge.intervalDays).toBeLessThanOrEqual(365);
  });

  it("forgot resets to a short interval; successive good reviews expand", () => {
    let state = scheduleFsrs(null, "good", 0);
    const i1 = state.intervalDays;
    state = { ...scheduleFsrs(state, "good", state.intervalDays) };
    const i2 = state.intervalDays;
    state = { ...scheduleFsrs(state, "good", state.intervalDays) };
    const i3 = state.intervalDays;
    expect(i2).toBeGreaterThan(i1);
    expect(i3).toBeGreaterThan(i2);

    const lapsed = scheduleFsrs(state, "forgot", state.intervalDays);
    expect(lapsed.intervalDays).toBeLessThan(i3);
  });
});
