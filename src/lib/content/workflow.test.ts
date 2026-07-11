import { describe, expect, it } from "vitest";
import { contentSlug, rescoreCandidateBody } from "@/lib/content/workflow";
import type { ContentCandidate } from "@/lib/ai/pipeline";

const candidate = {
  id: "candidate-1",
  createdAt: "2026-07-10T00:00:00.000Z",
  input: { targetReadingBand: "Secondary 7A" },
  generated: {
    body: "Texte initial.",
    knowledgeConcepts: [],
    targetVocabulary: [],
    questions: [],
  },
  flags: { moderationPassed: true, factualNeedsReview: false, sensitive: false, difficultyMismatch: false },
  reviewStatus: "auto_approved",
} as unknown as ContentCandidate;

describe("content workflow", () => {
  it("creates stable URL-safe slugs", () => {
    expect(contentSlug("L'Énergie à Kigali !")).toBe("l-energie-a-kigali");
    expect(contentSlug("Texte", "ABC-12345-extra")).toBe("texte-abc12345");
  });

  it("re-scores edited bodies and always returns them to review", () => {
    const result = rescoreCandidateBody(candidate, "Une phrase simple.\n\nUne autre phrase.");
    expect(result.generated.body).toContain("Une autre phrase");
    expect(result.reviewStatus).toBe("needs_human_review");
    expect(result.difficulty.features.wordCount).toBeGreaterThan(0);
  });
});
