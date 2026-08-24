import { describe, expect, it } from "vitest";
import { formatFrameworkRange, formatNativeGradeRange, stripAuthoringVariantPrefix } from "./exercise-presentation";

describe("exercise presentation", () => {
  it("removes internal authoring variant labels from learner-facing prompts", () => {
    expect(stripAuthoringVariantPrefix("Cas 2 — Dans quelle phrase « dont » introduit-il une relative ?"))
      .toBe("Dans quelle phrase « dont » introduit-il une relative ?");
    expect(stripAuthoringVariantPrefix("Une consigne sans marqueur")).toBe("Une consigne sans marqueur");
  });

  it("formats native-grade and CEFR references independently", () => {
    expect(formatNativeGradeRange("6", "6")).toBe("6e");
    expect(formatNativeGradeRange("3", "2")).toBe("3e–2de");
    expect(formatFrameworkRange("A2", "B1")).toBe("A2–B1");
  });
});
