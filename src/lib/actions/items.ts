"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveReviewer, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

const reviewSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["human_approved", "rejected"]),
  promptFr: z.string().trim().min(5).max(4000).optional(),
  correctAnswer: z.string().trim().max(1000).nullable().optional(),
  note: z.string().trim().max(1000).optional(),
});

const reviewablePromptVersions = ["diagnostic-bank-v2", "taxonomy-v3-practice-v1"] as const;

export async function reviewCompetencyItem(input: unknown) {
  const reviewer = await requireRole(["platform_admin", "content_reviewer"]);
  if (reviewer.role === "content_reviewer") await requireActiveReviewer();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) throw new Error("Données invalides.");
  const data = parsed.data;
  const supabase = await createClient();
  if (reviewer.role === "content_reviewer") {
    const { data: updated, error } = await supabase.rpc("submit_competency_item_review", {
      p_item_id: data.id,
      p_decision: data.decision,
      p_prompt_fr: data.promptFr ?? "",
      p_correct_answer: data.correctAnswer ?? null,
      p_note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Cet item n’est plus en attente de revue.");
    revalidatePath("/admin/items"); revalidatePath("/admin/items/review"); revalidatePath("/review/exercises");
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
  if (error) throw new Error(error.message);
  if (!updated) throw new Error("Cet item n’est plus en attente de revue.");
  await logAudit(`competency_item.${data.decision === "human_approved" ? "approved" : "rejected"}`, { targetType: "competency_item", targetId: data.id, metadata: data.note ? { note: data.note } : {} });
  revalidatePath("/admin/items"); revalidatePath("/admin/items/review"); revalidatePath("/review/exercises");
  return { ok: true };
}
