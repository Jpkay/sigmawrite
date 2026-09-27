import { expect, it } from "vitest";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { deliveredTextFragments } from "./delivery-journal";
import {
  READING_PLAYER_COPY,
  READING_RESULTS_COPY,
  readingPlayerDisplay,
  readingQuestionDisplay,
  readingResultsDisplay,
} from "./reading-display";
import type { ReadingSessionResult } from "@/lib/types";

const text = SEED_TEXT_BY_ID["football-migration"];
const result: ReadingSessionResult = {
  studentId: "student",
  textVersionId: text.id,
  startedAt: "2026-09-13T08:00:00.000Z",
  completedAt: "2026-09-13T08:10:00.000Z",
  abandoned: false,
  successRate: 0.82,
  literalScore: 1,
  inferenceScore: 0.5,
  vocabularyScore: 0.75,
  summaryScore: 0.8,
  retrievalScore: 1,
  timeOnTaskSeconds: 600,
  hintsUsed: 0,
  targetSuccessZone: { min: 0.8, max: 0.85 },
  recommendedNextAction: "maintain",
};

it("projects every deterministic reading-player correction and evidence sentence", () => {
  const display = readingPlayerDisplay(text);
  expect(display.text?.difficultyLabel).toBeTruthy();
  expect(display.text?.paragraphLabels).toHaveLength(text.body.length);
  expect(display.text?.vocabularyEntries[0]).toBe(`${text.targetVocabulary[0].word} — ${text.targetVocabulary[0].definitionFr}`);
  expect(display.text?.questions).toHaveLength(text.questions.length);
  const first = readingQuestionDisplay(text, text.questions[0], 0);
  expect(first.position).toBe(`Question 1 / ${text.questions.length}`);
  expect(first.incorrect).toContain(text.questions[0].choices[text.questions[0].correctIndex]);
  expect(first.displayedChoices).toHaveLength(text.questions[0].choices.length);
  expect(first.evidence?.displayedCandidates.every((candidate) => candidate.startsWith("« ") && candidate.endsWith(" »"))).toBe(true);
  expect(deliveredTextFragments(display)).toEqual(expect.arrayContaining([
    READING_PLAYER_COPY.startError,
    READING_PLAYER_COPY.answerOffline,
    READING_PLAYER_COPY.finishError,
    first.incorrect,
    first.evidence!.incorrect,
  ]));
});

it("formats the exact results percentages, zone, categories and next action", () => {
  const display = readingResultsDisplay({
    text,
    result,
    nextStep: { href: "/student/read/next", label: "Lecture suivante (7B)" },
    hydrated: true,
  });
  expect(display).toMatchObject({
    state: "result",
    percentage: 82,
    successRate: "82%",
    zone: READING_RESULTS_COPY.inZone,
    nextAction: "Continuer au même niveau",
    categories: [
      { label: "Littéral / idée principale", value: "100%" },
      { label: "Inférence / cause", value: "50%" },
      { label: "Vocabulaire", value: "75%" },
      { label: "Résumé", value: "80%" },
      { label: "Mémoire", value: "100%" },
    ],
  });
  expect(display.state === "result" && display.corrections[0].choices).toEqual(readingQuestionDisplay(text, text.questions[0], 0).displayedChoices);
});

it("records all missing/loading/empty states without inventing a result", () => {
  expect(readingResultsDisplay({ text: null, result: null, nextStep: { href: "/", label: "x" } }).state).toBe("missing");
  expect(readingResultsDisplay({ text, result, nextStep: { href: "/", label: "x" }, hydrated: false }).state).toBe("loading");
  expect(readingResultsDisplay({ text, result: null, nextStep: { href: "/", label: "x" }, hydrated: true }).state).toBe("empty");
});
