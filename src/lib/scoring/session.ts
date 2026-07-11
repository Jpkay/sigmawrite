import type { NextAction, ReadingSessionResult } from "@/lib/types";
import { SUCCESS_ZONE } from "@/lib/types";
import type { SeedText } from "@/lib/content/types";
import { scoreSummary } from "./summary";

export type SessionInput = {
  studentId: string;
  text: SeedText;
  /** questionId → selected choice index */
  answers: Record<string, number>;
  summaryText: string;
  retrievalText: string;
  startedAt: string;
  completedAt: string;
  hintsUsed?: number;
  abandoned?: boolean;
  /** prior recent success rate, used by the adaptive streak rule (PRD §J) */
  previousSuccessRate?: number;
  /** Pre-moderated, blended summary result supplied by the server action. */
  summaryScoreOverride?: number;
};

const pct = (correct: number, total: number) =>
  total === 0 ? 0 : correct / total;

/**
 * Adaptive next-action rules (PRD §J). Pure: maps a success rate (and a
 * little context) to the recommended next move. The target zone is 80–85%.
 */
export function recommendNextAction(
  successRate: number,
  ctx: { abandoned?: boolean; previousSuccessRate?: number } = {}
): NextAction {
  if (ctx.abandoned) return "change_topic";
  if (successRate < 0.7) return "foundation_repair";
  if (successRate < 0.8) return "add_scaffolding";
  if (successRate <= SUCCESS_ZONE.max) return "maintain";
  if (successRate > 0.95) return "increase_difficulty";
  // 86–95%: raise difficulty only on a 2-session streak above the zone.
  if ((ctx.previousSuccessRate ?? 0) > SUCCESS_ZONE.max) return "increase_difficulty";
  return "maintain";
}

/** Scores a completed reading session and produces the result (PRD §I). */
export function scoreSession(input: SessionInput): ReadingSessionResult {
  const { text, answers } = input;

  const byType = (types: string[]) =>
    text.questions.filter((q) => types.includes(q.type));
  const correctIn = (qs: typeof text.questions) =>
    pct(qs.filter((q) => answers[q.id] === q.correctIndex).length, qs.length);

  const allCorrect = text.questions.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;

  const literalScore = correctIn(byType(["literal", "main_idea"]));
  const inferenceScore = correctIn(byType(["inference", "cause_consequence", "compare_contrast"]));
  const vocabularyScore = correctIn(byType(["vocabulary_in_context"]));

  const summaryEval = scoreSummary(input.summaryText, {
    keywords: text.concepts,
    minWords: 12,
  });
  const summaryScore = (input.summaryScoreOverride ?? summaryEval.score) / 100;

  const retrievalScore = input.retrievalText.trim().split(/\s+/).filter(Boolean)
    .length >= 4
    ? 1
    : input.retrievalText.trim().length > 0
      ? 0.5
      : 0;

  // Success rate blends questions (70%) and summary (30%) — the question
  // bank is the primary signal, the summary is corroborating evidence.
  const questionRate = pct(allCorrect, text.questions.length);
  const successRate =
    Math.round((questionRate * 0.7 + summaryScore * 0.3) * 100) / 100;

  return {
    studentId: input.studentId,
    textVersionId: text.id,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    abandoned: input.abandoned ?? false,
    successRate,
    literalScore,
    inferenceScore,
    vocabularyScore,
    summaryScore,
    retrievalScore,
    timeOnTaskSeconds: Math.max(
      0,
      Math.round(
        (new Date(input.completedAt).getTime() -
          new Date(input.startedAt).getTime()) /
          1000
      )
    ),
    hintsUsed: input.hintsUsed ?? 0,
    targetSuccessZone: { min: SUCCESS_ZONE.min, max: SUCCESS_ZONE.max },
    recommendedNextAction: recommendNextAction(successRate, {
      abandoned: input.abandoned,
      previousSuccessRate: input.previousSuccessRate,
    }),
  };
}

/** Human-readable label for a next-action (FR). */
export const NEXT_ACTION_LABEL: Record<NextAction, string> = {
  increase_difficulty: "Augmenter la difficulté",
  maintain: "Continuer au même niveau",
  add_scaffolding: "Ajouter un soutien",
  foundation_repair: "Réparer les bases",
  reduce_difficulty: "Réduire la difficulté",
  change_topic: "Changer de sujet",
};
