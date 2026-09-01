import { describe, expect, it } from "vitest";
import {
  eloExpected,
  eloK,
  eloUpdate,
  itemRatingFromDifficulty,
  orderByTargetSuccess,
  TARGET_SUCCESS,
} from "./elo";

describe("eloExpected", () => {
  it("is 50% for equal ratings and monotone in the gap", () => {
    expect(eloExpected(0, 0)).toBeCloseTo(0.5, 5);
    expect(eloExpected(1, 0)).toBeGreaterThan(0.5);
    expect(eloExpected(-1, 0)).toBeLessThan(0.5);
    expect(eloExpected(2, 0)).toBeGreaterThan(eloExpected(1, 0));
  });
});

describe("eloK", () => {
  it("decays with attempts", () => {
    expect(eloK(0)).toBeGreaterThan(eloK(10));
    expect(eloK(10)).toBeGreaterThan(eloK(100));
    expect(eloK(100)).toBeGreaterThan(0);
  });
});

describe("eloUpdate", () => {
  it("rises on success, falls on failure", () => {
    expect(eloUpdate(0, 0, true, 0)).toBeGreaterThan(0);
    expect(eloUpdate(0, 0, false, 0)).toBeLessThan(0);
  });
  it("an expected win moves the rating less than an upset", () => {
    const expectedWin = eloUpdate(2, -2, true, 0) - 2;
    const upsetWin = eloUpdate(-2, 2, true, 0) - -2;
    expect(upsetWin).toBeGreaterThan(expectedWin);
  });
  it("veteran ratings move slowly", () => {
    const rookie = Math.abs(eloUpdate(0, 0, true, 0));
    const veteran = Math.abs(eloUpdate(0, 0, true, 200));
    expect(veteran).toBeLessThan(rookie);
  });
});

describe("itemRatingFromDifficulty", () => {
  it("maps 50 to 0 and scales linearly around it", () => {
    expect(itemRatingFromDifficulty(50)).toBe(0);
    expect(itemRatingFromDifficulty(80)).toBeCloseTo(2, 5);
    expect(itemRatingFromDifficulty(20)).toBeCloseTo(-2, 5);
    expect(itemRatingFromDifficulty(null)).toBe(0);
  });
});

describe("orderByTargetSuccess", () => {
  const items = [
    { id: "hard", rating: 2 },
    { id: "easy", rating: -2 },
    { id: "just_right", rating: -1.5 },
  ];

  it("puts the ~82%-success item first for an average learner", () => {
    // θ=0: expected success — hard ≈ 12%, easy ≈ 88%, just_right ≈ 82%
    const ordered = orderByTargetSuccess(items, (i) => i.rating, 0);
    expect(ordered[0].id).toBe("just_right");
    expect(ordered[ordered.length - 1].id).toBe("hard");
  });

  it("adapts to a stronger learner", () => {
    // θ=3.5: the hard item now sits near the target zone
    const ordered = orderByTargetSuccess(items, (i) => i.rating, 3.5);
    expect(ordered[0].id).toBe("hard");
  });

  it("keeps incoming order as tiebreak", () => {
    const tied = [{ id: "a", rating: 1 }, { id: "b", rating: 1 }];
    const ordered = orderByTargetSuccess(tied, (i) => i.rating, 0, TARGET_SUCCESS);
    expect(ordered.map((i) => i.id)).toEqual(["a", "b"]);
  });
});
