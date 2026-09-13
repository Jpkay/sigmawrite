import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/actions/student", () => ({
  loadIndependentProductionTask: vi.fn(),
  submitIndependentProduction: vi.fn(),
}));

import { IndependentProductionPlayer, IndependentProductionResult } from "./production-player";
import { PRODUCTION_PLAYER_COPY, productionTaskDisplay } from "@/lib/diagnostic/granular/production-player-display";

type Task = Parameters<typeof IndependentProductionPlayer>[0]["task"];
const task = {
  nodeId: "node",
  nodeKey: "employer_passe_compose_en_contexte",
  label: "Employer le passé composé",
  description: "Raconter un événement terminé.",
  genre: "recit",
  genreLabel: "Récit",
  genres: [{ key: "recit", label: "Récit" }, { key: "article", label: "Article" }],
  prompt: "Raconte une sortie en employant deux formes au passé composé.",
  legacyPrompt: "Rédige un paragraphe.",
  minimumWords: 80,
  maximumWords: 120,
} as Task;

it("renders the initial task with the same fixed and range strings that are journaled", () => {
  const html = renderToStaticMarkup(React.createElement(IndependentProductionPlayer, { task }));
  const display = productionTaskDisplay(task);
  expect(html).toContain(PRODUCTION_PLAYER_COPY.eyebrow);
  expect(html).toContain(PRODUCTION_PLAYER_COPY.genreLabel);
  expect(html).toContain(PRODUCTION_PLAYER_COPY.masteryRequirement);
  expect(html).toContain(PRODUCTION_PLAYER_COPY.placeholder);
  expect(html).toContain(display.objective);
  expect(html).toContain(display.rangeHelp);
  expect(html).toContain(display.initialWordCount);
  expect(html).toContain(display.accentControls.label);
  expect(html).toContain(display.accentControls.characters[0]);
  expect(html).toContain(task.prompt);
  expect(html).toContain(task.genres[1].label);
});

it("escapes database-authored task text in the real render", () => {
  const html = renderToStaticMarkup(React.createElement(IndependentProductionPlayer, {
    task: { ...task, prompt: "<script>unsafe()</script>" },
  }));
  expect(html).toContain("&lt;script&gt;unsafe()&lt;/script&gt;");
  expect(html).not.toContain("<script>unsafe()</script>");
});

it("renders the exact projected feedback and rubric text", () => {
  type Result = Parameters<typeof IndependentProductionResult>[0]["result"];
  const result = {
    xp: null,
    demonstrated: false,
    verified: true,
    mastery: 0.62,
    matchedForms: ["est allée", "avons fini"],
    grammarErrorCount: 1,
    feedback: "Le texte utilise bien la compétence, mais corrige encore les erreurs signalées avant qu’il compte comme preuve.",
    rubric: {
      score: 84,
      deterministicScore: 80,
      modelScore: 88,
      content: 90,
      structure: null,
      language: 76,
      priorityFr: "Vérifie l’accord du participe.",
      praiseFr: null,
      source: "blended",
    },
  } as Result;
  const html = renderToStaticMarkup(React.createElement(IndependentProductionResult, { result, onRetry: () => undefined }));
  const text = html.replace(/<[^>]+>/gu, "");
  expect(text).toContain("Production enregistrée");
  expect(text).toContain("Encore un ajustement");
  expect(text).toContain(result.feedback);
  expect(text).toContain("Formes repérées : est allée, avons fini");
  expect(text).toContain("84 / 100");
  expect(text).toContain("Contenu90/100Structure—Langue76/100");
  expect(text).toContain("Ta priorité : Vérifie l’accord du participe.");
  expect(text).toContain("Écrire un nouveau texte");
  expect(text).toContain("Retour au programme");
});
