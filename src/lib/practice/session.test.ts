import { describe, expect, it } from "vitest";
import {
  OPTIMAL_SUCCESS_ZONE,
  PRACTICE_BASE_XP,
  PRACTICE_EXERCISE_TARGET,
  PRACTICE_PERFECT_BONUS_XP,
  PRACTICE_SESSION_SECONDS,
  predictedSuccess,
  expandReviewedPractice,
  plannedExerciseCount,
  remainingSessionSeconds,
  selectOptimalPracticeItems,
  xpForPractice,
} from "./session";

describe("seven-minute practice session", () => {
  it("fixes the promised time, exercise and XP budget", () => {
    expect(PRACTICE_SESSION_SECONDS).toBe(420);
    expect(PRACTICE_EXERCISE_TARGET).toBe(6);
    expect(PRACTICE_BASE_XP).toBe(7);
    expect(PRACTICE_PERFECT_BONUS_XP).toBe(3);
  });

  it("prioritises exercises in the 75–85% optimal-success zone", () => {
    const items = [-4, -2, -1.5, -1.2, 0, 2].map((difficultyRating) => ({ difficultyRating }));
    const selected = selectOptimalPracticeItems(items, 0, 3);
    const probabilities = selected.map((item) => predictedSuccess(0, item.difficultyRating));
    expect(probabilities[0]).toBeGreaterThanOrEqual(OPTIMAL_SUCCESS_ZONE.min);
    expect(probabilities[0]).toBeLessThanOrEqual(OPTIMAL_SUCCESS_ZONE.max);
  });

  it("uses out-of-zone reviewed items only as fallbacks", () => {
    const items = [{ difficultyRating: 4 }, { difficultyRating: -1.5 }];
    expect(selectOptimalPracticeItems(items, 0, 2)).toEqual([items[1], items[0]]);
  });

  it("never lets the client timer become negative", () => {
    expect(remainingSessionSeconds(1_000, 421_000)).toBe(0);
  });

  it("turns a small reviewed bank into six practice opportunities", () => {
    expect(plannedExerciseCount(3)).toBe(6);
    expect(plannedExerciseCount(2)).toBe(2);
    expect(expandReviewedPractice(["a", "b", "c"], 6)).toEqual(["a", "b", "c", "a", "b", "c"]);
    expect(plannedExerciseCount(1)).toBe(1);
  });

  it("awards seven XP plus a perfect bonus exactly once per completion result", () => {
    expect(xpForPractice({ completed: false, perfect: true })).toEqual({ base: 0, bonus: 0, total: 0 });
    expect(xpForPractice({ completed: true, perfect: false }).total).toBe(7);
    expect(xpForPractice({ completed: true, perfect: true }).total).toBe(10);
  });
});
