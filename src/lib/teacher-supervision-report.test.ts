import { describe, expect, it } from "vitest";
import type { StudentSnapshot } from "@/lib/reports";
import type { GranularTeacherReportInput } from "./teacher-supervision-report";
import { teacherSupervisionReport } from "./teacher-supervision-report";

const NOW = Date.parse("2026-09-13T12:00:00.000Z");

const granular: GranularTeacherReportInput = {
  phase: "learning",
  provisional: true,
  completionReason: "later_evidence_required",
  answeredCount: 5,
  skippedCount: 1,
  activeSeconds: 610,
  supportedSkillCount: 367,
  unsupportedSkillCount: 12,
  limitationFr: "Couverture progressive.",
  learningProgress: { completedGuidedLessons: 2, independentChecks: 3, successfulIndependentChecks: 1, currentGuided: null },
  details: {
    supported: { labelFr: "Interpréter une relation", domain: "reading_comprehension", mode: "interpretation", assessmentAvailable: true },
    deferred: { labelFr: "Produire un texte", domain: "grammar", mode: "independent_production", assessmentAvailable: false },
  },
  results: [
    { skillId: "supported", status: "uncertain", evidence: "direct", resolved: false, modes: [{ mode: "interpretation", probability: .71, distinctItems: 3, distinctContexts: 2, distinctOccasions: 1, accuracy: 2 / 3, confirmed: false }] },
    { skillId: "deferred", status: "unknown", evidence: "untested", resolved: false, modes: [{ mode: "independent_production", probability: .5, distinctItems: 0, distinctContexts: 0, distinctOccasions: 0, accuracy: 0, confirmed: false }] },
  ],
};

describe("teacherSupervisionReport", () => {
  it("preserves engine resolution and distinguishes unsupported scope", () => {
    const report = teacherSupervisionReport({}, NOW, granular);
    const skills = report.granular?.groups.flatMap((group) => group.skills) ?? [];

    expect(report.granular).toMatchObject({ supportedSkillCount: 367, unsupportedSkillCount: 12, provisional: true, learningProgress: { completedGuidedLessons: 2, independentChecks: 3, successfulIndependentChecks: 1 } });
    expect(skills.find((skill) => skill.skillId === "supported")).toMatchObject({ status: "uncertain", resolution: "unresolved", eligibleEvidenceCount: 3 });
    expect(skills.find((skill) => skill.skillId === "deferred")).toMatchObject({ status: "unknown", resolution: "unsupported", eligibleEvidenceCount: 0 });
  });

  it("returns only aggregate evidence and never raw response material", () => {
    const taintedInput = {
      ...granular,
      rawAnswer: "SENTINEL_RAW_STUDENT_ANSWER",
      question: "SENTINEL_RAW_QUESTION",
      correctAnswer: "SENTINEL_RAW_ANSWER_KEY",
    } as GranularTeacherReportInput;
    const report = teacherSupervisionReport({}, NOW, taintedInput);
    const serialized = JSON.stringify(report);
    const forbiddenKeys = new Set(["rawAnswer", "question", "correctAnswer", "diagnosticResponses", "bank", "bundle", "state"]);
    const visit = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        expect(forbiddenKeys.has(key)).toBe(false);
        visit(child);
      }
    };
    visit(report);
    expect(serialized).not.toContain("SENTINEL_RAW_STUDENT_ANSWER");
    expect(serialized).not.toContain("SENTINEL_RAW_QUESTION");
    expect(serialized).not.toContain("SENTINEL_RAW_ANSWER_KEY");
    expect(report.granular?.answeredCount).toBe(5);
  });

  it("keeps the legacy baseline secondary and reports adjacent weekly activity", () => {
    const snap: StudentSnapshot = {
      diagnostic: {
        studentId: "student",
        overallReadingBand: { minGrade: 6.2, maxGrade: 6.8, confidence: "medium" },
        textTypeEstimates: { narrative: 61, expository: 55, argumentative: 48, sourceBased: 51 },
        skillEstimates: { literalComprehension: 72, inference: 42, vocabularyInContext: 58, sentenceParsing: 63, summary: 50, argumentStructure: 47, academicConnectors: 54 },
        recommendedStartingLevel: "Foundation 6B",
        foundationGaps: ["inference"],
      },
      sessions: [
        { studentId: "student", textVersionId: "one", startedAt: "2026-09-12T12:00:00.000Z", completedAt: "2026-09-12T12:10:00.000Z", abandoned: false, successRate: .8, literalScore: .8, inferenceScore: .8, vocabularyScore: .8, summaryScore: .8, retrievalScore: .8, timeOnTaskSeconds: 600, hintsUsed: 0, targetSuccessZone: { min: .8, max: .85 }, recommendedNextAction: "maintain" },
        { studentId: "student", textVersionId: "two", startedAt: "2026-09-03T12:00:00.000Z", completedAt: "2026-09-03T12:08:00.000Z", abandoned: false, successRate: .7, literalScore: .7, inferenceScore: .7, vocabularyScore: .7, summaryScore: .7, retrievalScore: .7, timeOnTaskSeconds: 480, hintsUsed: 1, targetSuccessZone: { min: .8, max: .85 }, recommendedNextAction: "add_scaffolding" },
      ],
    };

    const report = teacherSupervisionReport(snap, NOW, null);
    expect(report.granular).toBeNull();
    expect(report.legacyBaseline).toMatchObject({ band: "6.2–6.8", confidence: "medium" });
    expect(report.activity.thisWeek).toMatchObject({ textsCompleted: 1, minutes: 10, avgSuccess: .8 });
    expect(report.activity.previousWeekSessions).toBe(1);
  });
});
