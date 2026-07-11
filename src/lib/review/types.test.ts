import { describe, expect, it } from "vitest";
import { classifyAgreement, reviewValidationError, type ReviewDraft } from "./types";

const complete: ReviewDraft = {
  scores: { naturalness: 4, pedagogical_quality: 4, engagement: 3, difficulty_match: 4, vocabulary: 3, grammar: 4, question_quality: 4, cultural_age: 4 },
  decision: "approve",
  generalComment: "",
  issueTags: [],
  questionReviews: [{ questionIndex: 0, outcome: "correct_clear", comment: "" }],
};

describe("human review rules", () => {
  it("classifies deterministic agreement levels", () => {
    expect(classifyAgreement([{ decision: "approve", scores: [4, 3] }, { decision: "approve", scores: [4, 4] }])).toBe("unanimous");
    expect(classifyAgreement([{ decision: "approve", scores: [4] }, { decision: "approve_minor", scores: [3] }])).toBe("strong_agreement");
    expect(classifyAgreement([{ decision: "approve", scores: [4] }, { decision: "reject", scores: [1] }])).toBe("high_disagreement");
    expect(classifyAgreement([{ decision: "needs_revision", scores: [2] }, { decision: "approve_minor", scores: [3] }])).toBe("mixed");
  });

  it("requires comments for serious decisions, score one, and bad questions", () => {
    expect(reviewValidationError(complete, 1)).toBeNull();
    expect(reviewValidationError({ ...complete, decision: "reject" }, 1)).toMatch(/commentaire/);
    expect(reviewValidationError({ ...complete, scores: { ...complete.scores, grammar: 1 } }, 1)).toMatch(/commentaire/);
    expect(reviewValidationError({ ...complete, questionReviews: [{ questionIndex: 0, outcome: "ambiguous", comment: "" }] }, 1)).toMatch(/ambiguë/);
  });
});
