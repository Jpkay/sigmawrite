import "server-only";

import { SupabaseAssessmentStore } from "@/lib/diagnostic/granular/store";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const TEACHER_CONTENT_KINDS = ["lesson", "passage", "exercise"] as const;
export type TeacherContentKind = (typeof TEACHER_CONTENT_KINDS)[number];
export const TEACHER_CONTENT_PAGE_SIZE = 20;

export function teacherContentKind(value: unknown): TeacherContentKind {
  return TEACHER_CONTENT_KINDS.includes(value as TeacherContentKind)
    ? value as TeacherContentKind : "lesson";
}

export async function getTeacherContent(kind: TeacherContentKind, page: number) {
  const offset = (Math.max(1, page) - 1) * TEACHER_CONTENT_PAGE_SIZE;
  const range = [offset, offset + TEACHER_CONTENT_PAGE_SIZE - 1] as const;
  if (kind !== "passage" && process.env.GRANULAR_DIAGNOSTIC_ENABLED === "true") {
    const service = createServiceClient();
    const store = new SupabaseAssessmentStore(service);
    const releaseId = await store.publishedReleaseId(process.env.GRANULAR_DIAGNOSTIC_RELEASE_KEY ?? "french-granular-diagnostic-v1");
    const bundle = releaseId ? await store.release(releaseId) : null;
    if (releaseId && bundle) {
      if (kind === "lesson") {
        const available = new Set((bundle.activities ?? []).filter((activity) => activity.status === "published" && activity.contentId).map((activity) => activity.contentId));
        const lessons = (bundle.teachingContent ?? []).filter((lesson) =>
          available.has(lesson.id) && (lesson.status === "published" || lesson.status === "published_pending_review"));
        return { count: lessons.length, rows: lessons.slice(offset, offset + TEACHER_CONTENT_PAGE_SIZE).map((lesson) => ({
          id: lesson.id, title: lesson.titleFr,
          status: lesson.status,
          body: [lesson.learnerQuestionFr, ...lesson.steps.flatMap((step) => [step.exampleFr, step.explanationFr]), lesson.takeawayFr, lesson.boundaryFr,
            ...lesson.practice.flatMap((exercise) => [exercise.promptFr, ...(exercise.choices ?? []), `Réponse : ${exercise.answerFr}`, exercise.explanationFr])],
          reviewSummary: [] as string[], targetKind: "granular_lesson", releaseId, contentKey: lesson.id,
        })) };
      }
      const available = new Set(bundle.assessment.probes.map((probe) => probe.id));
      const exercises = bundle.bank.items.filter((entry) => available.has(entry.itemKey));
      const labels = new Map(bundle.assessment.skills.map((skill) => [skill.nodeKey, skill.labelFr]));
      return { count: exercises.length, rows: exercises.slice(offset, offset + TEACHER_CONTENT_PAGE_SIZE).map((entry) => ({
        id: entry.itemKey,
        title: labels.get(entry.item.nodeKey) ?? entry.item.nodeKey,
        status: entry.reviewStatus,
        body: [entry.item.instructionsFr, entry.item.promptFr,
          ...(entry.item.choices ?? []).map((choice) => `${choice.correct ? "✓ " : ""}${choice.text}`),
          entry.item.correctAnswer ? `Réponse : ${entry.item.correctAnswer}` : null].filter(Boolean) as string[],
        reviewSummary: [] as string[], targetKind: "granular_exercise", releaseId, contentKey: entry.itemKey,
      })) };
    }
    return { count: 0, rows: [] };
  }

  const db = await createClient();

  if (kind === "lesson") {
    const { data, count, error } = await db.from("competency_lessons")
      .select("id,explanation_fr,pattern_fr,examples_fr,exceptions_fr,review_status,competency_nodes!inner(label_fr)", { count: "exact" })
      .in("review_status", ["auto_approved", "human_approved"])
      .order("updated_at", { ascending: false }).range(...range);
    if (error) throw new Error(error.message);
    return { count: count ?? 0, rows: (data ?? []).map((row) => ({
      id: row.id as string,
      title: (row.competency_nodes as unknown as { label_fr: string }).label_fr,
      status: row.review_status as string,
      body: [row.explanation_fr, row.pattern_fr, ...((row.examples_fr ?? []) as string[]), ...((row.exceptions_fr ?? []) as string[])].filter(Boolean) as string[],
      reviewSummary: [] as string[],
      targetKind: "lesson", releaseId: null, contentKey: null,
    })) };
  }

  if (kind === "passage") {
    const { data, count, error } = await db.from("text_versions")
      .select("id,title,body,review_status,texts!inner(status)", { count: "exact" })
      .eq("texts.status", "active")
      .in("review_status", ["human_approved", "benchmark_locked"])
      .order("created_at", { ascending: false }).range(...range);
    if (error) throw new Error(error.message);
    // This read is based only on the approved version IDs returned through the
    // teacher's RLS-scoped client. Editorial assignment metadata stays private.
    const publishedIds = (data ?? []).map((row) => row.id as string);
    const reviewNotes = new Map<string, string[]>();
    if (publishedIds.length) {
      const { data: versions, error: reviewError } = await createServiceClient()
        .from("content_review_versions")
        .select("published_text_version_id,review_assignments(status,passage_reviews(status,general_comment))")
        .in("published_text_version_id", publishedIds);
      if (reviewError) throw new Error(reviewError.message);
      for (const version of versions ?? []) {
        const notes = ((version.review_assignments ?? []) as unknown as Array<{
          status: string;
          passage_reviews: { status: string; general_comment: string | null } | Array<{ status: string; general_comment: string | null }> | null;
        }>).filter((assignment) => assignment.status === "submitted")
          .flatMap((assignment) => assignment.passage_reviews == null ? []
            : Array.isArray(assignment.passage_reviews) ? assignment.passage_reviews : [assignment.passage_reviews])
          .filter((review) => review.status === "submitted" && review.general_comment?.trim())
          .map((review) => review.general_comment!.trim());
        reviewNotes.set(version.published_text_version_id as string, notes);
      }
    }
    return { count: count ?? 0, rows: (data ?? []).map((row) => ({
      id: row.id as string, title: row.title as string, status: row.review_status as string,
      body: [row.body as string],
      reviewSummary: reviewNotes.get(row.id as string) ?? [],
      targetKind: "passage", releaseId: null, contentKey: null,
    })) };
  }

  const { data, count, error } = await db.from("competency_items")
    .select("id,prompt_fr,instructions_fr,correct_answer,review_status,competency_nodes!inner(label_fr),competency_item_choices(choice_text,is_correct,position)", { count: "exact" })
    .in("review_status", ["auto_approved", "human_approved"])
    .order("created_at", { ascending: false }).range(...range);
  if (error) throw new Error(error.message);
  return { count: count ?? 0, rows: (data ?? []).map((row) => ({
    id: row.id as string,
    title: (row.competency_nodes as unknown as { label_fr: string }).label_fr,
    status: row.review_status as string,
    body: [
      row.instructions_fr, row.prompt_fr,
      ...((row.competency_item_choices ?? []) as Array<{ choice_text: string; is_correct: boolean; position: number }>).
        sort((a, b) => a.position - b.position).
        map((choice) => `${choice.is_correct ? "✓ " : ""}${choice.choice_text}`),
      row.correct_answer ? `Réponse : ${row.correct_answer}` : null,
    ].filter(Boolean) as string[],
    reviewSummary: [] as string[],
    targetKind: "exercise", releaseId: null, contentKey: null,
  })) };
}
