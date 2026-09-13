import { EXERCISE_CONTROL_COPY } from "@/lib/content/exercise-control-copy";
import { splitExercisePrompt } from "@/lib/content/exercise-prompt";
import type { CoachingResult } from "@/lib/content/language-coaching";
import type { getNodePractice } from "@/lib/db/practice";
import { buildHintLadder } from "@/lib/practice/hints";
import { workedExample } from "@/lib/practice/scaffolding";
import {
  PRACTICE_BASE_XP,
  PRACTICE_PERFECT_BONUS_XP,
  plannedExerciseCount,
} from "@/lib/practice/session";

type Practice = Awaited<ReturnType<typeof getNodePractice>>;
type Remediation = { nodeId: string; label: string } | null;

export const PRACTICE_PLAYER_COPY = {
  empty: "Aucun exercice approuvé pour cette compétence.",
  lessonHeading: "Une idée, puis la pratique.",
  pattern: "Repère",
  exceptions: "Exceptions à retenir",
  exerciseHeading: "À toi de jouer",
  adaptedDifficulty: "Difficulté adaptée à ton niveau",
  readingRubric: "Réponds avec tes mots : ce sont les idées et leur lien avec le texte qui comptent.",
  correct: "Bonne réponse.",
  incorrect: "Pas encore — essaie avec l’indice.",
  rule: "Voir la règle",
  conjugationTables: "Tables de conjugaison",
  remediationPrefix: "Après cette session, révise aussi",
  retry: "Réessayer avec un indice",
  finish: "Terminer la leçon",
  next: "Exercice suivant",
  checking: "Vérification…",
  validateCorrection: "Valider la correction",
  validate: "Valider",
  hint: "Indice",
  lessonDone: "Leçon terminée",
  timeDone: "Temps écoulé",
  stopped: "On s’arrête ici pour aujourd’hui",
  returnToProgram: "Retour au programme",
  startError: "La leçon n’a pas pu démarrer.",
  lessonMissingError: "Leçon introuvable.",
  lessonNeedsExercisesError: "Cette leçon attend encore trois exercices approuvés distincts.",
  finishError: "La leçon n’a pas pu être terminée.",
  answerError: "La réponse n’a pas pu être enregistrée.",
  inactiveError: "Cette leçon n’est plus active.",
  exerciseMissingError: "Exercice introuvable.",
  expiredError: "Les sept minutes sont écoulées.",
  choiceLabel: "Choix de réponse",
  answerLabel: "Ta réponse",
  errorWordLabel: "Mot à corriger",
  orderingLabel: "Éléments à remettre dans l’ordre",
  justifiedForm: "1 · La bonne forme",
  justifiedRule: "2 · La règle qui le prouve",
  justificationLabel: "Justification",
  combinePlaceholder: "Une seule phrase qui garde toutes les informations.",
  rewritePlaceholder: "Réécris la phrase en suivant la consigne.",
  coachingLabel: "Un conseil pour ta phrase",
  coachingClarity: "Une formulation plus claire",
  coachingLanguage: "Un petit point de langue",
  coachingNothing: "Ta formulation convient : rien d’utile à changer ici.",
  coachingUnavailable: "Le conseil est indisponible pour le moment. Cela ne change pas ta bonne réponse.",
  coachingBusy: "Recherche d’un conseil…",
  coachingAction: "Améliorer ma phrase",
} as const;

export const practiceExercisePosition = (index: number, total: number) =>
  `Exercice ${index + 1} sur ${total}`;

export const practiceStartLabel = (total: number) =>
  `Commencer les ${total || ""} exercices`;

export const practiceXpLabel = () =>
  `+${PRACTICE_BASE_XP} XP · +${PRACTICE_PERFECT_BONUS_XP} sans faute`;

export const practiceRemediationSentence = (label: string) =>
  `${PRACTICE_PLAYER_COPY.remediationPrefix} ${label}.`;

export function practiceFeedbackDisplay(input: {
  correct: boolean;
  feedbackFr: string | null;
  remediation: Remediation;
  conjugation: boolean;
}) {
  return {
    outcome: input.correct ? PRACTICE_PLAYER_COPY.correct : PRACTICE_PLAYER_COPY.incorrect,
    feedback: input.feedbackFr,
    references: [
      PRACTICE_PLAYER_COPY.rule,
      ...(input.conjugation ? [PRACTICE_PLAYER_COPY.conjugationTables] : []),
    ],
    remediation: input.remediation
      ? {
          label: input.remediation.label,
          sentence: practiceRemediationSentence(input.remediation.label),
        }
      : null,
    control: input.correct ? PRACTICE_PLAYER_COPY.next : PRACTICE_PLAYER_COPY.retry,
  };
}

export function practiceCompletionDisplay(input: {
  completed: boolean;
  exercisesCompleted: number;
  totalXp: number;
  bonusXp: number;
}) {
  const count = Math.max(0, Math.floor(input.exercisesCompleted));
  return {
    eyebrow: input.completed ? PRACTICE_PLAYER_COPY.lessonDone : PRACTICE_PLAYER_COPY.timeDone,
    heading: input.completed ? `+${input.totalXp} XP` : PRACTICE_PLAYER_COPY.stopped,
    summary: input.completed
      ? `${count} exercices terminés. La prochaine révision sera proposée au bon moment.`
      : `${count} exercice${count === 1 ? "" : "s"} terminé${count === 1 ? "" : "s"}. La session reste limitée à sept minutes.`,
    bonus: input.bonusXp > 0 ? `Sans faute du premier coup · +${input.bonusXp} XP bonus` : null,
    control: PRACTICE_PLAYER_COPY.returnToProgram,
  };
}

export function practiceLanguageCoachingDisplay(input: {
  result: CoachingResult;
  requested: boolean;
}) {
  const tip = input.result.tip;
  return {
    heading: tip
      ? tip.kind === "clarity" ? PRACTICE_PLAYER_COPY.coachingClarity : PRACTICE_PLAYER_COPY.coachingLanguage
      : null,
    correction: tip ? `« ${tip.before} » → « ${tip.after} »` : null,
    explanation: tip?.explanationFr ?? null,
    status: !tip && input.requested
      ? input.result.available ? PRACTICE_PLAYER_COPY.coachingNothing : PRACTICE_PLAYER_COPY.coachingUnavailable
      : null,
    control: PRACTICE_PLAYER_COPY.coachingAction,
  };
}

/** Keep the error surface finite: infrastructure messages are not learner copy. */
export function practicePlayerError(kind: "start" | "finish" | "answer", caught: unknown): string {
  if (caught instanceof Error) {
    const allowed: readonly string[] = kind === "start"
      ? [PRACTICE_PLAYER_COPY.lessonMissingError, PRACTICE_PLAYER_COPY.lessonNeedsExercisesError]
      : kind === "answer"
        ? [PRACTICE_PLAYER_COPY.expiredError, PRACTICE_PLAYER_COPY.inactiveError, PRACTICE_PLAYER_COPY.exerciseMissingError]
        : [];
    if (allowed.includes(caught.message)) return caught.message;
  }
  if (kind === "start") return PRACTICE_PLAYER_COPY.startError;
  if (kind === "finish") return PRACTICE_PLAYER_COPY.finishError;
  return PRACTICE_PLAYER_COPY.answerError;
}

const moveLabel = (direction: "Monter" | "Descendre", token: string) => `${direction} « ${token} »`;

// Mirrors the browser widget's deterministic initial order. The parity test
// fails if either implementation changes without updating the capture.
function initialOrdering(tokens: string[], seed: string): string[] {
  let state = 2166136261;
  for (const char of seed) {
    state ^= char.codePointAt(0)!;
    state = Math.imul(state, 16777619) >>> 0;
  }
  const out = [...tokens];
  for (let index = out.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    const target = state % (index + 1);
    [out[index], out[target]] = [out[target], out[index]];
  }
  if (out.length > 1 && out.every((token, index) => token === tokens[index])) {
    [out[0], out[1]] = [out[1], out[0]];
  }
  return out;
}

/** Exact strings and string-bearing browser props available to the practice
 * player before render. This audit payload does not certify novelty. */
export function practicePlayerDisplay(practice: Practice) {
  const total = plannedExerciseCount(practice.items.length);
  const items = practice.items.slice(0, total).map((item, index) => {
    const tokens = Array.isArray(item.validatorConfig?.tokens)
      ? item.validatorConfig.tokens.filter((token): token is string => typeof token === "string")
      : [];
    const order = initialOrdering(tokens, item.id);
    return {
      position: practiceExercisePosition(index, total),
      prompt: splitExercisePrompt(item.promptFr),
      instructionsFr: item.instructionsFr,
      support: [
        ...buildHintLadder({
          nodeLabel: practice.node.label,
          nodeDescription: practice.node.description,
          validatorType: item.validatorType,
          validatorConfig: item.validatorConfig,
          choiceCount: item.choices.length,
        }),
        workedExample(practice.node.label, item.validatorType),
      ],
      widget: {
        readingRubric: item.validatorConfig?.readingRubric ? PRACTICE_PLAYER_COPY.readingRubric : null,
        order,
        orderedSentence: order.join(" "),
        moveLabels: tokens.flatMap((token) => [moveLabel("Monter", token), moveLabel("Descendre", token)]),
        rules: Array.isArray(item.validatorConfig?.rules) ? item.validatorConfig.rules : [],
        sources: item.responseType === "combine"
          ? item.validatorConfig?.sentences ?? []
          : item.responseType === "transform" ? item.validatorConfig?.sources ?? [] : [],
      },
    };
  });
  const counts = Array.from({ length: total + 1 }, (_, count) => count);
  return {
    copy: PRACTICE_PLAYER_COPY,
    sharedExerciseCopy: EXERCISE_CONTROL_COPY,
    start: practiceStartLabel(total),
    xp: practiceXpLabel(),
    items,
    completionVariants: [
      ...counts.map((exercisesCompleted) => practiceCompletionDisplay({ completed: false, exercisesCompleted, totalXp: 0, bonusXp: 0 })),
      ...counts.flatMap((exercisesCompleted) => [
        practiceCompletionDisplay({ completed: true, exercisesCompleted, totalXp: PRACTICE_BASE_XP, bonusXp: 0 }),
        practiceCompletionDisplay({ completed: true, exercisesCompleted, totalXp: PRACTICE_BASE_XP + PRACTICE_PERFECT_BONUS_XP, bonusXp: PRACTICE_PERFECT_BONUS_XP }),
      ]),
    ],
  };
}
