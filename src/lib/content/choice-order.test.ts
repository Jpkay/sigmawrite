import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChoiceList } from "@/components/choice-list";
import { ExerciseSurface } from "@/components/exercise-surface";
import { gradePracticeResponse } from "@/lib/practice/grade-response";
import { readingChoiceSeed, shuffleChoices } from "./choice-order";

describe("answer-independent choice presentation", () => {
  it.each([2, 3, 4])("distributes a stored-first answer across all %i positions", (size) => {
    const choices = Array.from({ length: size }, (_, index) => ({ id: String(index), correct: index === 0 }));
    const counts = Array(size).fill(0);
    for (let index = 0; index < 2400; index++) {
      const order = shuffleChoices(choices, `exercise:00000000-0000-4000-8000-${String(index).padStart(12, "0")}`);
      counts[order.findIndex((choice) => choice.correct)]++;
      expect(new Set(order.map((choice) => choice.id)).size).toBe(size);
    }
    for (const count of counts) {
      expect(count).toBeGreaterThan(2400 / size * 0.85);
      expect(count).toBeLessThan(2400 / size * 1.15);
    }
  });

  it("is stable and preserves inputs without consulting the answer key", () => {
    const choices = Object.freeze([{ id: "a", correct: true }, { id: "b", correct: false }, { id: "c", correct: false }]);
    const order = shuffleChoices(choices, "exercise:stable");
    expect(shuffleChoices(choices, "exercise:stable")).toEqual(order);
    expect(shuffleChoices(choices.map((choice) => ({ ...choice, correct: !choice.correct })), "exercise:stable").map((choice) => choice.id)).toEqual(order.map((choice) => choice.id));
    expect(choices.map((choice) => choice.id)).toEqual(["a", "b", "c"]);
    expect(shuffleChoices([], "empty")).toEqual([]);
    expect(shuffleChoices(["only"], "single")).toEqual(["only"]);
  });

  it("grades shuffled choices by their original IDs with matching feedback", async () => {
    const choices = [{ id: "correct", is_correct: true, feedback_fr: "Exact." }, { id: "wrong", is_correct: false, feedback_fr: "Réessaie." }];
    for (const selected of shuffleChoices(choices, "exercise:grading")) {
      const result = await gradePracticeResponse({ response_type: "mcq", validator_type: "exact", validator_config: {}, correct_answer: null, acceptable_answers: [] }, choices, { selectedChoiceId: selected.id });
      expect(result).toEqual({ correct: selected.is_correct, feedbackFr: selected.feedback_fr });
    }
  });

  it("renders reading and review options in the same order while retaining grading indices", () => {
    const prompt = "Choisis une réponse.";
    const choices = ["Première", "Deuxième", "Troisième"];
    const expected = shuffleChoices(choices.map((text, index) => ({ text, index })), readingChoiceSeed(prompt, choices));
    const reading = renderToStaticMarkup(createElement(ChoiceList, { prompt, choices, value: 0, correctIndex: 0, reveal: true }));
    expect([...reading.matchAll(/value="(\d+)"/g)].map((match) => Number(match[1]))).toEqual(expected.map((choice) => choice.index));
    expect(reading).toMatch(/checked="" value="0"/);
    const review = renderToStaticMarkup(createElement(ExerciseSurface, {
      item: { id: "preview", promptFr: prompt, choiceOrderSeed: readingChoiceSeed(prompt, choices), responseType: "mcq", choices: choices.map((text, index) => ({ id: String(index), text })) },
      choice: "0", answer: "", order: [], rule: "", setChoice() {}, setAnswer() {}, setOrder() {}, setRule() {},
    }));
    const orderedTexts = (html: string) => [...choices].sort((a, b) => html.indexOf(a) - html.indexOf(b));
    expect(orderedTexts(reading)).toEqual(expected.map((choice) => choice.text));
    expect(orderedTexts(review)).toEqual(orderedTexts(reading));
  });
});
