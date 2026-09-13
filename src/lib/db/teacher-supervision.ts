import "server-only";

import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { inspectReleaseScope } from "@/lib/diagnostic/granular/release-scope";
import { sharedReleaseContentCache } from "@/lib/diagnostic/granular/release-content-cache";
import { sessionView } from "@/lib/diagnostic/granular/session";
import { SupabaseAssessmentStore } from "@/lib/diagnostic/granular/store";
import type { GranularTeacherReportInput } from "@/lib/teacher-supervision-report";

/**
 * Read the current granular result behind an explicit authenticated access
 * check. The session table intentionally has no authenticated SELECT grant, so
 * the service client is introduced only after can_view_student succeeds.
 */
export async function loadTeacherGranularReport(studentId: string): Promise<GranularTeacherReportInput | null> {
  await requireRole(["teacher", "supervisor", "school_admin"]);
  const authenticated = await createClient();
  const { data: allowed, error: accessError } = await authenticated.rpc("can_view_student", {
    p_student_id: studentId,
  });
  if (accessError) throw new Error("La vérification de l’accès à cet élève a échoué.");
  if (allowed !== true) return null;

  const store = new SupabaseAssessmentStore(createServiceClient(), {
    cache: sharedReleaseContentCache,
    namespace: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  });
  const current = await store.latestSession(studentId);
  if (!current) return null;

  const view = sessionView(current.session.state, current.bundle.assessment.skills);
  const scope = current.bundle.assessment.releaseScope
    ? inspectReleaseScope(current.bundle.assessment.skills, current.bundle.assessment.releaseScope)
    : null;
  const details = Object.fromEntries(current.bundle.assessment.skills.map((skill) => [skill.id, {
    labelFr: skill.labelFr,
    domain: skill.domain ?? skill.branch,
    ...(skill.samplingGroup ? { samplingGroup: skill.samplingGroup } : {}),
    mode: skill.modes[0] ?? "recognition",
    assessmentAvailable: scope ? scope.assessmentSkillIds.has(skill.id) : true,
  }]));
  const teaching = current.session.state.teaching;
  const currentLesson = teaching
    ? current.bundle.teachingContent?.find((lesson) => lesson.id === teaching.contentId) ?? null
    : null;
  const refinements = current.session.state.refinements ?? [];

  return {
    phase: view.phase,
    provisional: view.provisional,
    completionReason: current.session.state.completionReason,
    answeredCount: current.session.state.observations.filter((observation) => !observation.skipped).length,
    skippedCount: current.session.state.observations.filter((observation) => observation.skipped).length,
    activeSeconds: current.session.state.activeSeconds,
    supportedSkillCount: scope?.assessmentSkillIds.size ?? current.bundle.assessment.skills.length,
    unsupportedSkillCount: scope?.deferredSkillIds.length ?? 0,
    limitationFr: scope?.scope.limitationFr ?? null,
    learningProgress: {
      completedGuidedLessons: new Set(current.session.state.completedTeachingIds ?? []).size,
      independentChecks: refinements.length,
      successfulIndependentChecks: refinements.filter((observation) => observation.correct).length,
      currentGuided: teaching && currentLesson ? {
        titleFr: currentLesson.titleFr,
        phase: teaching.phase,
        exerciseIndex: teaching.exerciseIndex,
        totalExercises: currentLesson.practice.length,
      } : null,
    },
    results: view.results,
    details,
  };
}
