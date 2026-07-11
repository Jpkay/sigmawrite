import type { ContentCandidate } from "@/lib/ai/pipeline";
import { isDifficultyMismatch } from "@/lib/ai/pipeline";
import { scoreTextDifficulty } from "@/lib/scoring/text-difficulty";
import { paragraphsFromText } from "@/lib/content/text-format";

/** Re-scores an edited candidate without trusting the model or browser. */
export function rescoreCandidateBody(
  candidate: ContentCandidate,
  body: string
): ContentCandidate {
  const paragraphs = paragraphsFromText(body);
  const difficulty = scoreTextDifficulty(paragraphs, {
    conceptCount: candidate.generated.knowledgeConcepts.length,
    newVocabCount: candidate.generated.targetVocabulary.length,
    inferenceQuestionCount: candidate.generated.questions.filter(
      (question) => question.questionType === "inference"
    ).length,
  });
  return {
    ...candidate,
    generated: { ...candidate.generated, body },
    difficulty,
    flags: {
      ...candidate.flags,
      difficultyMismatch: isDifficultyMismatch(
        candidate.input.targetReadingBand,
        difficulty.overall
      ),
    },
    reviewStatus: "needs_human_review",
  };
}

export function contentSlug(title: string, suffix?: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || "texte";
  return suffix ? `${base}-${suffix.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}` : base;
}
