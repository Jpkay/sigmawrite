import { EXERCISE_CONTROL_COPY } from "@/lib/content/exercise-control-copy";
import type { ErrorCategory } from "@/lib/dictation/classify";
import type { DictationMode } from "@/lib/dictation/modes";

export type DictationCatalogDisplayInput = {
  id: string;
  title: string;
  kind: DictationMode;
  wordCount: number;
  gradeMin: number;
  gradeMax: number;
  focus: string | null;
  estimatedMinutes: number;
  lastScore: number | null;
  attempts: number;
};

export type DictationSessionDisplayInput = {
  title: string;
  mode: DictationMode;
  focus: string | null;
  wordCount: number;
  audioMode: "server" | "browser";
  segments: {
    index: number;
    template: null | {
      tokens: Array<string | null>;
      blanks: Array<{ index: number; choices?: string[] }>;
    };
  }[];
};

export type DictationResultDisplayInput = {
  score: number;
  xp: null | { xp: number; goalCompleted: boolean };
  profile: Record<ErrorCategory, number>;
  categoryLabels: Record<ErrorCategory, string>;
  segments: {
    index: number;
    expected: string;
    errors: Array<{
      segment: number;
      actual: string | null;
      expected: string;
      category: ErrorCategory;
      nodeKey: string;
      explanationFr: string;
    }>;
  }[];
  justification: Array<{
    errorIndex: number;
    options: Array<{ key: string; label: string }>;
  }>;
};

export const DICTATION_KIND_LABELS: Record<DictationMode, string> = {
  flash: "Dictée flash",
  trous: "Dictée à trous",
  choix: "Dictée à choix",
  negociee: "Dictée négociée",
  brevet: "Dictée type brevet",
};

export const DICTATION_MODE_LABELS: Record<DictationMode, string> = {
  flash: "flash",
  trous: "à trous",
  choix: "à choix",
  negociee: "négociée",
  brevet: "type brevet",
};

export const DICTATION_GRADE_LABELS: Record<number, string> = {
  4: "CM1",
  5: "CM2",
  6: "6e",
  7: "5e",
  8: "4e",
  9: "3e",
};

export const DICTATION_COPY = {
  catalogLoading: "Chargement…",
  catalogEmpty: "Aucune dictée publiée pour l’instant. Elles arrivent dès qu’un enseignant les a relues.",
  catalogError: "Chargement impossible.",
  lastScore: "Dernier score :",
  notAttempted: "Pas encore faite",
  start: "Commencer",
  retry: "Refaire",
  preparing: "Préparation de la dictée…",
  unavailable: "Dictée indisponible.",
  unavailableAction: "Cette dictée n’est pas disponible.",
  alreadyFinished: "Cette dictée est déjà terminée. Relance-la pour recommencer.",
  audioUnavailable: "Audio de la dictée indisponible. Réessaie.",
  startError: "La dictée n’a pas pu démarrer.",
  attemptMissing: "Tentative introuvable.",
  safetyError: "La vérification de sécurité a échoué. Réessaie.",
  rateLimit: "Tu vas un peu vite. Fais une courte pause puis réessaie.",
  dailyLimit: "La limite quotidienne est atteinte. Tu pourras reprendre demain.",
  rejectedAnswer: "Ta réponse n'a pas pu être enregistrée.",
  scoringError: "La dictée n’a pas pu être corrigée.",
  justificationError: "Les justifications n’ont pas pu être enregistrées.",
  allDictations: "Toutes les dictées",
  quit: "Quitter",
  listenAll: "Écouter en entier",
  beginWriting: "Commencer à écrire",
  browserVoice: "Voix de secours du navigateur (environnement de développement).",
  introSteps: [
    "Écoute la dictée en entier sans écrire.",
    "Écris chaque segment ; tu peux le réécouter autant que nécessaire.",
    "Relis, puis valide. Tu justifieras chaque correction avant de la voir.",
  ],
  replaySegment: "Réécouter le segment",
  transcriptPlaceholder: "Écris exactement ce que tu entends, avec la ponctuation.",
  previous: "Précédent",
  nextSegment: "Segment suivant",
  correcting: "Correction…",
  validate: "Valider ma dictée",
  negotiation: "Dictée négociée",
  negotiationHelp: "Pour chaque mot signalé, choisis la règle qui explique l’erreur. Une justification correcte compte comme une réussite aidée.",
  saving: "Enregistrement…",
  seeCorrection: "Voir la correction",
  score: "Score",
  clean: "Sans faute. Bravo.",
  exact: "Exact.",
  missingWord: "(mot manquant)",
  omitted: "(oublié)",
  extra: "(en trop)",
  seeRule: "Voir la règle",
  otherDictations: "Autres dictées",
  returnToPlan: "Retour au plan du jour",
} as const;

export const dictationGradeRange = (minimum: number, maximum: number) =>
  minimum === maximum
    ? (DICTATION_GRADE_LABELS[minimum] ?? String(minimum))
    : `${DICTATION_GRADE_LABELS[minimum] ?? minimum} – ${DICTATION_GRADE_LABELS[maximum] ?? maximum}`;

export const dictationCatalogMeta = (row: Pick<DictationCatalogDisplayInput, "wordCount" | "estimatedMinutes">) =>
  `${row.wordCount} mots · ~${row.estimatedMinutes} min`;

export const dictationLastScore = (score: number) => `${DICTATION_COPY.lastScore} ${score}/10`;

export function dictationCatalogDisplay(rows: DictationCatalogDisplayInput[]) {
  return {
    copy: {
      loading: DICTATION_COPY.catalogLoading,
      empty: DICTATION_COPY.catalogEmpty,
      error: DICTATION_COPY.catalogError,
    },
    entries: rows.map((row) => ({
      id: row.id,
      kind: DICTATION_KIND_LABELS[row.kind],
      grade: dictationGradeRange(row.gradeMin, row.gradeMax),
      meta: dictationCatalogMeta(row),
      title: row.title,
      focus: row.focus,
      score: row.lastScore == null ? DICTATION_COPY.notAttempted : dictationLastScore(row.lastScore),
      control: row.attempts > 0 ? DICTATION_COPY.retry : DICTATION_COPY.start,
    })),
  };
}

export const dictationHeaderEyebrow = (mode: DictationMode) =>
  `Dictée · ${DICTATION_MODE_LABELS[mode]}`;

export const dictationIntro = (session: Pick<DictationSessionDisplayInput, "wordCount" | "focus">, segmentCount: number) =>
  `${session.wordCount} mots en ${segmentCount} segments.${session.focus ? ` Point travaillé : ${session.focus.toLocaleLowerCase("fr")}.` : ""}`;

export const dictationSegmentPosition = (position: number, total: number) =>
  `Segment ${position + 1} / ${total}`;

export const dictationReplayCount = (replays: number) => `${replays} réécoute(s)`;
export const dictationSegmentLabel = (position: number) => `Segment ${position + 1}`;
export const dictationBlankLabel = (position: number) => `Mot ${position + 1}`;
export const dictationRuleLabel = (position: number) => `Règle pour le mot ${position + 1}`;
export const dictationCorrectionHeading = (count: number) =>
  `${count} correction(s) à justifier avant de voir la réponse`;

export function dictationSessionDisplay(session: DictationSessionDisplayInput) {
  const total = session.segments.length;
  return {
    copy: DICTATION_COPY,
    accentControls: {
      label: EXERCISE_CONTROL_COPY.accentsLabel,
      characters: EXERCISE_CONTROL_COPY.accents,
    },
    eyebrow: dictationHeaderEyebrow(session.mode),
    title: session.title,
    intro: dictationIntro(session, total),
    introSteps: DICTATION_COPY.introSteps,
    browserVoice: session.audioMode === "browser" ? DICTATION_COPY.browserVoice : null,
    segments: session.segments.map((entry, index) => ({
      position: dictationSegmentPosition(index, total),
      inputLabel: dictationSegmentLabel(index),
      blankLabels: entry.template?.blanks.map((blank) => dictationBlankLabel(blank.index)) ?? [],
      choices: entry.template?.blanks.flatMap((blank) => blank.choices ?? []) ?? [],
    })),
    initialReplayCount: dictationReplayCount(0),
  };
}

function flattenedErrors(result: DictationResultDisplayInput) {
  return result.segments.flatMap((segment) => segment.errors);
}

export function dictationResultDisplay(result: DictationResultDisplayInput) {
  const errors = flattenedErrors(result);
  const categories = (Object.keys(result.categoryLabels) as ErrorCategory[])
    .filter((category) => result.profile[category] > 0)
    .map((category) => ({
      category,
      label: result.categoryLabels[category],
      count: result.profile[category],
      text: `${result.categoryLabels[category]} · ${result.profile[category]}`,
    }));
  return {
    negotiation: result.justification.length ? {
      eyebrow: DICTATION_COPY.negotiation,
      heading: dictationCorrectionHeading(errors.length),
      help: DICTATION_COPY.negotiationHelp,
      corrections: result.justification.map((entry) => {
        const item = errors[entry.errorIndex];
        return {
          errorIndex: entry.errorIndex,
          prompt: `${dictationSegmentLabel(item.segment)} · tu as écrit « ${item.actual ?? DICTATION_COPY.missingWord} »`,
          ruleLabel: dictationRuleLabel(entry.errorIndex),
          options: entry.options.map((option) => option.label),
        };
      }),
      controls: [DICTATION_COPY.saving, DICTATION_COPY.seeCorrection],
    } : null,
    result: {
      scoreLabel: DICTATION_COPY.score,
      score: String(result.score),
      scoreSuffix: " / 10",
      scoreText: `${result.score} / 10`,
      xp: result.xp ? `+${result.xp.xp} XP${result.xp.goalCompleted ? " · objectif du jour atteint" : ""}` : null,
      categories,
      clean: categories.length ? null : DICTATION_COPY.clean,
      segments: result.segments.map((segment) => ({
        label: dictationSegmentLabel(segment.index),
        expected: segment.expected,
        exact: segment.errors.length ? null : DICTATION_COPY.exact,
        errors: segment.errors.map((error) => ({
          replacement: `${error.actual ?? DICTATION_COPY.omitted} → ${error.expected || DICTATION_COPY.extra}`,
          category: result.categoryLabels[error.category],
          explanation: error.explanationFr,
          ruleControl: DICTATION_COPY.seeRule,
          ruleHref: `/student/reference/regle/${encodeURIComponent(error.nodeKey)}`,
        })),
      })),
      controls: [DICTATION_COPY.otherDictations, DICTATION_COPY.retry, DICTATION_COPY.returnToPlan],
    },
  };
}

export const dictationJustificationOutcomeDisplay = (outcome: { correct: number; total: number }) => ({
  label: "Justifications :",
  correct: outcome.correct,
  total: outcome.total,
  text: `Justifications : ${outcome.correct} / ${outcome.total} règles bien identifiées.`,
});

export function dictationCatalogError(): string {
  return DICTATION_COPY.catalogError;
}

/** Only server-authored, enumerated failures may become learner-visible. */
export function dictationPlayerError(stage: "start" | "score" | "justify", caught: unknown): string {
  if (caught instanceof Error) {
    const allowed: readonly string[] = stage === "start"
      ? [DICTATION_COPY.unavailableAction, DICTATION_COPY.alreadyFinished, DICTATION_COPY.audioUnavailable]
      : stage === "score"
        ? [DICTATION_COPY.attemptMissing, DICTATION_COPY.unavailableAction, DICTATION_COPY.safetyError, DICTATION_COPY.rateLimit, DICTATION_COPY.dailyLimit, DICTATION_COPY.rejectedAnswer]
        : [DICTATION_COPY.attemptMissing];
    if (allowed.includes(caught.message)) return caught.message;
  }
  return stage === "start"
    ? DICTATION_COPY.startError
    : stage === "score"
      ? DICTATION_COPY.scoringError
      : DICTATION_COPY.justificationError;
}
