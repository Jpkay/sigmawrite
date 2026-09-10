import { describe, expect, it } from "vitest";
import { onboardingSchema, onboardingTarget } from "./onboarding";

const input = {
  grade: 8,
  frenchBackground: "french_second_language",
  interests: ["music", "history", "technology"],
  exposures: ["home", "school"],
};

describe("simplified onboarding", () => {
  it.each(["french_first_language", "heritage", "immersion", "allophone", "french_second_language", "bilingual"])(
    "accepts %s without a home language, objective, or CEFR target",
    (studentType) => {
      const data = onboardingSchema.parse({ ...input, studentType });
      expect(data.exposures).toEqual(["home", "school"]);
      expect(onboardingTarget(data)).toEqual({ framework: "native_grade", level: "8", grade: 8 });
      expect(data.homeLanguage).toBeUndefined();
    },
  );

  it("preserves an explicit CEFR target from older clients", () => {
    const data = onboardingSchema.parse({ ...input, studentType: "immersion", targetLevel: "B2", goalType: "prepare_delf" });
    expect(onboardingTarget(data)).toEqual({ framework: "cefr", level: "B2", grade: null });
  });

  it("accepts a selection made entirely of newly added interests", () => {
    const data = onboardingSchema.parse({ ...input, interests: ["manga", "anime", "drawing"] });
    expect(data.interests).toEqual(["manga", "anime", "drawing"]);
  });

  it("still requires three known interests", () => {
    expect(onboardingSchema.safeParse({ ...input, interests: ["music"] }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...input, interests: ["music", "history", "unknown-interest"] }).success).toBe(false);
  });
});
