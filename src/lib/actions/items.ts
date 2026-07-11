"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

const reviewSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["human_approved", "rejected"]),
  promptFr: z.string().trim().min(5).max(4000).optional(),
  correctAnswer: z.string().trim().max(1000).nullable().optional(),
  note: z.string().trim().max(1000).optional(),
});

export async function reviewCompetencyItem(input: unknown) {
  const reviewer = await requireRole(["platform_admin"]);
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) throw new Error("Données invalides.");
  const data = parsed.data;
  const supabase = await createClient();
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
  const { error } = await supabase.from("competency_items").update(update).eq("id", data.id);
  if (error) throw new Error(error.message);
  await logAudit(`competency_item.${data.decision === "human_approved" ? "approved" : "rejected"}`, { targetType: "competency_item", targetId: data.id, metadata: data.note ? { note: data.note } : {} });
  revalidatePath("/admin/items"); revalidatePath("/admin/items/review");
  return { ok: true };
}
