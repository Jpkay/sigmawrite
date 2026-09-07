"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveReviewer, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reviewErrorMessage } from "@/lib/content/review-errors";
import { logAudit } from "@/lib/audit";

const reviewSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["human_approved", "rejected"]),
  promptFr: z.string().trim().min(5).max(4000).optional(),
  correctAnswer: z.string().trim().max(1000).nullable().optional(),
  note: z.string().trim().max(1000).optional(),
  assignmentMode: z.boolean().optional(),
});

const reviewablePromptVersions = ["diagnostic-bank-v2", "taxonomy-v3-practice-v1"] as const;

const diagnosticAssignmentSchema = z.object({
  reviewerIds: z.array(z.string().uuid()).min(1).max(20),
});

export async function assignDiagnosticItemReviews(input: unknown) {
  await requireRole(["platform_admin"]);
  const parsed = diagnosticAssignmentSchema.safeParse(input);
  if (!parsed.success) throw new Error("Sélection d’évaluateurs invalide.");
  const reviewerIds = [...new Set(parsed.data.reviewerIds)];
  const { data, error } = await (await createClient()).rpc("assign_diagnostic_item_reviews", {
    p_reviewer_ids: reviewerIds,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/items/review");
  revalidatePath("/review");
  revalidatePath("/review/exercises");
  return { ok: true, assigned: Number(data ?? 0) };
}

export async function reviewCompetencyItem(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const reviewer = await requireRole(["platform_admin", "content_reviewer"]);
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Vérifiez l’énoncé et la réponse avant d’enregistrer votre avis." };
  const data = parsed.data;
  const supabase = await createClient();
  if (reviewer.role === "content_reviewer" || data.assignmentMode) {
    await requireActiveReviewer();
    const { data: assignment, error: assignmentError } = await supabase.from("competency_item_review_assignments")
      .select("status")
      .eq("item_id", data.id)
      .eq("reviewer_profile_id", reviewer.id)
      .maybeSingle();
    if (assignmentError) return { ok: false, error: reviewErrorMessage(assignmentError.message) };
    const rpc = assignment?.status === "submitted" ? "revise_competency_item_review" : "submit_competency_item_review";
    const { data: updated, error } = await supabase.rpc(rpc, {
      p_item_id: data.id,
      p_decision: data.decision,
      p_prompt_fr: data.promptFr ?? "",
      p_correct_answer: data.correctAnswer ?? null,
      p_note: data.note ?? null,
    });
    if (error) return { ok: false, error: reviewErrorMessage(error.message) };
    if (!updated) return { ok: false, error: reviewErrorMessage("item_not_reviewable") };
    revalidatePath("/review"); revalidatePath("/admin/items/themes"); revalidatePath("/admin/items"); revalidatePath("/admin/items/review"); revalidatePath("/review/exercises");
    return { ok: true };
  }
  const update: Record<string, unknown> = {
    review_status: data.decision,
    reviewer_profile_id: reviewer.id,
    review_note: data.note ?? null,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    generation_type: data.decision === "human_approved" ? "ai_human_reviewed" : "ai",
  };
  if (data.promptFr !== undefined) update.prompt_fr = data.promptFr;
  if (data.correctAnswer !== undefined) update.correct_answer = data.correctAnswer;
  const { data: updated, error } = await supabase.from("competency_items")
    .update(update)
    .eq("id", data.id)
    .in("prompt_version", reviewablePromptVersions)
    .eq("review_status", "needs_human_review")
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: reviewErrorMessage(error.message) };
  if (!updated) return { ok: false, error: reviewErrorMessage("item_not_reviewable") };
  await logAudit(`competency_item.${data.decision === "human_approved" ? "approved" : "rejected"}`, { targetType: "competency_item", targetId: data.id, metadata: data.note ? { note: data.note } : {} });
  revalidatePath("/review"); revalidatePath("/admin/items/themes"); revalidatePath("/admin/items"); revalidatePath("/admin/items/review"); revalidatePath("/review/exercises");
  return { ok: true };
}

/** Edits remain pending until the reviewer explicitly approves or rejects. */
export async function saveReviewExercise(input: unknown) {
  const reviewer = await requireRole(["platform_admin", "content_reviewer"]);
  if (reviewer.role === "content_reviewer") await requireActiveReviewer();
  const { reviewEditSchema } = await import("@/lib/content/review-edit");
  const parsed = reviewEditSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Vérifiez les champs de l’exercice.");
  const data = parsed.data;
  const { error } = await (await createClient()).rpc("save_review_exercise_answers", {
    p_item_id: data.id, p_prompt_fr: data.promptFr, p_correct_answer: data.correctAnswer, p_choices: data.choices,
    p_acceptable_answers: data.acceptableAnswers ?? null, p_required_ideas: data.requiredIdeas ?? null,
  });
  if (error) throw new Error("Les modifications n’ont pas pu être enregistrées. L’exercice doit encore être en attente de relecture.");
  revalidatePath("/review"); revalidatePath("/admin/items/themes"); revalidatePath("/admin/items/review"); revalidatePath("/review/exercises");
  return data;
}
