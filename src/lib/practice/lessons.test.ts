import { describe, expect, it } from "vitest";
import { lessonForPracticeNode } from "./lessons";

describe("practice micro-lessons", () => {
  it("provides a short lesson for every practicable strand", () => {
    for (const strand of ["comprehension_ecrite", "grammaire_syntaxe", "orthographe_lexicale", "orthographe_grammaticale"]) {
      const lesson = lessonForPracticeNode({ key: `node_${strand}`, label: "Compétence test", description: "Une explication brève et précise de la compétence travaillée.", strand });
      expect(lesson.explanation).toBeTruthy();
      expect(lesson.pattern).toBeTruthy();
      expect(lesson.examples.length).toBeGreaterThanOrEqual(2);
    }
  });
});
