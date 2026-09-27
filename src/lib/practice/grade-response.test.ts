import { describe, expect, it } from "vitest";
import { gradePracticeResponse, type GradingItem } from "./grade-response";

const item: GradingItem = { response_type: "mcq", validator_type: "exact", validator_config: {}, correct_answer: "été", acceptable_answers: [] };
const choices = [{ id: "a", is_correct: true, feedback_fr: "Exact." }, { id: "b", is_correct: false, feedback_fr: "Observe le sujet." }];
describe("shared learner and review grading", () => {
  it("returns the selected choice feedback and rejects unrelated choice IDs", async () => {
    expect(await gradePracticeResponse(item, choices, { selectedChoiceId: "b" })).toEqual({ correct: false, feedbackFr: "Observe le sujet." });
    expect(await gradePracticeResponse(item, choices, { selectedChoiceId: "a" })).toEqual({ correct: true, feedbackFr: "Exact." });
    await expect(gradePracticeResponse(item, choices, { selectedChoiceId: "foreign" })).rejects.toThrow("Choix invalide");
  });
  it("requires the right form and justification", async () => {
    const justified = { ...item, response_type: "justified", validator_config: { ruleKey: "plural", rules: [{ key: "plural", label: "Accord au pluriel" }] } };
    expect((await gradePracticeResponse(justified, choices, { selectedChoiceId: "a", answerText: "singular" })).correct).toBe(false);
    expect((await gradePracticeResponse(justified, choices, { selectedChoiceId: "a", answerText: "plural" })).correct).toBe(true);
  });
  it("distinguishes repeated words in error hunts", async () => {
    const hunt = { ...item, response_type: "error_hunt", correct_answer: "son", acceptable_answers: ["2:son"] };
    expect((await gradePracticeResponse(hunt, [], { answerText: "0:son" })).correct).toBe(false);
    expect((await gradePracticeResponse(hunt, [], { answerText: "2:son" })).correct).toBe(true);
  });
  it("preserves accents and accepts configured alternatives", async () => {
    const open = { ...item, response_type: "free_text", acceptable_answers: ["l’été"] };
    expect((await gradePracticeResponse(open, [], { answerText: "ete" })).correct).toBe(false);
    expect((await gradePracticeResponse(open, [], { answerText: "  ÉTÉ  " })).correct).toBe(true);
    expect((await gradePracticeResponse(open, [], { answerText: "l’été" })).correct).toBe(true);
    expect((await gradePracticeResponse(open, [], { answerText: "l'été" })).correct).toBe(true);
  });
  it.each(["'", "’"])("accepts the corrected agreement with a %s apostrophe", async (apostrophe) => {
    const correction: GradingItem = {
      ...item,
      response_type: "short_answer",
      prompt_fr: "Corrige : « Les chansons qu’il a composé sont connues. »",
      correct_answer: "Les chansons qu’il a composées sont connues.",
    };
    expect(await gradePracticeResponse(correction, [], {
      answerText: `Les chansons qu${apostrophe}il a composées sont connues.`,
    })).toEqual({ correct: true, feedbackFr: null });
    for (const answerText of [
      `Les chansons qu${apostrophe}il a composé sont connues.`,
      `Les chansons qu${apostrophe}il a composees sont connues.`,
      "Les chansons quil a composées sont connues.",
    ]) {
      expect((await gradePracticeResponse(correction, [], { answerText })).correct).toBe(false);
    }
  });
  it("grades ordering and listed combined sentences without recording attempts", async () => {
    expect((await gradePracticeResponse({ ...item, response_type: "ordering", correct_answer: "Les enfants jouent." }, [], { answerText: "Les enfants jouent." })).correct).toBe(true);
    expect((await gradePracticeResponse({ ...item, response_type: "combine", correct_answer: "Le chat noir dort." }, [], { answerText: "Le chat noir dort." })).correct).toBe(true);
  });
});
