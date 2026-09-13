import type { StudentSnapshot } from "@/lib/reports";
import { weeklyReport } from "@/lib/reports";
import type { Mode, SkillResult } from "@/lib/diagnostic/granular/engine";
import { groupAssessmentResults, type ResultDetail } from "@/lib/diagnostic/granular/result-groups";

const WEEK_MS = 7 * 86_400_000;

export type GranularTeacherReportInput = {
  phase: "assessing" | "learning";
  provisional: boolean;
  completionReason: "evidence_complete" | "time_budget" | "later_evidence_required" | "coverage_gap" | null;
  answeredCount: number;
  skippedCount: number;
  activeSeconds: number;
  supportedSkillCount: number;
  unsupportedSkillCount: number;
  limitationFr: string | null;
  learningProgress: {
    completedGuidedLessons: number;
    independentChecks: number;
    successfulIndependentChecks: number;
    currentGuided: null | { titleFr: string; phase: "lesson" | "practice"; exerciseIndex: number; totalExercises: number };
  };
  results: SkillResult[];
  details: Record<string, ResultDetail & { assessmentAvailable: boolean }>;
};

export type TeacherSkillEvidence = {
  skillId: string;
  labelFr: string;
  mode: Mode;
  status: SkillResult["status"];
  resolution: "resolved" | "unresolved" | "unsupported";
  eligibleEvidenceCount: number;
  modes: Array<{
    mode: Mode;
    distinctItems: number;
    distinctContexts: number;
    distinctOccasions: number;
    accuracy: number | null;
    confirmed: boolean;
  }>;
};

export type TeacherSupervisionReport = {
  granular: null | {
    phase: GranularTeacherReportInput["phase"];
    provisional: boolean;
    completionReason: GranularTeacherReportInput["completionReason"];
    answeredCount: number;
    skippedCount: number;
    activeMinutes: number;
    supportedSkillCount: number;
    unsupportedSkillCount: number;
    limitationFr: string | null;
    learningProgress: GranularTeacherReportInput["learningProgress"];
    groups: Array<{ id: string; labelFr: string; skills: TeacherSkillEvidence[] }>;
  };
  legacyBaseline: null | {
    band: string;
    confidence: string;
    recommendedStartingLevel: string;
  };
  activity: {
    thisWeek: ReturnType<typeof weeklyReport>;
    previousWeekSessions: number;
    latestSessionAt: string | null;
  };
};

/**
 * Produce a bounded teacher DTO from already-summarized granular results.
 * Status and resolution are copied from the evidence engine; this layer never
 * derives mastery from scores or substitutes one evidence mode for another.
 */
export function teacherSupervisionReport(
  snap: StudentSnapshot,
  nowMs: number,
  granular: GranularTeacherReportInput | null,
): TeacherSupervisionReport {
  const grouped = granular ? groupAssessmentResults(granular.results, granular.details) : [];
  const groups = grouped.map((group) => ({
    id: group.id,
    labelFr: group.labelFr,
    skills: group.results.map(({ result, detail }): TeacherSkillEvidence => {
      const assessmentAvailable = detail?.assessmentAvailable !== false;
      return {
        skillId: result.skillId,
        labelFr: detail?.labelFr ?? "Point à vérifier",
        mode: detail?.mode ?? result.modes[0]?.mode ?? "recognition",
        status: result.status,
        resolution: !assessmentAvailable ? "unsupported" : result.resolved ? "resolved" : "unresolved",
        eligibleEvidenceCount: result.modes.reduce((sum, mode) => sum + mode.distinctItems, 0),
        modes: result.modes.map((mode) => ({
          mode: mode.mode,
          distinctItems: mode.distinctItems,
          distinctContexts: mode.distinctContexts,
          distinctOccasions: mode.distinctOccasions,
          accuracy: mode.distinctItems > 0 ? mode.accuracy : null,
          confirmed: mode.confirmed,
        })),
      };
    }),
  }));

  const sessions = snap.sessions ?? [];
  const previousWeekSessions = sessions.filter((session) => {
    const at = Date.parse(session.completedAt ?? session.startedAt);
    const age = nowMs - at;
    return !Number.isNaN(at) && age > WEEK_MS && age <= WEEK_MS * 2;
  }).length;
  const latestSessionAt = sessions.reduce<string | null>((latest, session) => {
    const candidate = session.completedAt ?? session.startedAt;
    if (Number.isNaN(Date.parse(candidate))) return latest;
    return !latest || Date.parse(candidate) > Date.parse(latest) ? candidate : latest;
  }, null);
  const legacy = snap.diagnostic ?? null;

  return {
    granular: granular ? {
      phase: granular.phase,
      provisional: granular.provisional,
      completionReason: granular.completionReason,
      answeredCount: granular.answeredCount,
      skippedCount: granular.skippedCount,
      activeMinutes: Math.round(granular.activeSeconds / 60),
      supportedSkillCount: granular.supportedSkillCount,
      unsupportedSkillCount: granular.unsupportedSkillCount,
      limitationFr: granular.limitationFr,
      learningProgress: granular.learningProgress,
      groups,
    } : null,
    legacyBaseline: legacy ? {
      band: `${legacy.overallReadingBand.minGrade.toFixed(1)}–${legacy.overallReadingBand.maxGrade.toFixed(1)}`,
      confidence: legacy.overallReadingBand.confidence,
      recommendedStartingLevel: legacy.recommendedStartingLevel,
    } : null,
    activity: {
      thisWeek: weeklyReport(snap, nowMs),
      previousWeekSessions,
      latestSessionAt,
    },
  };
}
