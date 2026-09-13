import { buildEvidenceChallenge } from "@/lib/content/evidence";
import { readingChoiceSeed, shuffleChoices } from "@/lib/content/choice-order";
import { EXERCISE_CONTROL_COPY } from "@/lib/content/exercise-control-copy";
import type { SeedText } from "@/lib/content/types";
import { difficultyBandLabel } from "@/lib/scoring/band";
import { NEXT_ACTION_LABEL } from "@/lib/scoring/session";
import { SUCCESS_ZONE, type ReadingSessionResult } from "@/lib/types";

export const READING_PLAYER_COPY = {
  missingTitle: "Texte introuvable",
  returnHome: "Retour à l'accueil",
  readableFont: "Police lisible",
  spacing: "Espacement",
  lineFocus: "Focus ligne",
  syllables: "Syllabes",
  vocabulary: "Mots à retenir",
  beginQuestions: "Passons aux questions",
  correct: "Bonne réponse.",
  evidenceQuestion: "Quelle phrase du texte justifie cette réponse ?",
  evidenceLabel: "Phrase justificative",
  validateEvidence: "Valider la justification",
  exactEvidence: "Justification exacte : c’est bien cette phrase qui porte l’information.",
  verify: "Vérifier",
  next: "Suivant",
  continue: "Continuer",
  summaryPlaceholder: "Ton résumé…",
  retrievalHeading: "Une dernière question de mémoire",
  retrievalPlaceholder: "Réponds avec tes mots…",
  finish: "Terminer la séance",
  startError: "La séance n'a pas pu démarrer. Réessaie.",
  answerOffline: "Réponse gardée hors connexion. Elle sera envoyée automatiquement.",
  answerError: "Ta réponse n'a pas pu être enregistrée. Réessaie.",
  summaryError: "Ta réponse n'a pas pu être enregistrée. Réessaie plus tard.",
  finishError: "La séance n'a pas pu être terminée. Tes réponses restent affichées.",
} as const;

export const readingParagraphLabel = (index: number) => `Lire le paragraphe ${index + 1}`;
export const readingQuestionPosition = (index: number, total: number) => `Question ${index + 1} / ${total}`;
export const readingIncorrectAnswer = (answer: string) => `Pas tout à fait : la bonne réponse est « ${answer} ».`;
export const readingEvidenceCandidate = (sentence: string) => `« ${sentence} »`;
export const readingIncorrectEvidence = (sentence: string) => `La phrase qui justifie la réponse est : « ${sentence} ».`;
export const displayedReadingChoices = (question: SeedText["questions"][number]) =>
  shuffleChoices(question.choices, readingChoiceSeed(question.prompt, question.choices));

export function readingQuestionDisplay(text: SeedText, question: SeedText["questions"][number], index: number) {
  const evidence = buildEvidenceChallenge(
    text.body,
    question.choices[question.correctIndex] ?? "",
    question.explanationFr,
    `${text.id}:${question.id}`,
  );
  return {
    position: readingQuestionPosition(index, text.questions.length),
    correct: READING_PLAYER_COPY.correct,
    incorrect: readingIncorrectAnswer(question.choices[question.correctIndex] ?? ""),
    displayedChoices: displayedReadingChoices(question),
    evidence: evidence ? {
      ...evidence,
      displayedCandidates: evidence.candidates.map(readingEvidenceCandidate),
      exact: READING_PLAYER_COPY.exactEvidence,
      incorrect: readingIncorrectEvidence(evidence.candidates[evidence.answerIndex] ?? ""),
    } : null,
  };
}

export function readingPlayerDisplay(text: SeedText | null) {
  return {
    copy: READING_PLAYER_COPY,
    accentControls: {
      label: EXERCISE_CONTROL_COPY.accentsLabel,
      characters: EXERCISE_CONTROL_COPY.accents,
    },
    text: text ? {
      difficultyLabel: difficultyBandLabel(text.difficultyBand),
      paragraphLabels: text.body.map((_, index) => readingParagraphLabel(index)),
      vocabularyEntries: text.targetVocabulary.map((entry) => `${entry.word} — ${entry.definitionFr}`),
      questions: text.questions.map((question, index) => readingQuestionDisplay(text, question, index)),
    } : null,
  };
}

export const READING_RESULTS_COPY = {
  missingTitle: "Résultats introuvables",
  title: "Résultats",
  loading: "Chargement…",
  emptyTitle: "Aucun résultat pour ce texte",
  read: "Faire la lecture",
  successRate: "Taux de réussite",
  inZone: "Dans la zone d'apprentissage",
  outOfZone: "Hors zone (80–85%)",
  nextAction: "Prochaine action recommandée",
  schedule: "🧠 Les notions de ce texte reviendront demain, puis dans 3, 7, 21 et 45 jours.",
  correction: "Correction",
} as const;

export const READING_RESULT_CATEGORIES: ReadonlyArray<{ key: keyof ReadingSessionResult; label: string }> = [
  { key: "literalScore", label: "Littéral / idée principale" },
  { key: "inferenceScore", label: "Inférence / cause" },
  { key: "vocabularyScore", label: "Vocabulaire" },
  { key: "summaryScore", label: "Résumé" },
  { key: "retrievalScore", label: "Mémoire" },
];

const percent = (value: number) => `${Math.round(value * 100)}%`;

export function readingResultsDisplay(input: {
  text: SeedText | null;
  result: ReadingSessionResult | null;
  nextStep: { href: string; label: string };
  hydrated?: boolean;
}) {
  if (!input.text) return { copy: READING_RESULTS_COPY, state: "missing" as const, title: READING_RESULTS_COPY.missingTitle };
  if (input.hydrated === false) return { copy: READING_RESULTS_COPY, state: "loading" as const, title: READING_RESULTS_COPY.title, description: READING_RESULTS_COPY.loading };
  if (!input.result) return {
    copy: READING_RESULTS_COPY,
    state: "empty" as const,
    title: READING_RESULTS_COPY.emptyTitle,
    control: READING_RESULTS_COPY.read,
  };
  const inZone = input.result.successRate >= SUCCESS_ZONE.min && input.result.successRate <= SUCCESS_ZONE.max;
  return {
    copy: READING_RESULTS_COPY,
    state: "result" as const,
    title: READING_RESULTS_COPY.title,
    description: input.text.title,
    percentage: Math.round(input.result.successRate * 100),
    successRate: percent(input.result.successRate),
    zone: inZone ? READING_RESULTS_COPY.inZone : READING_RESULTS_COPY.outOfZone,
    inZone,
    categories: READING_RESULT_CATEGORIES.map((category) => ({
      ...category,
      value: percent(Number(input.result![category.key])),
    })),
    nextAction: NEXT_ACTION_LABEL[input.result.recommendedNextAction],
    nextStep: input.nextStep,
    corrections: input.text.questions.map((question, index) => ({
      prompt: question.prompt,
      choices: readingQuestionDisplay(input.text!, question, index).displayedChoices,
      explanation: question.explanationFr,
    })),
  };
}
