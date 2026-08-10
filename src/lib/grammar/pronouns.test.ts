import { describe, expect, it } from "vitest";
import {
  indirectPersonPronoun,
  PRONOUN_LESSON_MODULES,
  PRONOUN_MODULE_KEYS,
  pronounLesson,
  pronounModuleForCompletedSessions,
  selectPronounPracticeItems,
} from "./pronouns";

describe("object-pronoun practice progression", () => {
  it("teaches six small concepts in a repeating sequence", () => {
    expect(PRONOUN_MODULE_KEYS).toHaveLength(6);
    expect(pronounModuleForCompletedSessions(0)).toBe("direct_objects");
    expect(pronounModuleForCompletedSessions(1)).toBe("indirect_people");
    expect(pronounModuleForCompletedSessions(6)).toBe("direct_objects");
  });

  it("states the lui/leur rule without inventing gender agreement", () => {
    expect(indirectPersonPronoun("singular", "masculine")).toBe("lui");
    expect(indirectPersonPronoun("singular", "feminine")).toBe("lui");
    expect(indirectPersonPronoun("plural", "masculine")).toBe("leur");
    expect(indirectPersonPronoun("plural", "feminine")).toBe("leur");
  });

  it("keeps every explanation brief, example-led and exception-aware", () => {
    for (const lesson of PRONOUN_LESSON_MODULES) {
      expect(lesson.explanation.split(/\s+/).length).toBeLessThanOrEqual(45);
      expect(lesson.examples).toHaveLength(2);
      expect(lesson.exceptions.length).toBeGreaterThanOrEqual(2);
    }
    expect(pronounLesson(1, "Pronoms").explanation).toContain("genre ne change rien");
  });

  it("uses four new exercises and two retrieval exercises after the first concept", () => {
    const items = PRONOUN_MODULE_KEYS.flatMap((practiceModule, moduleIndex) =>
      Array.from({ length: 6 }, (_, index) => ({
        id: `${practiceModule}-${index}`,
        difficultyRating: (index - 3) / 2,
        validatorConfig: { practiceModule },
        moduleIndex,
      })),
    );
    const first = selectPronounPracticeItems(items, 0, 0);
    expect(first).toHaveLength(6);
    expect(new Set(first.map((item) => item.validatorConfig.practiceModule))).toEqual(new Set(["direct_objects"]));

    const third = selectPronounPracticeItems(items, 2, 0);
    expect(third).toHaveLength(6);
    expect(third.filter((item) => item.validatorConfig.practiceModule === "direct_or_indirect")).toHaveLength(4);
    expect(third.filter((item) => item.validatorConfig.practiceModule !== "direct_or_indirect")).toHaveLength(2);
  });
});
