import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logAudit } from "@/lib/audit";
import { moderateStudentText } from "./moderate-input";

/**
 * Student free text gate, shared outside src/lib/actions/student.ts (where
 * the original private helper lives): action rate limit, daily AI budget,
 * moderation, audit of rejections. Same behaviour and messages.
 * `supabase` is the student's own client (the RPCs check the session).
 */
export async function moderateOrReject(input: { supabase: SupabaseClient; studentId: string; text: string; field: string }) {
  const { data: limit, error: limitError } = await input.supabase.rpc("consume_student_action", { p_scope: "free_text" });
  if (limitError) throw new Error("La vérification de sécurité a échoué. Réessaie.");
  const limitResult = Array.isArray(limit) ? limit[0] : limit;
  if (!limitResult?.allowed) throw new Error("Tu vas un peu vite. Fais une courte pause puis réessaie.");
  const { data: budget, error: budgetError } = await input.supabase.rpc("consume_student_llm_budget", { p_student_id: input.studentId, p_units: 1 });
  const budgetResult = Array.isArray(budget) ? budget[0] : budget;
  if (budgetError || !budgetResult?.allowed) throw new Error("La limite quotidienne est atteinte. Tu pourras reprendre demain.");
  const moderation = await moderateStudentText(input.text);
  if (moderation.allowed) return moderation;
  await logAudit("student.free_text_rejected", {
    targetType: "student",
    targetId: input.studentId,
    metadata: { field: input.field, categories: moderation.categories, moderationSource: moderation.source, characterCount: input.text.length },
  });
  throw new Error("Ta réponse n'a pas pu être enregistrée.");
}
