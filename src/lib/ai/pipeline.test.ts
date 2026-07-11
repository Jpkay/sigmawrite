import { describe, it, expect } from "vitest";
import {
  scoreTextDifficulty,
  extractFeatures,
} from "@/lib/scoring/text-difficulty";
import { scoreQuestionDifficulty } from "@/lib/scoring/question";
import {
  decideReviewStatus,
  isDifficultyMismatch,
  bandTargetOverall,
  isSensitive,
  runGenerationPipeline,
  hasUncataloguedNumericClaim,
} from "./pipeline";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import type { GenerateTextInput } from "./schemas";

describe("text difficulty engine (PRD §G)", () => {
  const simple = SEED_TEXT_BY_ID["football-migration"].body;
  const complex = [
    "L'industrialisation accélérée engendre une transformation socio-économique considérable dont les conséquences environnementales, démographiques et institutionnelles demeurent largement imprévisibles pour les générations contemporaines confrontées à cette mutation.",
    "Cette reconfiguration territoriale, caractérisée par une urbanisation exponentielle, provoque simultanément une fragmentation des structures traditionnelles et une recomposition des hiérarchies économiques préexistantes.",
  ];

  it("orders a simple text below a complex one", () => {
    const a = scoreTextDifficulty(simple);
    const b = scoreTextDifficulty(complex);
    expect(b.overall).toBeGreaterThan(a.overall);
    expect(b.lexical).toBeGreaterThan(a.lexical);
  });

  it("produces scores within range and a band", () => {
    const d = scoreTextDifficulty(simple);
    for (const v of [d.lexical, d.syntax, d.knowledge, d.inference, d.stamina, d.overall]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(typeof d.band).toBe("string");
  });

  it("detects connectors and counts words", () => {
    const f = extractFeatures(["Il part donc, parce que c'est mieux."]);
    expect(f.connectorCount).toBeGreaterThanOrEqual(2);
    expect(f.wordCount).toBeGreaterThan(5);
  });
});

describe("scoreQuestionDifficulty (PRD §G)", () => {
  it("ranks literal < inference < transfer", () => {
    const lit = scoreQuestionDifficulty("literal", "multiple_choice");
    const inf = scoreQuestionDifficulty("inference", "multiple_choice");
    const tr = scoreQuestionDifficulty("transfer", "multiple_choice");
    expect(lit).toBeLessThan(inf);
    expect(inf).toBeLessThan(tr);
  });
  it("adds a bonus for written formats", () => {
    expect(scoreQuestionDifficulty("summary", "written_summary")).toBeGreaterThan(
      scoreQuestionDifficulty("summary", "multiple_choice")
    );
  });
});

describe("review-status decision (PRD §H step 13)", () => {
  const clear = {
    moderationPassed: true,
    factualNeedsReview: false,
    sensitive: false,
    difficultyMismatch: false,
  };
  it("auto-approves only when everything is clear", () => {
    expect(decideReviewStatus(clear)).toBe("auto_approved");
  });
  it("forces human review on any flag", () => {
    expect(decideReviewStatus({ ...clear, sensitive: true })).toBe("needs_human_review");
    expect(decideReviewStatus({ ...clear, factualNeedsReview: true })).toBe("needs_human_review");
    expect(decideReviewStatus({ ...clear, difficultyMismatch: true })).toBe("needs_human_review");
    expect(decideReviewStatus({ ...clear, moderationPassed: false })).toBe("needs_human_review");
  });
});

describe("difficulty / sensitivity helpers", () => {
  it("bandTargetOverall increases with band index", () => {
    expect(bandTargetOverall("Foundation 5A")).toBeLessThan(
      bandTargetOverall("Secondary 9A")
    );
  });
  it("flags large mismatches only", () => {
    const target = bandTargetOverall("Secondary 7A");
    expect(isDifficultyMismatch("Secondary 7A", target)).toBe(false);
    expect(isDifficultyMismatch("Secondary 7A", target + 30)).toBe(true);
  });
  it("detects sensitive domains", () => {
    const base: GenerateTextInput = {
      language: "fr",
      studentGrade: 8,
      targetReadingBand: "Secondary 8A",
      topic: "Les élections et la démocratie",
      primaryInterest: "politics",
      knowledgeDomains: ["politics"],
      targetConcepts: [],
      textType: "argumentative",
      wordCountTarget: 500,
      maxAverageSentenceLength: 18,
      maxNewAcademicWords: 8,
      targetVocabulary: [],
      targetSkills: [],
      avoid: [],
      tone: "neutral_academic",
    };
    expect(isSensitive(base)).toBe(true);
  });
  it("forces review when a number is absent from factual claims", () => {
    expect(hasUncataloguedNumericClaim("Le projet a réuni 42 élèves en 2025.", [
      { claim: "Le projet a réuni 42 élèves.", confidence: "high", needsHumanReview: false },
    ])).toBe(true);
    expect(hasUncataloguedNumericClaim("Le projet a réuni 42 élèves.", [
      { claim: "Le projet a réuni 42 élèves.", confidence: "high", needsHumanReview: false },
    ])).toBe(false);
  });
});

describe("runGenerationPipeline (mock provider)", () => {
  it("produces a validated, scored, reviewed candidate", async () => {
    const input: GenerateTextInput = {
      language: "fr",
      studentGrade: 7,
      targetReadingBand: "Secondary 7A",
      topic: "La migration des jeunes footballeurs",
      primaryInterest: "football",
      knowledgeDomains: ["geography", "economics"],
      targetConcepts: ["migration"],
      textType: "expository",
      wordCountTarget: 450,
      maxAverageSentenceLength: 18,
      maxNewAcademicWords: 8,
      targetVocabulary: ["migration", "opportunité"],
      targetSkills: ["inference"],
      avoid: [],
      tone: "curious_explainer",
    };
    const candidate = await runGenerationPipeline(input);
    expect(candidate.generated.questions.length).toBeGreaterThan(0);
    expect(candidate.questionDifficulties.length).toBe(
      candidate.generated.questions.length
    );
    expect(candidate.difficulty.overall).toBeGreaterThanOrEqual(0);
    expect([
      "auto_approved",
      "needs_human_review",
    ]).toContain(candidate.reviewStatus);
  });
});
