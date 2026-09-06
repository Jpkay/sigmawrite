"use server";

import { z } from "zod";
import { requireActiveReviewer, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { gradePracticeResponse } from "@/lib/practice/grade-response";

const responseSchema = z.object({ id: z.string().uuid(), selectedChoiceId: z.string().uuid().optional(), answerText: z.string().max(4000).optional() });

/** Read and grade only. Never creates a session, attempt, XP or mastery update. */
export async function checkReviewPreview(input: unknown) {
  const reviewer = await requireRole(["platform_admin", "content_reviewer"]);
  if (reviewer.role === "content_reviewer") await requireActiveReviewer();
  const data = responseSchema.parse(input);
  const db = await createClient();
  if (reviewer.role === "content_reviewer") {
    const { data: assignment, error: assignmentError } = await db.from("competency_item_review_assignments").select("item_id").eq("item_id", data.id).eq("reviewer_profile_id", reviewer.id).maybeSingle();
    if (assignmentError || !assignment) throw new Error("Cet exercice ne vous est pas attribué.");
  }
  const { data: item, error } = await db.from("competency_items").select("id,prompt_fr,instructions_fr,modality,response_type,validator_type,validator_config,correct_answer,acceptable_answers,competency_nodes(key),competency_item_choices(id,is_correct,feedback_fr)").eq("id", data.id).single();
  if (error || !item) throw new Error("Exercice introuvable.");
  return gradePracticeResponse({ ...item, acceptable_answers: item.acceptable_answers ?? [] }, item.competency_item_choices, data);
}
