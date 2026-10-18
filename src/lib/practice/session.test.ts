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

  it("never repeats a reviewed item to inflate the exercise count", () => {
    expect(plannedExerciseCount(3)).toBe(3);
    expect(plannedExerciseCount(2)).toBe(2);
    expect(expandReviewedPractice(["a", "b", "c"], 6)).toEqual(["a", "b", "c"]);
    expect(plannedExerciseCount(1)).toBe(1);
  });

  it("interleaves response types when the reviewed bank permits it", () => {
    const items = [
      { difficultyRating: -1.5, responseType: "multiple_choice", id: "mc-1" },
      { difficultyRating: -1.4, responseType: "multiple_choice", id: "mc-2" },
      { difficultyRating: -1.3, responseType: "free_text", id: "text-1" },
      { difficultyRating: -1.2, responseType: "free_text", id: "text-2" },
    ];
    const selected = selectOptimalPracticeItems(items, 0, 4);
    expect(selected.map((item) => item.responseType)).toEqual([
      "multiple_choice", "free_text", "multiple_choice", "free_text",
    ]);
  });

  it("awards seven XP plus a perfect bonus exactly once per completion result", () => {
    expect(xpForPractice({ completed: false, perfect: true })).toEqual({ base: 0, bonus: 0, total: 0 });
    expect(xpForPractice({ completed: true, perfect: false }).total).toBe(7);
    expect(xpForPractice({ completed: true, perfect: true }).total).toBe(10);
  });
});

it("uses interests among similarly suitable exercises and never crosses a difficulty band for a theme", () => {
  const items = [
    { id: "neutral", difficultyRating: -1.5, interestKeys: [] },
    { id: "football", difficultyRating: -1.5, interestKeys: ["football"] },
    { id: "too-hard", difficultyRating: 3, interestKeys: ["football"], responseType: "other" },
  ];
  expect(selectOptimalPracticeItems(items, 0, 3, ["football"]).map((item) => item.id)).toEqual(["football", "neutral", "too-hard"]);
  expect(selectOptimalPracticeItems(items, 0, 1, []).map((item) => item.id)).toEqual(["neutral"]);
});

describe("interest weight in the practice picker (E.4)", () => {
  it("prefers a themed item a little further from the target over a neutral one", () => {
    // Both in the 75–85% zone: neutral sits on 82%, themed is ~4 points away.
    const neutral = { id: "neutral", difficultyRating: -Math.log(0.82 / 0.18), interestKeys: [] as string[] };
    const themed = { id: "themed", difficultyRating: -Math.log(0.78 / 0.22), interestKeys: ["manga"] };
    expect(selectOptimalPracticeItems([neutral, themed], 0, 1, ["manga"]).map((item) => item.id)).toEqual(["themed"]);
    expect(selectOptimalPracticeItems([neutral, themed], 0, 1, []).map((item) => item.id)).toEqual(["neutral"]);
  });

  it("gives the closest interest group a smaller but real weight", () => {
    const neutral = { id: "neutral", difficultyRating: -Math.log(0.82 / 0.18), interestKeys: [] as string[] };
    const sameGroup = { id: "anime", difficultyRating: -Math.log(0.8 / 0.2), interestKeys: ["anime"] };
    const farGroup = { id: "anime-far", difficultyRating: -Math.log(0.76 / 0.24), interestKeys: ["anime"] };
    expect(selectOptimalPracticeItems([neutral, sameGroup], 0, 1, ["manga"])[0].id).toBe("anime");
    expect(selectOptimalPracticeItems([neutral, farGroup], 0, 1, ["manga"])[0].id).toBe("neutral");
  });

  it("never lifts an out-of-zone themed item above an in-zone one", () => {
    const inZone = { id: "in-zone", difficultyRating: -Math.log(0.84 / 0.16), interestKeys: [] as string[] };
    const tooHard = { id: "too-hard", difficultyRating: -Math.log(0.74 / 0.26), interestKeys: ["manga"] };
    const tooEasy = { id: "too-easy", difficultyRating: -Math.log(0.86 / 0.14), interestKeys: ["manga"] };
    for (const item of [tooHard, tooEasy]) {
      expect(predictedSuccess(0, item.difficultyRating) < OPTIMAL_SUCCESS_ZONE.min || predictedSuccess(0, item.difficultyRating) > OPTIMAL_SUCCESS_ZONE.max).toBe(true);
    }
    expect(selectOptimalPracticeItems([tooHard, tooEasy, inZone], 0, 3, ["manga"])[0].id).toBe("in-zone");
  });

  it("opens the session on a themed in-zone item when one is selected", () => {
    const neutral = { id: "neutral", difficultyRating: -Math.log(0.82 / 0.18), interestKeys: [] as string[] };
    // Same-group item ranks second on fit, but the session still opens on it.
    const themed = { id: "themed", difficultyRating: -Math.log(0.755 / 0.245), interestKeys: ["anime"] };
    expect(selectOptimalPracticeItems([neutral, themed], 0, 2, []).map((item) => item.id)).toEqual(["neutral", "themed"]);
    expect(selectOptimalPracticeItems([neutral, themed], 0, 2, ["manga"]).map((item) => item.id)).toEqual(["themed", "neutral"]);
  });
});
