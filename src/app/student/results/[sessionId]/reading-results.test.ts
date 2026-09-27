import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { ReadingSessionResult } from "@/lib/types";

const f = vi.hoisted(() => ({ state: vi.fn() }));
vi.mock("@/lib/student-store", () => ({ useStudentState: f.state }));
vi.mock("@/components/writing-feedback", () => ({ WritingFeedback: () => null }));

import { ReadingResults } from "./reading-results";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";

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

it("renders exact captured score, zone, category and recommendation strings", () => {
  f.state.mockReturnValue({ hydrated: true, sessions: [result], answersByText: { [text.id]: { q1: 0 } } });
  const html = renderToStaticMarkup(React.createElement(ReadingResults, {
    textKey: text.id,
    text,
    nextStep: { href: "/student/read/next", label: "Lecture suivante (7B)" },
  }));
  expect(html).toContain("Taux de réussite");
  expect(html).toContain("82%");
  expect(html).toContain("Dans la zone d&#x27;apprentissage");
  expect(html).toContain("Littéral / idée principale");
  expect(html).toContain("100%");
  expect(html).toContain("Continuer au même niveau");
  expect(html).toContain("Lecture suivante (7B)");
  expect(html).toContain("Correction");
  expect(html).toContain(text.questions[0].explanationFr);
});

it("renders captured loading and empty-result states", () => {
  f.state.mockReturnValue({ hydrated: false, sessions: [], answersByText: {} });
  expect(renderToStaticMarkup(React.createElement(ReadingResults, { textKey: text.id, text, nextStep: { href: "/", label: "x" } }))).toContain("Chargement…");
  f.state.mockReturnValue({ hydrated: true, sessions: [], answersByText: {} });
  const empty = renderToStaticMarkup(React.createElement(ReadingResults, { textKey: text.id, text, nextStep: { href: "/", label: "x" } }));
  expect(empty).toContain("Aucun résultat pour ce texte");
  expect(empty).toContain("Faire la lecture");
});
