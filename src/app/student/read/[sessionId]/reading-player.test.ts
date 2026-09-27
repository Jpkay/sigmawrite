import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/actions/student", () => ({
  completeReadingSession: vi.fn(),
  loadReadingResume: vi.fn(),
  recordReadingJustification: vi.fn(),
  startReadingSession: vi.fn(),
  submitAnswer: vi.fn(),
  submitSummary: vi.fn(),
}));
vi.mock("@/lib/student-store", () => ({
  completeReadingSession: vi.fn(),
  hasStudentBackend: false,
  lastSuccessRate: () => undefined,
  replaceStudentState: vi.fn(),
  useStudentState: () => ({ hydrated: true, skillEstimates: {} }),
}));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

import { ReadingPlayer } from "./reading-player";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { readingPlayerDisplay } from "@/lib/diagnostic/granular/reading-display";

const text = SEED_TEXT_BY_ID["football-migration"];

it("renders the initial reading surface from the captured projection", () => {
  const html = renderToStaticMarkup(React.createElement(ReadingPlayer, { textKey: text.id, text }));
  const display = readingPlayerDisplay(text);
  expect(html).toContain(text.title);
  expect(html).toContain(display.text!.difficultyLabel);
  expect(html).toContain(display.copy.readableFont);
  expect(html).toContain(display.copy.vocabulary);
  expect(html).toContain(display.copy.beginQuestions);
  expect(html).toContain(`aria-label="${display.text!.paragraphLabels[0]}"`);
  expect(html).toContain(text.targetVocabulary[0].word);
  expect(html).toContain(text.targetVocabulary[0].definitionFr.replace("'", "&#x27;"));
});

it("renders the finite missing-text state", () => {
  const html = renderToStaticMarkup(React.createElement(ReadingPlayer, { textKey: "missing", text: null }));
  expect(html).toContain("Texte introuvable");
  expect(html).toContain("Retour à l&#x27;accueil");
});
