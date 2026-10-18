import "server-only";
/**
 * Server side of "Explique avec tes mots" (D.5): moderation of the student's
 * text (same rules as moderateOrReject in actions/student.ts: rate limit,
 * daily AI budget, moderation, audit on rejection) and the constrained model
 * check behind the provider layer. The mock provider is never trusted as a
 * judge: without a real model the check is "uncertain" (multiple choice).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAIProvider, getAIProviderInfo } from "@/lib/ai";
import { logAudit } from "@/lib/audit";
import { moderateStudentText } from "@/lib/safety/moderate-input";
import type { Judge } from "./explain";
import { judgeFromProvider } from "./explain-judge";

export async function moderateWordExplanation(input: { supabase: SupabaseClient; studentId: string; text: string }): Promise<void> {
  const { data: limit, error: limitError } = await input.supabase.rpc("consume_student_action", { p_scope: "free_text" });
  const limitResult = Array.isArray(limit) ? limit[0] : limit;
  if (limitError) throw new Error("La vérification de sécurité a échoué. Réessaie.");
  if (!limitResult?.allowed) throw new Error("Tu vas un peu vite. Fais une courte pause puis réessaie.");
  const { data: budget, error: budgetError } = await input.supabase.rpc("consume_student_llm_budget", { p_student_id: input.studentId, p_units: 1 });
  const budgetResult = Array.isArray(budget) ? budget[0] : budget;
  if (budgetError || !budgetResult?.allowed) throw new Error("La limite quotidienne est atteinte. Tu pourras reprendre demain.");
  const moderation = await moderateStudentText(input.text);
  if (moderation.allowed) return;
  await logAudit("student.free_text_rejected", {
    targetType: "student",
    targetId: input.studentId,
    metadata: { field: "word_explanation", categories: moderation.categories, moderationSource: moderation.source, characterCount: input.text.length },
  });
  throw new Error("Ta réponse n'a pas pu être enregistrée.");
}

/** The real model check, or null when only the mock provider is configured. */
export function providerJudge(): Judge | null {
  if (process.env.WORD_EXPLAIN_MODEL_ENABLED === "false") return null;
  if (getAIProviderInfo().provider === "mock") return null;
  return judgeFromProvider(getAIProvider());
}
