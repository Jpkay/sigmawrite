import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/actions/student", () => ({
  startNodePracticeSession: vi.fn(),
  submitNodePractice: vi.fn(),
  completeNodePracticeSession: vi.fn(),
}));
vi.mock("@/components/motivation", () => ({ Confetti: () => null }));
vi.mock("@/components/language-coaching", () => ({ LanguageCoaching: () => null }));

import { PRACTICE_PLAYER_COPY, practicePlayerDisplay } from "@/lib/diagnostic/granular/practice-player-display";
import { PracticePlayer } from "./practice-player";
import { ExerciseSurface } from "@/components/exercise-surface";

type Practice = Parameters<typeof PracticePlayer>[0]["practice"];
const practice = {
  node: { id: "node", key: "accord", label: "Accord en nombre", description: "Accorde les mots.", strand: "grammaire" },
  scaffoldLevel: 0,
  lesson: {
    family: "grammar",
    eyebrow: "Leçon guidée",
    explanation: "Observe le nom.",
    pattern: "nom + adjectif",
    examples: ["Les maisons blanches."],
    exceptions: ["Attention au pluriel."],
  },
  items: [{
    id: "item",
    promptFr: "Choisis la bonne forme.",
    instructionsFr: null,
    responseType: "short_answer",
    validatorType: "exact",
    validatorConfig: null,
    correctAnswer: "blanches",
    acceptableAnswers: [],
    difficulty: 1,
    predictedSuccess: 0.8,
    choices: [],
  }],
} as unknown as Practice;

it("renders the initial lesson from the same copy and projections that are journaled", () => {
  const html = renderToStaticMarkup(React.createElement(PracticePlayer, { practice }));
  const display = practicePlayerDisplay(practice);
  expect(html).toContain(PRACTICE_PLAYER_COPY.lessonHeading);
  expect(html).toContain(PRACTICE_PLAYER_COPY.pattern);
  expect(html).toContain(PRACTICE_PLAYER_COPY.exceptions);
  expect(html).toContain(display.start);
  expect(html).toContain(display.xp);
  expect(html).toContain("Observe le nom.");
});

it("renders the recorded finite empty state", () => {
  const html = renderToStaticMarkup(React.createElement(PracticePlayer, {
    practice: { ...practice, items: [] },
  }));
  expect(html).toContain(PRACTICE_PLAYER_COPY.empty);
});

it("renders parsed instructions and deterministic ordering captured by the display projection", () => {
  const ordering = {
    ...practice,
    items: [{
      ...practice.items[0],
      id: "ordered-item",
      promptFr: "Lis le texte.\n\nLes chevaux courent.\n\nQue font les chevaux ?",
      instructionsFr: "Remets les mots dans l’ordre.",
      responseType: "ordering",
      validatorConfig: { tokens: ["Les", "chevaux", "courent."], readingRubric: {} },
    }],
  } as unknown as Practice;
  const display = practicePlayerDisplay(ordering);
  const html = renderToStaticMarkup(React.createElement(ExerciseSurface, {
    item: ordering.items[0],
    choice: null,
    answer: "",
    order: [],
    rule: "",
    setChoice: () => {},
    setAnswer: () => {},
    setOrder: () => {},
    setRule: () => {},
  }));

  expect(html).toContain("Remets les mots dans l’ordre.");
  expect(html).toContain("Les chevaux courent.");
  expect(html).toContain(PRACTICE_PLAYER_COPY.readingRubric);
  expect(html).toContain(display.items[0].widget.orderedSentence);
  expect(html).toContain(display.items[0].widget.moveLabels[0]);
});
