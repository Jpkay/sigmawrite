import { expect, it } from "vitest";
import { deliveredTextFragments } from "./delivery-journal";
import {
  PRODUCTION_PLAYER_COPY,
  productionLengthError,
  productionPlayerError,
  productionResultDisplay,
  productionTaskDisplay,
  productionWordCount,
} from "./production-player-display";

const task = { minimumWords: 80, maximumWords: 120 };

it("projects the fixed and range-specific browser material", () => {
  const display = productionTaskDisplay(task);
  expect(display.objective).toBe("Objectif : 80–120");
  expect(display.rangeHelp).toBe("Écris entre 80 et 120 mots.");
  expect(display.lengthError).toBe("Écris entre 80 et 120 mots pour que la production soit vérifiable.");
  expect(display.initialWordCount).toBe("0 mots");
  expect(display.accentControls).toEqual({
    label: "Caractères français",
    characters: ["é", "è", "ê", "ë", "à", "â", "î", "ï", "ô", "ù", "û", "ü", "ç", "œ", "’"],
  });
  expect(deliveredTextFragments(display)).toEqual(expect.arrayContaining([
    PRODUCTION_PLAYER_COPY.eyebrow,
    PRODUCTION_PLAYER_COPY.masteryRequirement,
    PRODUCTION_PLAYER_COPY.placeholder,
    "Objectif : 80–120",
    "Écris entre 80 et 120 mots.",
    "Écris entre 80 et 120 mots pour que la production soit vérifiable.",
  ]));
  expect(deliveredTextFragments(display)).not.toEqual(expect.arrayContaining(["Consigne", "Texte à lire", "Question"]));
});

it("constructs the exact successful rubric and result strings", () => {
  const display = productionResultDisplay({
    demonstrated: true,
    feedback: "Cette production compte comme preuve autonome.",
    matchedForms: ["est allée", "avons fini"],
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
  });
  expect(display.heading).toBe(PRODUCTION_PLAYER_COPY.demonstrated);
  expect(display.forms?.text).toBe("Formes repérées : est allée, avons fini");
  expect(display.rubric).toMatchObject({
    scoreText: "84 / 100",
    dimensions: [
      { label: "Contenu", value: "90/100" },
      { label: "Structure", value: "—" },
      { label: "Langue", value: "76/100" },
    ],
    priority: "Ta priorité : Vérifie l’accord du participe.",
    deterministic: null,
  });
  expect(display.controls).toEqual([PRODUCTION_PLAYER_COPY.returnToProgram]);
});

it("constructs retry output and finite learner errors without exposing infrastructure text", () => {
  const display = productionResultDisplay({
    demonstrated: false,
    feedback: "Utilise deux formes différentes.",
    matchedForms: [],
    rubric: null,
  });
  expect(display.heading).toBe(PRODUCTION_PLAYER_COPY.revise);
  expect(display.forms).toBeNull();
  expect(display.controls).toEqual([PRODUCTION_PLAYER_COPY.retry, PRODUCTION_PLAYER_COPY.returnToProgram]);
  expect(productionWordCount(1)).toBe("1 mot");
  expect(productionWordCount(2)).toBe("2 mots");
  expect(productionPlayerError(Error("database host secret"), task)).toBe(PRODUCTION_PLAYER_COPY.genericError);
  expect(productionPlayerError(Error(productionLengthError(task)), task)).toBe(productionLengthError(task));
  expect(productionPlayerError(Error(PRODUCTION_PLAYER_COPY.duplicateError), task)).toBe(PRODUCTION_PLAYER_COPY.duplicateError);
});
