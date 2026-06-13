import { describe, it, expect } from "vitest";
import {
  weeklyReport,
  recommendedGroups,
  proofLayer,
  type StudentSnapshot,
  type StudentRow,
} from "./reports";
import type { ReadingSessionResult } from "@/lib/types";

const NOW = Date.parse("2026-06-13T12:00:00.000Z");

function session(textVersionId: string, successRate: number, daysAgo: number): ReadingSessionResult {
  const completedAt = new Date(NOW - daysAgo * 86_400_000).toISOString();
  return {
    studentId: "s",
    textVersionId,
    startedAt: completedAt,
    completedAt,
    abandoned: false,
    successRate,
    literalScore: successRate,
    inferenceScore: successRate,
    vocabularyScore: successRate,
    summaryScore: successRate,
    retrievalScore: 1,
    timeOnTaskSeconds: 600,
    hintsUsed: 0,
    targetSuccessZone: { min: 0.8, max: 0.85 },
    recommendedNextAction: "maintain",
  };
}

const snap: StudentSnapshot = {
  diagnostic: {
    studentId: "s",
    overallReadingBand: { minGrade: 7, maxGrade: 7.6, confidence: "medium" },
    textTypeEstimates: { narrative: 60, expository: 60, argumentative: 50, sourceBased: 40 },
    skillEstimates: {
      literalComprehension: 70,
      inference: 40,
      vocabularyInContext: 60,
      sentenceParsing: 60,
      summary: 55,
      argumentStructure: 45,
      academicConnectors: 50,
    },
    recommendedStartingLevel: "Secondary 7A",
    foundationGaps: [],
  },
  sessions: [
    session("football-migration", 0.9, 1), // this week, comfortable
    session("social-media-attention", 0.6, 2), // this week, too hard
    session("football-migration", 0.8, 30), // old, ignored in weekly counts
  ],
  skillEstimates: {
    inference: { ability: 35, uncertainty: 40, evidenceCount: 3 },
    literal_comprehension: { ability: 80, uncertainty: 30, evidenceCount: 3 },
  },
  vocab: { migration: { exposures: 2, lastSeenAt: "x" }, biais: { exposures: 1, lastSeenAt: "x" } },
  retrievalCards: [{ repetitions: 2 }, { repetitions: 0 }],
};

describe("weeklyReport (PRD §M)", () => {
  it("counts only this week's sessions and reads the band", () => {
    const r = weeklyReport(snap, NOW);
    expect(r.textsCompleted).toBe(2);
    expect(r.band).toBe("Grade 7.0–7.6");
    expect(r.minutes).toBe(20);
    expect(r.vocabCount).toBe(2);
    expect(r.retrievalReviewed).toBe(1);
  });
  it("derives strengths and needs-work from live skill estimates", () => {
    const r = weeklyReport(snap, NOW);
    expect(r.strengths).toContain("Compréhension littérale");
    expect(r.needsWork).toContain("Inférence");
  });
  it("handles an empty snapshot", () => {
    const r = weeklyReport({}, NOW);
    expect(r.hasProfile).toBe(false);
    expect(r.textsCompleted).toBe(0);
    expect(r.avgSuccess).toBeNull();
  });
});

describe("proofLayer (PRD §M)", () => {
  it("buckets texts by session success", () => {
    const p = proofLayer(snap);
    expect(p.comfortable.length).toBe(1); // 0.9
    expect(p.tooHard.length).toBe(1); // 0.6
  });
});

describe("recommendedGroups (PRD §N)", () => {
  it("groups students by shared skill gap, largest first", () => {
    const a: StudentRow = {
      id: "a",
      name: "Léa",
      snap: { skillEstimates: { inference: { ability: 30, uncertainty: 40, evidenceCount: 2 } } },
    };
    const b: StudentRow = {
      id: "b",
      name: "Karim",
      snap: {
        skillEstimates: {
          inference: { ability: 20, uncertainty: 40, evidenceCount: 2 },
          summarization: { ability: 10, uncertainty: 40, evidenceCount: 2 },
        },
      },
    };
    const groups = recommendedGroups([a, b]);
    expect(groups[0].skillKey).toBe("inference");
    expect(groups[0].studentNames.sort()).toEqual(["Karim", "Léa"]);
  });
});
