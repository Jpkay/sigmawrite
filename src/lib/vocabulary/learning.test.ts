import { describe, expect, it } from "vitest";
import { EMPTY_VOCABULARY_EVIDENCE, planVocabularyReuse, recordVocabularyEvidence, vocabularyLearningState } from "./learning";

describe("evidence-based vocabulary learning", () => {
  it("never turns mere exposure or help lookup into mastery", () => {
    let evidence = { ...EMPTY_VOCABULARY_EVIDENCE };
    for (let index = 0; index < 20; index++) evidence = recordVocabularyEvidence(evidence, "exposure", { occurredAt: "2026-08-01T10:00:00Z" });
    evidence = recordVocabularyEvidence(evidence, "help_lookup", { occurredAt: "2026-08-01T10:05:00Z" });
    expect(vocabularyLearningState(evidence)).toEqual({ status: "new", mastery: 0, productionDays: 0 });
  });

  it("requires successful typed production on distinct spaced dates and across channels", () => {
    let evidence = { ...EMPTY_VOCABULARY_EVIDENCE };
    evidence = recordVocabularyEvidence(evidence, "meaning_recall", { successful: true, occurredAt: "2026-08-01T10:00:00Z" });
    evidence = recordVocabularyEvidence(evidence, "contextual_use", { successful: true, occurredAt: "2026-08-04T10:00:00Z" });
    evidence = recordVocabularyEvidence(evidence, "correct_spelling", { successful: true, occurredAt: "2026-08-11T10:00:00Z" });
    expect(vocabularyLearningState(evidence)).toEqual({ status: "maintenance", mastery: 1, productionDays: 3 });
  });

  it("reuses only due words related to the current topic", () => {
    const result = planVocabularyReuse([
      { word: "migration", dueAt: "2026-08-01T00:00:00Z", relatedTopics: ["football"], status: "review" },
      { word: "magma", dueAt: "2026-08-01T00:00:00Z", relatedTopics: ["volcan"], status: "review" },
    ], "football professionnel", "2026-08-10T00:00:00Z");
    expect(result.map((item) => item.word)).toEqual(["migration"]);
    expect(result[0]).toMatchObject({ forced: false, presentation: "contextual_reappearance" });
  });
});
