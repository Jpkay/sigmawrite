import type { ContentCandidate } from "@/lib/ai/pipeline";

export const REVIEW_CRITERIA = [
  ["naturalness", "Naturel du français"],
  ["pedagogical_quality", "Qualité pédagogique"],
  ["engagement", "Intérêt pour l’élève"],
  ["difficulty_match", "Adéquation au niveau"],
  ["vocabulary", "Vocabulaire adapté"],
  ["grammar", "Grammaire et correction"],
  ["question_quality", "Qualité des questions"],
  ["cultural_age", "Adéquation culturelle et à l’âge"],
] as const;

export type ReviewCriterion = (typeof REVIEW_CRITERIA)[number][0];
export type ReviewScores = Partial<Record<ReviewCriterion, number>>;
export type ReviewDecision = "approve" | "approve_minor" | "needs_revision" | "reject";
export type QuestionReviewOutcome = "correct_clear" | "minor_issue" | "ambiguous" | "incorrect";
export type AgreementClassification = "unanimous" | "strong_agreement" | "mixed" | "high_disagreement";

export const ISSUE_TAGS = [
  "unnatural_language", "vocabulary_too_difficult", "vocabulary_too_easy", "difficulty_mismatch",
  "grammar_error", "factual_issue", "ambiguous_question", "multiple_correct_answers", "weak_distractors",
  "low_engagement", "cultural_issue", "age_inappropriate", "repetition", "other",
] as const;

export const ISSUE_TAG_LABELS: Record<(typeof ISSUE_TAGS)[number], string> = {
  unnatural_language: "Langue peu naturelle",
  vocabulary_too_difficult: "Vocabulaire trop difficile",
  vocabulary_too_easy: "Vocabulaire trop facile",
  difficulty_mismatch: "Niveau inadapté",
  grammar_error: "Erreur de langue",
  factual_issue: "Problème factuel",
  ambiguous_question: "Question ambiguë",
  multiple_correct_answers: "Plusieurs bonnes réponses",
  weak_distractors: "Choix de réponse trop faibles",
  low_engagement: "Peu engageant",
  cultural_issue: "Problème culturel",
  age_inappropriate: "Inadapté à l’âge",
  repetition: "Répétition",
  other: "Autre",
};

export type QuestionReviewDraft = { questionIndex: number; outcome: QuestionReviewOutcome; comment: string };
export type ReviewDraft = {
  scores: ReviewScores;
  decision: ReviewDecision | "";
  generalComment: string;
  issueTags: string[];
  questionReviews: QuestionReviewDraft[];
};

export type ReviewQueueItem = {
  assignmentId: string;
  reviewVersionId: string;
  status: "assigned" | "draft" | "submitted";
  assignedAt: string;
  startedAt: string | null;
  submittedAt: string | null;
  versionNumber: number;
  workflowStatus: string;
  candidate: ContentCandidate;
  review: (ReviewDraft & { id: string; durationSeconds: number | null }) | null;
};

export function hasReviewablePassageBody(candidate: ContentCandidate): boolean {
  const body = candidate.generated.body.trim();
  return body.length >= 100 && body.split(/\s+/).length >= 20;
}

export function classifyAgreement(
  reviews: Array<{ decision: ReviewDecision; scores: number[] }>
): AgreementClassification {
  if (!reviews.length) return "mixed";
  const decisions = new Set(reviews.map((review) => review.decision));
  const scores = reviews.flatMap((review) => review.scores);
  const spread = scores.length ? Math.max(...scores) - Math.min(...scores) : 0;
  const hasApproval = reviews.some((review) => review.decision === "approve" || review.decision === "approve_minor");
  const hasRejection = reviews.some((review) => review.decision === "reject");
  if (decisions.size === 1) return "unanimous";
  if ((hasApproval && hasRejection) || spread >= 3) return "high_disagreement";
  if (!hasRejection && reviews.every((review) => ["approve", "approve_minor"].includes(review.decision))) return "strong_agreement";
  return "mixed";
}

export function reviewValidationError(draft: ReviewDraft, questionCount: number): string | null {
  if (REVIEW_CRITERIA.some(([key]) => !draft.scores[key] || ![1, 2, 3, 4].includes(draft.scores[key]!))) {
    return "Attribuez une note à chaque critère.";
  }
  if (!draft.decision) return "Choisissez une décision globale.";
  if (draft.questionReviews.length !== questionCount) return "Évaluez chaque question.";
  const questionMissingComment = draft.questionReviews.some(
    (item) => ["ambiguous", "incorrect"].includes(item.outcome) && !item.comment.trim()
  );
  if (questionMissingComment) return "Ajoutez un commentaire pour chaque question ambiguë ou incorrecte.";
  const needsComment = ["needs_revision", "reject"].includes(draft.decision)
    || Object.values(draft.scores).some((score) => score === 1);
  if (needsComment && !draft.generalComment.trim()) return "Ajoutez un commentaire pour expliquer votre décision.";
  return null;
}
