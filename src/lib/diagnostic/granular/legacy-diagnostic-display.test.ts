import { expect, it } from "vitest";
import { deliveredTextFragments } from "./delivery-journal";
import type { DiagnosticSectionProgress } from "@/lib/diagnostic/protocol";
import {
  LEGACY_DIAGNOSTIC_COPY,
  legacyDiagnosticCompletionDisplay,
  legacyDiagnosticFixedDisplay,
  legacyDiagnosticItemDisplay,
  legacyDiagnosticResponseDisplay,
} from "./legacy-diagnostic-display";

const progress: DiagnosticSectionProgress[] = [
  { key: "reading_comprehension", probeCount: 2, distinctNodesTested: 2, confirmedNodeCount: 1, targetNodeCount: 8, resolvedNodeCount: 2, meanUncertainty: .6, nextInformationGain: .2, eligibleItemCount: 10, status: "active" },
  { key: "grammar", probeCount: 0, distinctNodesTested: 0, confirmedNodeCount: 0, targetNodeCount: 8, resolvedNodeCount: 0, meanUncertainty: 1, nextInformationGain: .3, eligibleItemCount: 10, status: "pending" },
  { key: "spelling", probeCount: 0, distinctNodesTested: 0, confirmedNodeCount: 0, targetNodeCount: 8, resolvedNodeCount: 0, meanUncertainty: 1, nextInformationGain: .3, eligibleItemCount: 10, status: "pending" },
  { key: "conjugation", probeCount: 0, distinctNodesTested: 0, confirmedNodeCount: 0, targetNodeCount: 8, resolvedNodeCount: 0, meanUncertainty: 1, nextInformationGain: .3, eligibleItemCount: 10, status: "pending" },
];

const run = {
  item: {
    id: "11111111-1111-4111-8111-111111111111",
    runItemId: "22222222-2222-4222-8222-222222222222",
    assignedAt: "2026-09-13T08:00:00.000Z",
    nodeId: "33333333-3333-4333-8333-333333333333",
    nodeKey: "reading",
    nodeLabel: "Comprendre une cause",
    promptFr: "Lis le texte.\n\nLe pont est fermé parce que la rivière monte.\n\nPourquoi le pont est-il fermé ?",
    instructionsFr: "Réponds d’après le texte.",
    responseType: "single_choice",
    choices: [
      { id: "44444444-4444-4444-8444-444444444444", text: "Parce que la rivière monte." },
      { id: "55555555-5555-4555-8555-555555555555", text: "Parce que le soleil brille." },
    ],
    strand: "comprehension_ecrite" as const,
    sectionKey: "reading_comprehension" as const,
    informationGain: .2,
    masteryEvidenceId: "recognition",
    evidenceExpectation: "receptive" as const,
    promptFamily: "cause",
    difficultyTier: "core" as const,
  },
  progress,
  minTotalProbes: 24,
  maxTotalProbes: 48,
  resumed: false,
  isPilot: false,
};

it("projects the exact current question, deterministic choices, progress and rationale", () => {
  const display = legacyDiagnosticItemDisplay(run, 2);
  expect(display.header).toEqual({
    eyebrow: "Diagnostic initial",
    title: "Trouvons ton point de départ",
    description: "Chaque domaine s’adapte séparément. Il faut au moins 24 réponses au total; le diagnostic s’arrête dès que le profil est assez précis.",
  });
  expect(display.sections.map((section) => section.status)).toEqual(["2/6 minimum", "Section 2", "Section 3", "Section 4"]);
  expect(display.question).toMatchObject({
    section: "Compréhension écrite",
    meta: "Question 3 · difficulté ajustée en continu",
    instructions: ["Lis le texte.", "Réponds d’après le texte."],
    passage: ["Le pont est fermé parce que la rivière monte."],
    question: "Pourquoi le pont est-il fermé ?",
  });
  expect(display.question.choices.map((choice) => choice.text).sort()).toEqual(run.item.choices.map((choice) => choice.text).sort());
  expect(display.rationale).toMatchObject({
    responses: 2,
    tested: 2,
    confirmed: 1,
    range: "Une section peut prendre de 6 à 12 questions. Une compétence n’est confirmée qu’après les types de preuves nécessaires, par exemple reconnaître puis produire. La section s’arrête selon la couverture du graphe et l’incertitude restante.",
  });
});

it("projects completed counts, saved path copy and dynamic rationales", () => {
  const display = legacyDiagnosticCompletionDisplay({
    isPilot: true,
    frontier: {
      report: { mastered: ["a"], fragile: ["b", "c"], missing: ["d"], unknown: [], readyToLearn: [], blockers: [] },
      labels: {},
    },
    learningPath: {
      stepCount: 1,
      firstSteps: [{ nodeId: "d", nodeKey: "agreement", label: "Accorder le nom", section: "spelling", position: 1, stage: "remediation", mastery: .2, uncertainty: .6, prerequisiteNodeIds: [], rationaleFr: "Cette base débloque la suite." }],
    },
  });
  expect(display.outcomes.map((outcome) => [outcome.label, outcome.count])).toEqual([
    ["Maîtrisé", 1], ["À consolider", 2], ["À construire", 1], ["À vérifier", 0],
  ]);
  expect(display.path).toMatchObject({
    heading: "Un parcours de 1 compétences",
    steps: [{ label: "Accorder le nom", rationale: "Cette base débloque la suite.", section: "Orthographe" }],
  });
  expect(display.pilotNotice).toContain("aperçu provisoire");
});

it("records every fixed state and finite error plus dynamic response branches", () => {
  const fixed = deliveredTextFragments(legacyDiagnosticFixedDisplay());
  expect(fixed).toEqual(expect.arrayContaining([
    LEGACY_DIAGNOSTIC_COPY.loading.description,
    LEGACY_DIAGNOSTIC_COPY.blocked.help,
    LEGACY_DIAGNOSTIC_COPY.unavailable.fallback,
    LEGACY_DIAGNOSTIC_COPY.run.submissionFallback,
    LEGACY_DIAGNOSTIC_COPY.run.submissionError,
  ]));
  expect(legacyDiagnosticResponseDisplay({ startupError: null })).toEqual({ kind: "startup-error", message: LEGACY_DIAGNOSTIC_COPY.unavailable.fallback });
  expect(legacyDiagnosticResponseDisplay({ submissionError: null })).toEqual({ kind: "submission-error", message: LEGACY_DIAGNOSTIC_COPY.run.submissionFallback });
  expect(legacyDiagnosticResponseDisplay({ blocked: true })).toEqual({ kind: "blocked", message: LEGACY_DIAGNOSTIC_COPY.blocked.response });
  expect(legacyDiagnosticResponseDisplay({ ...run, done: false, probeCount: 2, sectionTransition: true })).toMatchObject({
    kind: "question",
    transition: "Section suivante : Compréhension écrite",
  });
  const continuation = legacyDiagnosticResponseDisplay({ item: run.item, progress, probeCount: 2, sectionTransition: false });
  expect(JSON.stringify(continuation)).not.toContain("au moins 0 réponses");
  expect(continuation).toMatchObject({ kind: "question", display: { question: { meta: "Question 3 · difficulté ajustée en continu" } } });
});
