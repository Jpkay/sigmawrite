import { expect, it } from "vitest";
import { deliveredTextFragments } from "./delivery-journal";
import { CATEGORY_LABELS, type ErrorCategory } from "@/lib/dictation/classify";
import {
  DICTATION_COPY,
  dictationCatalogDisplay,
  dictationJustificationOutcomeDisplay,
  dictationPlayerError,
  dictationResultDisplay,
  dictationSessionDisplay,
} from "./dictation-display";

const emptyProfile = () => ({
  phonogrammique: 0,
  morphogrammique_grammaticale: 0,
  morphogrammique_lexicale: 0,
  logogrammique: 0,
  ideogrammique: 0,
  extragraphique: 0,
}) satisfies Record<ErrorCategory, number>;

it("projects exact catalog rows and every catalog state", () => {
  const display = dictationCatalogDisplay([
    { id: "one", title: "Les chevaux", kind: "brevet", wordCount: 72, gradeMin: 6, gradeMax: 9, focus: "Accorder les noms", estimatedMinutes: 20, lastScore: 8, attempts: 1 },
    { id: "two", title: "Au marché", kind: "flash", wordCount: 32, gradeMin: 5, gradeMax: 5, focus: null, estimatedMinutes: 5, lastScore: null, attempts: 0 },
  ]);
  expect(display.copy).toEqual({
    loading: "Chargement…",
    empty: "Aucune dictée publiée pour l’instant. Elles arrivent dès qu’un enseignant les a relues.",
    error: "Chargement impossible.",
  });
  expect(display.entries).toEqual([
    { id: "one", kind: "Dictée type brevet", grade: "6e – 3e", meta: "72 mots · ~20 min", title: "Les chevaux", focus: "Accorder les noms", score: "Dernier score : 8/10", control: "Refaire" },
    { id: "two", kind: "Dictée flash", grade: "CM2", meta: "32 mots · ~5 min", title: "Au marché", focus: null, score: "Pas encore faite", control: "Commencer" },
  ]);
});

it("projects the exact session instructions, template choices, and browser-audio disclosure", () => {
  const display = dictationSessionDisplay({
    title: "Les chevaux",
    mode: "choix",
    focus: "Accorder Les Noms",
    wordCount: 14,
    audioMode: "browser",
    segments: [
      { index: 0, template: { tokens: ["Les", null, "arrivent."], blanks: [{ index: 1, choices: ["chevaux", "chevals"] }] } },
      { index: 1, template: null },
    ],
  });
  expect(display.eyebrow).toBe("Dictée · à choix");
  expect(display.intro).toBe("14 mots en 2 segments. Point travaillé : accorder les noms.");
  expect(display.browserVoice).toBe(DICTATION_COPY.browserVoice);
  expect(display.segments).toEqual([
    { position: "Segment 1 / 2", inputLabel: "Segment 1", blankLabels: ["Mot 2"], choices: ["chevaux", "chevals"] },
    { position: "Segment 2 / 2", inputLabel: "Segment 2", blankLabels: [], choices: [] },
  ]);
  expect(display.accentControls.label).toBe("Caractères français");
  expect(display.initialReplayCount).toBe("0 réécoute(s)");
  expect(deliveredTextFragments(display)).toEqual(expect.arrayContaining([
    DICTATION_COPY.preparing,
    DICTATION_COPY.listenAll,
    DICTATION_COPY.transcriptPlaceholder,
    DICTATION_COPY.validate,
    DICTATION_COPY.scoringError,
  ]));
});

it("projects negotiated corrections and the final result exactly", () => {
  const profile = emptyProfile();
  profile.morphogrammique_grammaticale = 1;
  const error = {
    segment: 0,
    actual: "chevals",
    expected: "chevaux",
    category: "morphogrammique_grammaticale" as const,
    nodeKey: "former_pluriel_noms_al_aux",
    explanationFr: "Les noms en -al font leur pluriel en -aux.",
  };
  const display = dictationResultDisplay({
    score: 8.5,
    xp: { xp: 15, goalCompleted: true },
    profile,
    categoryLabels: CATEGORY_LABELS,
    segments: [{ index: 0, expected: "Les chevaux arrivent.", errors: [error] }],
    justification: [{ errorIndex: 0, options: [
      { key: "morphogrammique_grammaticale", label: "Accords et terminaisons" },
      { key: "phonogrammique", label: "Son et graphie" },
    ] }],
  });
  expect(display.negotiation).toMatchObject({
    heading: "1 correction(s) à justifier avant de voir la réponse",
    corrections: [{
      prompt: "Segment 1 · tu as écrit « chevals »",
      ruleLabel: "Règle pour le mot 1",
      options: ["Accords et terminaisons", "Son et graphie"],
    }],
  });
  expect(display.result).toMatchObject({
    scoreText: "8.5 / 10",
    xp: "+15 XP · objectif du jour atteint",
    categories: [{ text: "Accords et terminaisons · 1" }],
    segments: [{
      label: "Segment 1",
      expected: "Les chevaux arrivent.",
      errors: [{ replacement: "chevals → chevaux", category: "Accords et terminaisons", explanation: error.explanationFr, ruleControl: "Voir la règle", ruleHref: "/student/reference/regle/former_pluriel_noms_al_aux" }],
    }],
  });
  expect(dictationJustificationOutcomeDisplay({ correct: 1, total: 1 }).text).toBe("Justifications : 1 / 1 règles bien identifiées.");
});

it("records clean, omitted, and extra-word result variants", () => {
  const clean = dictationResultDisplay({ score: 10, xp: null, profile: emptyProfile(), categoryLabels: CATEGORY_LABELS, segments: [{ index: 0, expected: "Tout va bien.", errors: [] }], justification: [] });
  expect(clean.negotiation).toBeNull();
  expect(clean.result.clean).toBe("Sans faute. Bravo.");
  expect(clean.result.segments[0].exact).toBe("Exact.");

  const profile = emptyProfile();
  profile.extragraphique = 2;
  const changed = dictationResultDisplay({
    score: 7,
    xp: null,
    profile,
    categoryLabels: CATEGORY_LABELS,
    segments: [{ index: 0, expected: "Un texte.", errors: [
      { segment: 0, actual: null, expected: "mot", category: "extragraphique", nodeKey: "node", explanationFr: "Ajoute le mot." },
      { segment: 0, actual: "mot", expected: "", category: "extragraphique", nodeKey: "node", explanationFr: "Retire le mot." },
    ] }],
    justification: [],
  });
  expect(changed.result.segments[0].errors.map((item) => item.replacement)).toEqual(["(oublié) → mot", "mot → (en trop)"]);
});

it("maps infrastructure failures to the finite recorded learner vocabulary", () => {
  expect(dictationPlayerError("start", Error("database password leaked"))).toBe(DICTATION_COPY.startError);
  expect(dictationPlayerError("score", Error("database password leaked"))).toBe(DICTATION_COPY.scoringError);
  expect(dictationPlayerError("justify", Error("database password leaked"))).toBe(DICTATION_COPY.justificationError);
  expect(dictationPlayerError("start", Error(DICTATION_COPY.audioUnavailable))).toBe(DICTATION_COPY.audioUnavailable);
  expect(dictationPlayerError("score", Error(DICTATION_COPY.rateLimit))).toBe(DICTATION_COPY.rateLimit);
  expect(dictationPlayerError("justify", Error(DICTATION_COPY.attemptMissing))).toBe(DICTATION_COPY.attemptMissing);
});
