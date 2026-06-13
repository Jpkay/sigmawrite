import type { QuestionType, AnswerFormat } from "@/lib/types";

/**
 * Deterministic question difficulty (PRD §G "question difficulty"). Higher
 * cognitive demand → higher score. Pure and stable so the question scorer
 * can flag candidates whose questions drift from the target band.
 */
const TYPE_WEIGHT: Record<QuestionType, number> = {
  literal: 20,
  main_idea: 35,
  vocabulary_in_context: 35,
  cause_consequence: 50,
  evidence_selection: 55,
  compare_contrast: 65,
  inference: 70,
  summary: 75,
  transfer: 90,
};

const FORMAT_BONUS: Record<AnswerFormat, number> = {
  multiple_choice: 0,
  short_answer: 10,
  written_summary: 20,
};

export function scoreQuestionDifficulty(
  type: QuestionType,
  format: AnswerFormat
): number {
  return Math.min(100, TYPE_WEIGHT[type] + FORMAT_BONUS[format]);
}
