import { EXERCISE_CONTROL_COPY } from "@/lib/content/exercise-control-copy";
import { splitExercisePrompt } from "@/lib/content/exercise-prompt";
import { shuffleChoices } from "@/lib/content/choice-order";
import type { DiagnosticLearningPathStep } from "@/lib/diagnostic/learning-path";
import type { LiveDiagnosticItem } from "@/lib/diagnostic/live";
import {
  DIAGNOSTIC_SECTIONS,
  diagnosticSection,
  type DiagnosticSectionKey,
  type DiagnosticSectionProgress,
} from "@/lib/diagnostic/protocol";
import type { FrontierReport } from "@/lib/diagnostic/report";
import { DIAGNOSTIC_START_FAILED_MESSAGE } from "@/lib/diagnostic/startup";

export const LEGACY_DIAGNOSTIC_COPY = {
  completed: {
    eyebrow: "Diagnostic terminé",
    title: "Ton parcours est prêt",
    description: "Les résultats sont organisés par compétence et les prérequis viennent avant ce qu’ils permettent d’apprendre.",
    firstStepsEyebrow: "Premières étapes",
    foundationsFirst: "Fondations d’abord",
    startPath: "Commencer mon parcours",
    viewMap: "Voir toute ma carte",
    retake: "Repasser le diagnostic",
  },
  outcomes: {
    mastered: "Maîtrisé",
    fragile: "À consolider",
    missing: "À construire",
    unknown: "À vérifier",
  },
  loading: {
    title: "Diagnostic adaptatif",
    description: "Préparation des quatre sections…",
  },
  blocked: {
    title: "Diagnostic en pause",
    description: "Tes réponses sont enregistrées, mais cette section ne dispose pas encore d’assez de questions validées pour conclure sans deviner.",
    help: "Tu n’as rien à refaire maintenant. Un adulte ou l’équipe de la plateforme doit compléter la banque avant que tu reprennes.",
    settings: "Ouvrir mes paramètres",
    response: "Cette section n’a pas encore assez de questions validées pour produire un résultat fiable.",
  },
  unavailable: {
    title: "Le diagnostic ne peut pas encore démarrer",
    description: "Tu n’as pas besoin de recommencer ton inscription.",
    retry: "Réessayer",
    fallback: DIAGNOSTIC_START_FAILED_MESSAGE,
  },
  run: {
    resumed: "Diagnostic repris",
    initial: "Diagnostic initial",
    title: "Trouvons ton point de départ",
    sectionComplete: "Section terminée",
    adaptiveQuestion: "Question adaptative",
    answerLabel: "Ta réponse",
    answerPlaceholder: "Écris ta réponse…",
    analyzing: "Analyse…",
    validate: "Valider",
    correct: "Bonne réponse.",
    informative: "Cette réponse affine le niveau de cette compétence.",
    why: "Pourquoi cette question ?",
    responsesInSection: "Réponses dans cette section",
    testedDirectly: "Compétences testées directement",
    confirmed: "Compétences confirmées",
    submissionFallback: "Ta réponse n’a pas pu être évaluée. Réessaie.",
    submissionError: "Ta réponse n’a pas pu être enregistrée. Réessaie.",
  },
  pilot: {
    label: "Essai expérimental.",
    active: "Les questions ne sont pas encore publiées. Tes réponses servent uniquement à vérifier le diagnostic et ne modifient pas ton niveau permanent.",
    completed: "Ce parcours est un aperçu provisoire et ne débloque pas encore les activités normales.",
  },
  exerciseControls: EXERCISE_CONTROL_COPY,
} as const;

export const legacyDiagnosticRunDescription = (minimum: number) =>
  `Chaque domaine s’adapte séparément. Il faut au moins ${minimum} réponses au total; le diagnostic s’arrête dès que le profil est assez précis.`;

export const legacyDiagnosticPathHeading = (count: number) =>
  `Un parcours de ${count} compétences`;

export const legacyDiagnosticQuestionMeta = (probeCount: number) =>
  `Question ${probeCount + 1} · difficulté ajustée en continu`;

export const legacyDiagnosticSectionTransition = (label: string) =>
  `Section suivante : ${label}`;

export const legacyDiagnosticSectionStatus = (
  sectionIndex: number,
  section: (typeof DIAGNOSTIC_SECTIONS)[number],
  progress: DiagnosticSectionProgress | undefined,
  active: boolean,
) => progress?.status === "completed"
  ? LEGACY_DIAGNOSTIC_COPY.run.sectionComplete
  : active
    ? `${progress?.probeCount ?? 0}/${section.minProbes} minimum`
    : `Section ${sectionIndex + 1}`;

export const legacyDiagnosticSectionRange = (minimum: number, maximum: number) =>
  `Une section peut prendre de ${minimum} à ${maximum} questions. Une compétence n’est confirmée qu’après les types de preuves nécessaires, par exemple reconnaître puis produire. La section s’arrête selon la couverture du graphe et l’incertitude restante.`;

export const legacyPilotNotice = (completed: boolean) =>
  `${LEGACY_DIAGNOSTIC_COPY.pilot.label} ${completed ? LEGACY_DIAGNOSTIC_COPY.pilot.completed : LEGACY_DIAGNOSTIC_COPY.pilot.active}`;

type AssignedItem = LiveDiagnosticItem & { runItemId: string; assignedAt: string };

type RunDisplayInput = {
  item: AssignedItem;
  progress: DiagnosticSectionProgress[];
  minTotalProbes: number;
  resumed: boolean;
  isPilot: boolean;
};

type CompletionDisplayInput = {
  isPilot?: boolean;
  frontier: { report: FrontierReport; labels: Record<string, { key: string; label: string }> };
  learningPath?: {
    stepCount: number;
    firstSteps: DiagnosticLearningPathStep[];
  } | null;
};

export function legacyDiagnosticItemDisplay(input: RunDisplayInput, probeCount: number) {
  const section = diagnosticSection(input.item.sectionKey);
  const progress = input.progress.find((entry) => entry.key === input.item.sectionKey);
  const prompt = splitExercisePrompt(input.item.promptFr);
  return {
    pilotNotice: input.isPilot ? legacyPilotNotice(false) : null,
    header: {
      eyebrow: input.resumed ? LEGACY_DIAGNOSTIC_COPY.run.resumed : LEGACY_DIAGNOSTIC_COPY.run.initial,
      title: LEGACY_DIAGNOSTIC_COPY.run.title,
      description: legacyDiagnosticRunDescription(input.minTotalProbes),
    },
    sections: DIAGNOSTIC_SECTIONS.map((entry, index) => ({
      key: entry.key,
      label: entry.shortLabelFr,
      status: legacyDiagnosticSectionStatus(index, entry, input.progress.find((row) => row.key === entry.key), entry.key === input.item.sectionKey),
    })),
    question: {
      section: section.labelFr,
      meta: legacyDiagnosticQuestionMeta(probeCount),
      badge: LEGACY_DIAGNOSTIC_COPY.run.adaptiveQuestion,
      instructionLabel: EXERCISE_CONTROL_COPY.instruction,
      instructions: [...new Set([prompt.instruction, input.item.instructionsFr?.trim()].filter((value): value is string => Boolean(value)))],
      passageLabel: prompt.passage.length ? EXERCISE_CONTROL_COPY.passage : null,
      passage: prompt.passage,
      questionLabel: prompt.question ? EXERCISE_CONTROL_COPY.question : null,
      question: prompt.question,
      paragraphs: prompt.paragraphs,
      choices: shuffleChoices(input.item.choices, `exercise:${input.item.id}`),
      answerLabel: input.item.choices.length ? null : LEGACY_DIAGNOSTIC_COPY.run.answerLabel,
      answerPlaceholder: input.item.choices.length ? null : LEGACY_DIAGNOSTIC_COPY.run.answerPlaceholder,
      controls: [LEGACY_DIAGNOSTIC_COPY.run.analyzing, LEGACY_DIAGNOSTIC_COPY.run.validate],
      feedback: [LEGACY_DIAGNOSTIC_COPY.run.correct, LEGACY_DIAGNOSTIC_COPY.run.informative],
    },
    rationale: {
      heading: LEGACY_DIAGNOSTIC_COPY.run.why,
      description: section.descriptionFr,
      responsesLabel: LEGACY_DIAGNOSTIC_COPY.run.responsesInSection,
      responses: progress?.probeCount ?? 0,
      testedLabel: LEGACY_DIAGNOSTIC_COPY.run.testedDirectly,
      tested: progress?.distinctNodesTested ?? 0,
      confirmedLabel: LEGACY_DIAGNOSTIC_COPY.run.confirmed,
      confirmed: progress?.confirmedNodeCount ?? 0,
      range: legacyDiagnosticSectionRange(section.minProbes, section.maxProbes),
    },
  };
}

export function legacyDiagnosticCompletionDisplay(input: CompletionDisplayInput) {
  const outcomes = (Object.keys(LEGACY_DIAGNOSTIC_COPY.outcomes) as Array<keyof typeof LEGACY_DIAGNOSTIC_COPY.outcomes>)
    .map((key) => ({ key, label: LEGACY_DIAGNOSTIC_COPY.outcomes[key], count: input.frontier.report[key].length }));
  return {
    pilotNotice: input.isPilot ? legacyPilotNotice(true) : null,
    header: LEGACY_DIAGNOSTIC_COPY.completed,
    outcomes,
    path: input.learningPath ? {
      eyebrow: LEGACY_DIAGNOSTIC_COPY.completed.firstStepsEyebrow,
      heading: legacyDiagnosticPathHeading(input.learningPath.stepCount),
      ordering: LEGACY_DIAGNOSTIC_COPY.completed.foundationsFirst,
      steps: input.learningPath.firstSteps.slice(0, 5).map((step) => ({
        position: step.position,
        label: step.label,
        rationale: step.rationaleFr,
        section: diagnosticSection(step.section).shortLabelFr,
      })),
    } : null,
    controls: [LEGACY_DIAGNOSTIC_COPY.completed.startPath, LEGACY_DIAGNOSTIC_COPY.completed.viewMap],
  };
}

type LegacyDiagnosticResponse = {
  startupError?: string | null;
  submissionError?: string | null;
  done?: boolean;
  blocked?: boolean;
  correct?: boolean;
  probeCount?: number;
  sectionTransition?: boolean;
  item?: AssignedItem;
  progress?: DiagnosticSectionProgress[];
  minTotalProbes?: number;
  resumed?: boolean;
  isPilot?: boolean;
  frontier?: CompletionDisplayInput["frontier"];
  learningPath?: CompletionDisplayInput["learningPath"];
};

/** Dynamic strings assembled from one server-action response. Fixed client
 * states are recorded separately by the route before the client is exposed. */
export function legacyDiagnosticResponseDisplay(raw: unknown) {
  const value = (raw ?? {}) as LegacyDiagnosticResponse;
  if (value.startupError !== undefined) {
    return { kind: "startup-error" as const, message: value.startupError ?? LEGACY_DIAGNOSTIC_COPY.unavailable.fallback };
  }
  if (value.submissionError !== undefined) {
    return { kind: "submission-error" as const, message: value.submissionError ?? LEGACY_DIAGNOSTIC_COPY.run.submissionFallback };
  }
  if (value.done && value.frontier) {
    return { kind: "completed" as const, ...legacyDiagnosticCompletionDisplay({
      isPilot: value.isPilot,
      frontier: value.frontier,
      learningPath: value.learningPath,
    }) };
  }
  if (value.blocked) {
    return { kind: "blocked" as const, message: LEGACY_DIAGNOSTIC_COPY.blocked.response };
  }
  if (value.item && value.progress) {
    const run = {
      item: value.item,
      progress: value.progress,
      minTotalProbes: value.minTotalProbes ?? 0,
      resumed: Boolean(value.resumed),
      isPilot: Boolean(value.isPilot),
    };
    const display = legacyDiagnosticItemDisplay(run, value.probeCount ?? 0);
    return {
      kind: "question" as const,
      transition: value.sectionTransition
        ? legacyDiagnosticSectionTransition(diagnosticSection(value.item.sectionKey).labelFr)
        : null,
      display: value.minTotalProbes === undefined ? {
        sections: display.sections,
        question: display.question,
        rationale: display.rationale,
      } : display,
    };
  }
  return { kind: "acknowledgement" as const, correct: value.correct ?? null };
}

export const legacyDiagnosticFixedDisplay = () => ({
  copy: LEGACY_DIAGNOSTIC_COPY,
  sections: DIAGNOSTIC_SECTIONS.map((section) => ({
    key: section.key,
    label: section.labelFr,
    shortLabel: section.shortLabelFr,
    description: section.descriptionFr,
    minimum: section.minProbes,
    maximum: section.maxProbes,
  })),
});

export const legacyDiagnosticSectionLabel = (key: DiagnosticSectionKey) =>
  diagnosticSection(key).labelFr;
