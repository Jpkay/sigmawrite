import { getAIProvider } from "./index";
import {
  generatedTextCandidateSchema,
  type GenerateTextInput,
  type GeneratedTextCandidate,
  type ModerationResult,
} from "./schemas";
import { scoreTextDifficulty, type TextDifficulty } from "@/lib/scoring/text-difficulty";
import { scoreQuestionDifficulty } from "@/lib/scoring/question";
import type { ReviewStatus, DifficultyBand } from "@/lib/types";
import { DIFFICULTY_BANDS } from "@/lib/types";

/**
 * AI content generation pipeline (PRD §H). Orchestrates the constrained
 * steps: generate → Zod-validate → score difficulty → moderate → score
 * questions → decide review status. AI never auto-publishes sensitive,
 * factually-flagged, or off-target content (PRD §10, §17).
 */

// Domains/topics that always require human review (PRD §10).
const SENSITIVE = [
  "politics", "law_ethics", "health",
  "violence", "religion", "sexe", "guerre", "drogue",
];

export type ReviewFlags = {
  moderationPassed: boolean;
  factualNeedsReview: boolean;
  sensitive: boolean;
  difficultyMismatch: boolean;
};

export type ContentCandidate = {
  id: string;
  createdAt: string;
  input: GenerateTextInput;
  generated: GeneratedTextCandidate;
  difficulty: TextDifficulty;
  moderation: ModerationResult;
  questionDifficulties: number[];
  flags: ReviewFlags;
  reviewStatus: ReviewStatus;
};

/** Target overall-difficulty (0–100) implied by a band's position. */
export function bandTargetOverall(band: string): number {
  const idx = DIFFICULTY_BANDS.indexOf(band as DifficultyBand);
  if (idx < 0) return 50;
  return Math.round((idx / (DIFFICULTY_BANDS.length - 1)) * 100);
}

/** A candidate is "off target" if its scored difficulty is >20 from the band. */
export function isDifficultyMismatch(band: string, overall: number): boolean {
  return Math.abs(overall - bandTargetOverall(band)) > 20;
}

export function isSensitive(input: GenerateTextInput): boolean {
  const hay = [input.topic, ...input.knowledgeDomains].join(" ").toLowerCase();
  return SENSITIVE.some((s) => hay.includes(s));
}

/** Pure review-status decision (PRD §H step 13). Easy to unit-test. */
export function decideReviewStatus(flags: ReviewFlags): ReviewStatus {
  if (
    !flags.moderationPassed ||
    flags.factualNeedsReview ||
    flags.sensitive ||
    flags.difficultyMismatch
  ) {
    return "needs_human_review";
  }
  return "auto_approved";
}

export async function runGenerationPipeline(
  input: GenerateTextInput
): Promise<ContentCandidate> {
  const provider = getAIProvider();

  // 1) generate → 2) validate against the contract (PRD §H steps 5–6).
  const generated = generatedTextCandidateSchema.parse(
    await provider.generateText(input)
  );

  const paragraphs = generated.body.split(/\n\n+/).filter(Boolean);

  // 3) deterministic difficulty scoring (PRD §H step 7).
  const difficulty = scoreTextDifficulty(paragraphs, {
    conceptCount: generated.knowledgeConcepts.length,
    newVocabCount: generated.targetVocabulary.length,
    inferenceQuestionCount: generated.questions.filter(
      (q) => q.questionType === "inference"
    ).length,
  });

  // 4) moderation (PRD §H step 8).
  const moderation = await provider.moderate({
    content: generated.body,
    context: "generated_content",
  });

  // 5) question difficulty scoring (PRD §H step 11).
  const questionDifficulties = generated.questions.map((q) =>
    scoreQuestionDifficulty(q.questionType, q.answerFormat)
  );

  const flags: ReviewFlags = {
    moderationPassed: moderation.passed,
    factualNeedsReview: generated.factualClaims.some((c) => c.needsHumanReview),
    sensitive: isSensitive(input),
    difficultyMismatch: isDifficultyMismatch(
      input.targetReadingBand,
      difficulty.overall
    ),
  };

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input,
    generated,
    difficulty,
    moderation,
    questionDifficulties,
    flags,
    reviewStatus: decideReviewStatus(flags),
  };
}
