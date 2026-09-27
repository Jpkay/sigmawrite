import { EXERCISE_CONTROL_COPY } from "@/lib/content/exercise-control-copy";
import type { ProductionRubric } from "@/lib/scoring/production-ai";

export type ProductionTaskDisplayInput = {
  minimumWords: number;
  maximumWords: number;
};

export type ProductionResultDisplayInput = {
  demonstrated: boolean;
  feedback: string;
  matchedForms: string[];
  rubric: ProductionRubric | null;
};

export const PRODUCTION_PLAYER_COPY = {
  eyebrow: "Production autonome",
  masteryRequirement: "Deux textes réussis à des moments différents sont nécessaires pour confirmer la maîtrise.",
  genreLabel: "Genre du texte",
  placeholder: "Écris ton paragraphe ici…",
  checking: "Vérification…",
  submit: "Faire vérifier mon texte",
  recorded: "Production enregistrée",
  demonstrated: "Preuve autonome réussie",
  revise: "Encore un ajustement",
  forms: "Formes repérées :",
  rubric: "Rubrique",
  content: "Contenu",
  structure: "Structure",
  language: "Langue",
  priority: "Ta priorité :",
  deterministic: "Rubrique calculée sans modèle.",
  retry: "Écrire un nouveau texte",
  returnToProgram: "Retour au programme",
  genericError: "Le texte n’a pas pu être évalué.",
  duplicateError: "Ce texte a déjà été évalué. Écris un nouveau paragraphe pour démontrer la maîtrise une autre fois.",
  unavailableError: "Cette production autonome n’est pas encore disponible.",
  unsupportedError: "Cette production autonome n’est pas encore vérifiable automatiquement.",
  noPathError: "Aucun parcours actif.",
  missingScore: "—",
} as const;

export const productionWordCount = (words: number) => `${words} mot${words === 1 ? "" : "s"}`;
export const productionObjective = (task: ProductionTaskDisplayInput) =>
  `Objectif : ${task.minimumWords}–${task.maximumWords}`;
export const productionRangeHelp = (task: ProductionTaskDisplayInput) =>
  `Écris entre ${task.minimumWords} et ${task.maximumWords} mots.`;
export const productionLengthError = (task: ProductionTaskDisplayInput) =>
  `${productionRangeHelp(task).slice(0, -1)} pour que la production soit vérifiable.`;

export function productionTaskDisplay(task: ProductionTaskDisplayInput) {
  return {
    copy: PRODUCTION_PLAYER_COPY,
    accentControls: {
      label: EXERCISE_CONTROL_COPY.accentsLabel,
      characters: EXERCISE_CONTROL_COPY.accents,
    },
    initialWordCount: productionWordCount(0),
    objective: productionObjective(task),
    rangeHelp: productionRangeHelp(task),
    lengthError: productionLengthError(task),
  };
}

export function productionResultDisplay(result: ProductionResultDisplayInput) {
  const rubric = result.rubric;
  return {
    eyebrow: PRODUCTION_PLAYER_COPY.recorded,
    heading: result.demonstrated ? PRODUCTION_PLAYER_COPY.demonstrated : PRODUCTION_PLAYER_COPY.revise,
    feedback: result.feedback,
    forms: result.matchedForms.length ? {
      label: PRODUCTION_PLAYER_COPY.forms,
      values: result.matchedForms.join(", "),
      text: `${PRODUCTION_PLAYER_COPY.forms} ${result.matchedForms.join(", ")}`,
    } : null,
    rubric: rubric ? {
      label: PRODUCTION_PLAYER_COPY.rubric,
      score: String(rubric.score),
      scoreSuffix: " / 100",
      scoreText: `${rubric.score} / 100`,
      dimensions: [
        [PRODUCTION_PLAYER_COPY.content, rubric.content],
        [PRODUCTION_PLAYER_COPY.structure, rubric.structure],
        [PRODUCTION_PLAYER_COPY.language, rubric.language],
      ].map(([label, value]) => ({
        label: String(label),
        value: value == null ? PRODUCTION_PLAYER_COPY.missingScore : `${value}/100`,
      })),
      priorityLabel: PRODUCTION_PLAYER_COPY.priority,
      priorityText: rubric.priorityFr,
      priority: `${PRODUCTION_PLAYER_COPY.priority} ${rubric.priorityFr}`,
      deterministic: rubric.source === "deterministic" ? PRODUCTION_PLAYER_COPY.deterministic : null,
    } : null,
    controls: [
      ...(!result.demonstrated ? [PRODUCTION_PLAYER_COPY.retry] : []),
      PRODUCTION_PLAYER_COPY.returnToProgram,
    ],
  };
}

/** Only server-authored, enumerated errors may become learner-visible. */
export function productionPlayerError(caught: unknown, task: ProductionTaskDisplayInput): string {
  if (caught instanceof Error) {
    const allowed: readonly string[] = [
      productionLengthError(task),
      PRODUCTION_PLAYER_COPY.duplicateError,
      PRODUCTION_PLAYER_COPY.unavailableError,
      PRODUCTION_PLAYER_COPY.unsupportedError,
      PRODUCTION_PLAYER_COPY.noPathError,
    ];
    if (allowed.includes(caught.message)) return caught.message;
  }
  return PRODUCTION_PLAYER_COPY.genericError;
}
