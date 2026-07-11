import { describe, it, expect } from "vitest";
import { recommendNextAction, scoreSession } from "./session";
import { estimateReadingGrade } from "./diagnostic";
import { scoreSummary } from "./summary";
import { difficultyBandLabel, gradeToBand } from "./band";
import { DIAGNOSTIC_ITEMS } from "@/lib/content/diagnostic";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";

describe("recommendNextAction (PRD §J rules)", () => {
  it("maintains inside the 80–85% zone", () => {
    expect(recommendNextAction(0.82)).toBe("maintain");
  });
  it("repairs foundations below 70%", () => {
    expect(recommendNextAction(0.6)).toBe("foundation_repair");
  });
  it("adds scaffolding in 70–79%", () => {
    expect(recommendNextAction(0.74)).toBe("add_scaffolding");
  });
  it("increases difficulty above 95%", () => {
    expect(recommendNextAction(0.98)).toBe("increase_difficulty");
  });
  it("only raises in 86–95% on a 2-session streak", () => {
    expect(recommendNextAction(0.9)).toBe("maintain");
    expect(recommendNextAction(0.9, { previousSuccessRate: 0.9 })).toBe(
      "increase_difficulty"
    );
  });
  it("changes topic on abandonment regardless of score", () => {
    expect(recommendNextAction(0.99, { abandoned: true })).toBe("change_topic");
  });
});

describe("gradeToBand (PRD §G)", () => {
  it("maps grades to internal bands", () => {
    expect(gradeToBand(7)).toBe("Secondary 7A");
    expect(gradeToBand(7.6)).toBe("Secondary 7B");
    expect(gradeToBand(6)).toBe("Foundation 6A");
    expect(gradeToBand(12)).toBe("Advanced 11-12");
  });
  it("clamps out-of-range grades", () => {
    expect(gradeToBand(2)).toBe("Foundation 5A");
  });
  it("presents internal bands in plain French", () => {
    expect(difficultyBandLabel("Secondary 7A")).toBe("Lecture : 7e année · palier 1");
    expect(difficultyBandLabel("Foundation 6B")).toBe("Lecture : 6e année · palier 2");
    expect(difficultyBandLabel("Advanced 11-12")).toBe("Lecture : 11e–12e année · avancé");
  });
});

describe("scoreSummary", () => {
  it("rejects too-short summaries", () => {
    expect(scoreSummary("non", { keywords: ["migration"] }).score).toBeLessThan(30);
  });
  it("rewards concept coverage", () => {
    const good = scoreSummary(
      "Les jeunes footballeurs partent par migration pour une meilleure opportunité économique ailleurs.",
      { keywords: ["migration", "opportunité"], minWords: 10 }
    );
    expect(good.capturedMainIdea).toBe(true);
    expect(good.score).toBeGreaterThanOrEqual(80);
  });
});

describe("estimateReadingGrade (PRD §C)", () => {
  it("returns a low estimate when everything is wrong", () => {
    const grade = estimateReadingGrade(DIAGNOSTIC_ITEMS, {});
    const minGrade = Math.min(...DIAGNOSTIC_ITEMS.map((i) => i.grade));
    expect(grade).toBe(minGrade - 1);
  });
  it("rises when all answers are correct", () => {
    const allCorrect = Object.fromEntries(
      DIAGNOSTIC_ITEMS.map((i) => [i.id, i.correctIndex])
    );
    const grade = estimateReadingGrade(DIAGNOSTIC_ITEMS, allCorrect);
    expect(grade).toBe(Math.max(...DIAGNOSTIC_ITEMS.map((i) => i.grade)));
  });
});

describe("scoreSession (PRD §I)", () => {
  const text = SEED_TEXT_BY_ID["football-migration"];

  it("scores a perfect session in the high range and recommends progress", () => {
    const answers = Object.fromEntries(
      text.questions.map((q) => [q.id, q.correctIndex])
    );
    const result = scoreSession({
      studentId: "t",
      text,
      answers,
      summaryText:
        "La migration des footballeurs vient de l'opportunité économique ailleurs.",
      retrievalText: "La migration est le déplacement de personnes.",
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:10:00.000Z",
    });
    expect(result.successRate).toBeGreaterThan(0.9);
    expect(result.recommendedNextAction).toBe("increase_difficulty");
    expect(result.timeOnTaskSeconds).toBe(600);
  });

  it("triggers foundation repair when most answers are wrong", () => {
    const answers = Object.fromEntries(
      text.questions.map((q) => [q.id, (q.correctIndex + 1) % q.choices.length])
    );
    const result = scoreSession({
      studentId: "t",
      text,
      answers,
      summaryText: "",
      retrievalText: "",
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:05:00.000Z",
    });
    expect(result.successRate).toBeLessThan(0.7);
    expect(result.recommendedNextAction).toBe("foundation_repair");
  });
});
