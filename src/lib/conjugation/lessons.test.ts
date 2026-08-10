import { describe, expect, it } from "vitest";
import { CONJUGATION_FOUNDATION_NODES } from "@/lib/taxonomy/slices/conjugation-foundation";
import { CONJUGATION_LESSON_FAMILIES, conjugationLesson } from "./lessons";

describe("brief conjugation lessons", () => {
  it("covers every conjugation node with a short, exercise-first lesson", () => {
    for (const node of CONJUGATION_FOUNDATION_NODES) {
      const lesson = conjugationLesson(node.key, node.labelFr);
      const words = [lesson.explanation, lesson.pattern, ...lesson.examples, ...lesson.exceptions].join(" ").split(/\s+/).length;
      expect(words, node.key).toBeLessThanOrEqual(115);
      expect(lesson.examples.length, node.key).toBeGreaterThanOrEqual(2);
      expect(lesson.exceptions.length, node.key).toBeGreaterThanOrEqual(1);
    }
  });

  it("contains explicit exception guidance for every tense family", () => {
    expect(CONJUGATION_LESSON_FAMILIES).toEqual(expect.arrayContaining([
      "present", "composed_past", "imperfect", "future", "pluperfect",
      "conditional", "subjunctive", "imperative",
    ]));
  });

  it("teaches passé composé/imparfait by discourse role rather than duration", () => {
    const lesson = conjugationLesson("contraster_pc_imparfait", "Contraster les temps");
    expect(lesson.explanation).toMatch(/rôle.*pas.*durée/i);
    expect(lesson.exceptions.join(" ")).toMatch(/longue.*passé composé/i);
  });
});
