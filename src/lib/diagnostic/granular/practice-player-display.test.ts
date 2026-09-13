import { expect, it } from "vitest";
import { deliveredTextFragments } from "./delivery-journal";
import {
  PRACTICE_PLAYER_COPY,
  practiceCompletionDisplay,
  practiceFeedbackDisplay,
  practiceLanguageCoachingDisplay,
  practicePlayerDisplay,
  practicePlayerError,
} from "./practice-player-display";
import { shuffledOrder } from "@/components/exercise-widgets";

type Practice = Parameters<typeof practicePlayerDisplay>[0];

const practice = {
  node: {
    id: "11111111-1111-4111-8111-111111111111",
    key: "accord_nombre",
    label: "Accord en nombre",
    description: "Accorde le nom et l’adjectif.",
    strand: "conjugaison",
  },
  scaffoldLevel: 1,
  lesson: {
    family: "grammar",
    eyebrow: "À observer",
    explanation: "Observe le donneur d’accord.",
    pattern: "nom + adjectif",
    examples: ["Les maisons blanches."],
    exceptions: ["Certains pluriels changent."],
  },
  items: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      promptFr: "Lis le texte.\n\nLes chevaux courent.\n\nQue font les chevaux ?",
      instructionsFr: "Réponds par une phrase.",
      responseType: "ordering",
      validatorType: "exact",
      validatorConfig: { tokens: ["Les", "chevaux", "courent."], readingRubric: {} },
      correctAnswer: "Les chevaux courent.",
      acceptableAnswers: [],
      difficulty: 1,
      predictedSuccess: 0.8,
      choices: [],
    },
  ],
} as unknown as Practice;

it("projects fixed, parsed and client-constructed material before render", () => {
  const display = practicePlayerDisplay(practice);
  const fragments = deliveredTextFragments(display);
  const expectedOrder = shuffledOrder(
    ["Les", "chevaux", "courent."],
    "22222222-2222-4222-8222-222222222222",
  );

  expect(display.items[0].widget.order).toEqual(expectedOrder);
  expect(display.items[0].prompt).toEqual({
    instruction: "Lis le texte.",
    passage: ["Les chevaux courent."],
    question: "Que font les chevaux ?",
    paragraphs: [],
  });
  expect(fragments).toEqual(expect.arrayContaining([
    PRACTICE_PLAYER_COPY.lessonHeading,
    PRACTICE_PLAYER_COPY.readingRubric,
    "Cette étape travaille : Accord en nombre. Accorde le nom et l’adjectif.",
    "Repère le donneur d’accord, puis reporte séparément le genre et le nombre sur le mot qui reçoit l’accord.",
    "Monter « chevaux »",
    expectedOrder.join(" "),
    "Exercice 1 sur 1",
    "Commencer les 1 exercices",
    "0 exercices terminés. La prochaine révision sera proposée au bon moment.",
    "1 exercice terminé. La session reste limitée à sept minutes.",
  ]));
});

it("constructs the exact feedback and completion strings rendered by the player", () => {
  expect(practiceFeedbackDisplay({
    correct: false,
    feedbackFr: "Au pluriel, écris « chevaux ».",
    remediation: { nodeId: "node", label: "Le pluriel des noms" },
    conjugation: true,
  })).toEqual({
    outcome: PRACTICE_PLAYER_COPY.incorrect,
    feedback: "Au pluriel, écris « chevaux ».",
    references: [PRACTICE_PLAYER_COPY.rule, PRACTICE_PLAYER_COPY.conjugationTables],
    remediation: {
      label: "Le pluriel des noms",
      sentence: "Après cette session, révise aussi Le pluriel des noms.",
    },
    control: PRACTICE_PLAYER_COPY.retry,
  });
  expect(practiceCompletionDisplay({ completed: false, exercisesCompleted: 1, totalXp: 0, bonusXp: 0 })).toEqual({
    eyebrow: PRACTICE_PLAYER_COPY.timeDone,
    heading: PRACTICE_PLAYER_COPY.stopped,
    summary: "1 exercice terminé. La session reste limitée à sept minutes.",
    bonus: null,
    control: PRACTICE_PLAYER_COPY.returnToProgram,
  });
  expect(practiceCompletionDisplay({ completed: true, exercisesCompleted: 6, totalXp: 10, bonusXp: 3 }).summary)
    .toBe("6 exercices terminés. La prochaine révision sera proposée au bon moment.");
  expect(practiceLanguageCoachingDisplay({
    result: {
      tip: {
        kind: "grammar",
        before: "les cheval",
        after: "les chevaux",
        explanationFr: "Le nom prend un x.",
        recurring: false,
      },
      available: true,
    },
    requested: true,
  })).toEqual({
    heading: PRACTICE_PLAYER_COPY.coachingLanguage,
    correction: "« les cheval » → « les chevaux »",
    explanation: "Le nom prend un x.",
    status: null,
    control: PRACTICE_PLAYER_COPY.coachingAction,
  });
});

it("maps arbitrary infrastructure errors to the recorded finite copy", () => {
  expect(practicePlayerError("start", Error("database host secret"))).toBe(PRACTICE_PLAYER_COPY.startError);
  expect(practicePlayerError("finish", Error("rpc unavailable"))).toBe(PRACTICE_PLAYER_COPY.finishError);
  expect(practicePlayerError("answer", Error("constraint name"))).toBe(PRACTICE_PLAYER_COPY.answerError);
  expect(practicePlayerError("answer", Error(PRACTICE_PLAYER_COPY.expiredError))).toBe(PRACTICE_PLAYER_COPY.expiredError);
  expect(practicePlayerError("start", Error(PRACTICE_PLAYER_COPY.lessonNeedsExercisesError))).toBe(PRACTICE_PLAYER_COPY.lessonNeedsExercisesError);
  expect(practicePlayerError("answer", Error(PRACTICE_PLAYER_COPY.inactiveError))).toBe(PRACTICE_PLAYER_COPY.inactiveError);
});
