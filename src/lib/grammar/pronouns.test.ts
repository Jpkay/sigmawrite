import { describe, expect, it } from "vitest";
import {
  indirectPersonPronoun,
  PRONOUN_LESSON_MODULES,
  PRONOUN_MODULE_KEYS,
  pronounLessonForNode,
} from "./pronouns";

describe("object-pronoun practice progression", () => {
  it("keeps the six authored lesson families without session-count advancement", () => {
    expect(PRONOUN_MODULE_KEYS).toHaveLength(6);
    expect(pronounLessonForNode("produire_pronom_cod", "COD")?.family).toBe("Pronoms COD");
    expect(pronounLessonForNode("produire_pronom_coi_personne", "COI")?.family).toBe("Lui ou leur");
    expect(pronounLessonForNode("ordonner_doubles_pronoms", "Deux pronoms")?.family).toBe("Deux pronoms");
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
    expect(pronounLessonForNode("produire_pronom_coi_personne", "Pronoms")?.explanation).toContain("genre ne change rien");
  });
});
