import { expect, it } from "vitest";
import { deliveredTextFragments } from "./delivery-journal";
import {
  WRITING_FEEDBACK_COPY,
  writingEvaluationDisplay,
  writingFeedbackDisplay,
  type WritingEvaluationDisplayInput,
} from "./writing-feedback-display";

const evaluation: WritingEvaluationDisplayInput = {
  revision_number: 2,
  submitted_text: "Les racine protège les poissons.",
  rubric: {
    score: 72,
    rubric: { content: 80, structure: null, language: 60 },
    feedbackFr: "Accorde le sujet et le verbe.",
  },
  annotations: [{ offset: 4, length: 6, explanationFr: "Le nom est pluriel.", replacements: ["racines"] }],
  revision_plan: [{ nodeId: "node", nodeKey: "accord", nodeLabel: "Accord sujet-verbe", explanationFr: "Repère le sujet.", errorCount: 1 }],
  degraded: true,
};

it("projects exact annotation, rubric, plan and remaining-revision strings", () => {
  const display = writingEvaluationDisplay(evaluation, 2);
  expect(display).toMatchObject({
    rubricScore: "Score de rubrique : 72/100 · contrôle grammatical indisponible, rubrique conservée",
    annotations: [{ excerpt: "racine", quotedExcerpt: "« racine »", explanation: "Le nom est pluriel.", suggestions: "Suggestions : racines" }],
    changedHeading: "Ce qui a changé (révision 2)",
    dimensions: [
      { label: "Contenu", value: "80/100" },
      { label: "Structure", value: "Non évalué" },
      { label: "Langue", value: "60/100" },
    ],
    priority: { text: "Une seule priorité pour cette passe : Accord sujet-verbe. Repère le sujet." },
    plans: [{ summary: "Accord sujet-verbe · 1 point(s)", train: "S’entraîner", viewRule: "Voir la règle" }],
    revisionHeading: "Corrige et renvoie (1 révision(s) restante(s))",
  });
});

it("skips overlapping annotations exactly as the browser does", () => {
  const display = writingEvaluationDisplay({
    ...evaluation,
    annotations: [
      { offset: 4, length: 6, explanationFr: "Premier." },
      { offset: 5, length: 3, explanationFr: "Chevauchement." },
    ],
  }, 0);
  expect(display.annotations).toHaveLength(1);
  expect(deliveredTextFragments(display)).not.toContain("Chevauchement.");
});

it("projects teacher feedback and the fixed revision error without claiming an empty panel", () => {
  const display = writingFeedbackDisplay({
    originalText: evaluation.submitted_text,
    evaluations: [evaluation],
    teacherScore: { score: 88, commentFr: "Bonne progression.", at: null },
  });
  expect(display?.teacherScore?.text).toBe("Note de ton enseignant : 88/100. Bonne progression.");
  expect(display?.accentControls.label).toBe("Caractères français");
  expect(deliveredTextFragments(display)).toContain(WRITING_FEEDBACK_COPY.revisionError);
  expect(writingFeedbackDisplay(null)).toBeNull();
});
