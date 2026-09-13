import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/actions/student", () => ({
  startDictation: vi.fn(),
  submitDictation: vi.fn(),
  submitDictationJustifications: vi.fn(),
}));

import { DictationPlayer, DictationResultPanel } from "./dictation-player";
import { CATEGORY_LABELS, type ErrorCategory } from "@/lib/dictation/classify";
import { DICTATION_COPY, dictationJustificationOutcomeDisplay, dictationResultDisplay } from "@/lib/diagnostic/granular/dictation-display";

const profile = {
  phonogrammique: 0,
  morphogrammique_grammaticale: 1,
  morphogrammique_lexicale: 0,
  logogrammique: 0,
  ideogrammique: 0,
  extragraphique: 0,
} satisfies Record<ErrorCategory, number>;

const result = {
  attemptId: "11111111-1111-4111-8111-111111111111",
  score: 8.5,
  accuracy: 0.9,
  words: 3,
  xp: { awarded: true, xp: 15, dayXp: 30, goalXp: 30, goalCompleted: true },
  profile,
  categoryLabels: CATEGORY_LABELS,
  segments: [{
    index: 0,
    expected: "Les chevaux arrivent.",
    actual: "Les chevals arrivent.",
    errors: [{
      segment: 0,
      position: 1,
      actual: "chevals",
      expected: "chevaux",
      category: "morphogrammique_grammaticale" as const,
      nodeKey: "former_pluriel_noms_al_aux",
      explanationFr: "Les noms en -al font leur pluriel en -aux.",
    }],
  }],
  justification: [{ errorIndex: 0, options: [
    { key: "morphogrammique_grammaticale", label: "Accords et terminaisons" },
    { key: "phonogrammique", label: "Son et graphie" },
  ] }],
};

it("renders the recorded preparation state in the real player", () => {
  const html = renderToStaticMarkup(React.createElement(DictationPlayer, { dictationId: "11111111-1111-4111-8111-111111111111" }));
  expect(html).toContain(DICTATION_COPY.preparing);
});

it("renders the exact result projection and justification outcome", () => {
  const outcome = { correct: 1, total: 1 };
  const display = dictationResultDisplay(result);
  const html = renderToStaticMarkup(React.createElement(DictationResultPanel, {
    result,
    justificationOutcome: outcome,
    dictationId: "22222222-2222-4222-8222-222222222222",
  }));
  const text = html.replace(/<[^>]+>/gu, "");
  expect(text).toContain(display.result.scoreText);
  expect(html).toContain(display.result.xp!);
  expect(html).toContain(display.result.categories[0].label);
  expect(html).toContain(display.result.segments[0].expected);
  expect(html).toContain(display.result.segments[0].errors[0].explanation);
  expect(html).toContain(DICTATION_COPY.seeRule);
  expect(html).toContain(dictationJustificationOutcomeDisplay(outcome).text);
  expect(html).toContain("/student/reference/regle/former_pluriel_noms_al_aux");
});
