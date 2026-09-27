type Annotation = { offset: number; length: number; explanationFr: string; replacements?: string[] };
type RevisionPlan = { nodeId: string; nodeKey?: string | null; nodeLabel: string; explanationFr: string; errorCount: number };
export type WritingEvaluationDisplayInput = {
  revision_number: number;
  submitted_text: string;
  rubric: {
    score?: number;
    rubric?: { content: number | null; structure: number | null; language: number | null };
    feedbackFr?: string;
  };
  annotations: Annotation[];
  revision_plan: RevisionPlan[];
  degraded: boolean;
};
export type WritingFeedbackDisplayInput = {
  originalText: string;
  evaluations: WritingEvaluationDisplayInput[];
  teacherScore?: { score: number; commentFr: string | null; at: string | null } | null;
};

export const WRITING_FEEDBACK_COPY = {
  heading: "Ton résumé annoté",
  rubricScore: "Score de rubrique :",
  unavailableScore: "—",
  degraded: "contrôle grammatical indisponible, rubrique conservée",
  teacherScore: "Note de ton enseignant :",
  annotationsLabel: "Explications des corrections",
  suggestions: "Suggestions :",
  changed: "Ce qui a changé",
  content: "Contenu",
  structure: "Structure",
  language: "Langue",
  notEvaluated: "Non évalué",
  revisionPlan: "Plan de révision",
  onePriority: "Une seule priorité pour cette passe :",
  train: "S’entraîner",
  viewRule: "Voir la règle",
  correctAndResend: "Corrige et renvoie",
  analyze: "Analyse…",
  sendRevision: "Envoyer ma révision",
  revisionError: "La révision n’a pas pu être enregistrée.",
} as const;

const dimension = (label: string, value: number | null | undefined) => ({
  label,
  value: value == null ? WRITING_FEEDBACK_COPY.notEvaluated : `${value}/100`,
});

export function writingEvaluationDisplay(evaluation: WritingEvaluationDisplayInput, revisions: number) {
  const priority = evaluation.revision_plan[0] ?? null;
  const revised = revisions >= 3;
  const score = evaluation.rubric.score ?? WRITING_FEEDBACK_COPY.unavailableScore;
  let cursor = 0;
  const annotations = [...evaluation.annotations].sort((a, b) => a.offset - b.offset).flatMap((annotation) => {
    if (annotation.offset < cursor) return [];
    const excerpt = evaluation.submitted_text.slice(annotation.offset, annotation.offset + annotation.length);
    cursor = annotation.offset + annotation.length;
    return [{
      offset: annotation.offset,
      length: annotation.length,
      excerpt,
      quotedExcerpt: `« ${excerpt} »`,
      explanation: annotation.explanationFr,
      suggestions: annotation.replacements?.length
        ? `${WRITING_FEEDBACK_COPY.suggestions} ${annotation.replacements.join(", ")}`
        : null,
    }];
  });
  return {
    heading: WRITING_FEEDBACK_COPY.heading,
    rubricScore: `${WRITING_FEEDBACK_COPY.rubricScore} ${score}/100${evaluation.degraded ? ` · ${WRITING_FEEDBACK_COPY.degraded}` : ""}`,
    annotationsLabel: WRITING_FEEDBACK_COPY.annotationsLabel,
    annotations,
    changedHeading: evaluation.revision_number > 0
      ? `${WRITING_FEEDBACK_COPY.changed} (révision ${evaluation.revision_number})`
      : null,
    dimensions: [
      dimension(WRITING_FEEDBACK_COPY.content, evaluation.rubric.rubric?.content),
      dimension(WRITING_FEEDBACK_COPY.structure, evaluation.rubric.rubric?.structure),
      dimension(WRITING_FEEDBACK_COPY.language, evaluation.rubric.rubric?.language),
    ],
    planHeading: evaluation.revision_plan.length ? WRITING_FEEDBACK_COPY.revisionPlan : null,
    priority: priority && !revised ? {
      prefix: WRITING_FEEDBACK_COPY.onePriority,
      nodeLabel: priority.nodeLabel,
      explanation: priority.explanationFr,
      text: `${WRITING_FEEDBACK_COPY.onePriority} ${priority.nodeLabel}. ${priority.explanationFr}`,
    } : null,
    plans: evaluation.revision_plan.map((plan) => ({
      ...plan,
      summary: `${plan.nodeLabel} · ${plan.errorCount} point(s)`,
      train: WRITING_FEEDBACK_COPY.train,
      viewRule: plan.nodeKey ? WRITING_FEEDBACK_COPY.viewRule : null,
    })),
    revisionHeading: !revised
      ? `${WRITING_FEEDBACK_COPY.correctAndResend} (${3 - revisions} révision(s) restante(s))`
      : null,
    controls: !revised ? [WRITING_FEEDBACK_COPY.analyze, WRITING_FEEDBACK_COPY.sendRevision] : [],
    error: WRITING_FEEDBACK_COPY.revisionError,
  };
}

export function writingFeedbackDisplay(feedback: WritingFeedbackDisplayInput | null) {
  if (!feedback?.evaluations.length) return null;
  const revisions = feedback.evaluations.filter((evaluation) => evaluation.revision_number > 0).length;
  const evaluation = feedback.evaluations.at(-1)!;
  return {
    current: writingEvaluationDisplay(evaluation, revisions),
    accentControls: {
      label: EXERCISE_CONTROL_COPY.accentsLabel,
      characters: EXERCISE_CONTROL_COPY.accents,
    },
    teacherScore: feedback.teacherScore ? {
      label: `${WRITING_FEEDBACK_COPY.teacherScore} ${feedback.teacherScore.score}/100.`,
      comment: feedback.teacherScore.commentFr,
      text: `${WRITING_FEEDBACK_COPY.teacherScore} ${feedback.teacherScore.score}/100.${feedback.teacherScore.commentFr ? ` ${feedback.teacherScore.commentFr}` : ""}`,
    } : null,
  };
}
import { EXERCISE_CONTROL_COPY } from "@/lib/content/exercise-control-copy";
