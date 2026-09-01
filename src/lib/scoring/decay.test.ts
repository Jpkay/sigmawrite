import { describe, expect, it } from "vitest";
import { effectiveMastery } from "./decay";

const DAY = 86_400_000;
const now = Date.parse("2026-07-31T00:00:00Z");
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString();

describe("effectiveMastery", () => {
  it("returns mastery unchanged without memory state", () => {
    expect(effectiveMastery({ mastery: 0.9 }, now)).toBe(0.9);
    expect(
      effectiveMastery({ mastery: 0.9, memoryStability: null, lastEvidenceAt: daysAgo(30) }, now)
    ).toBe(0.9);
    expect(effectiveMastery({ mastery: 0.9, memoryStability: 10 }, now)).toBe(0.9);
  });

  it("no decay at the moment of evidence", () => {
    expect(
      effectiveMastery({ mastery: 0.9, memoryStability: 10, lastEvidenceAt: daysAgo(0) }, now)
    ).toBeCloseTo(0.9, 5);
  });

  it("decays to 90% of mastery after `stability` days", () => {
    expect(
      effectiveMastery({ mastery: 0.9, memoryStability: 10, lastEvidenceAt: daysAgo(10) }, now)
    ).toBeCloseTo(0.81, 5);
  });

  it("a mastered node drifts below the 0.85 threshold when overdue", () => {
    const fresh = effectiveMastery(
      { mastery: 0.9, memoryStability: 20, lastEvidenceAt: daysAgo(1) }, now);
    const stale = effectiveMastery(
      { mastery: 0.9, memoryStability: 20, lastEvidenceAt: daysAgo(120) }, now);
    expect(fresh).toBeGreaterThan(0.85);
    expect(stale).toBeLessThan(0.85);
  });

  it("higher stability decays slower", () => {
    const lo = effectiveMastery({ mastery: 0.9, memoryStability: 5, lastEvidenceAt: daysAgo(30) }, now);
    const hi = effectiveMastery({ mastery: 0.9, memoryStability: 60, lastEvidenceAt: daysAgo(30) }, now);
    expect(hi).toBeGreaterThan(lo);
  });

  it("clock skew (evidence in the future) does not inflate mastery", () => {
    expect(
      effectiveMastery({ mastery: 0.8, memoryStability: 10, lastEvidenceAt: daysAgo(-3) }, now)
    ).toBeCloseTo(0.8, 5);
  });
});
