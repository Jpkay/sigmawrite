"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCurrentStudentId } from "@/lib/db/student";
import { requireStudentAccessAuthorized } from "@/lib/diagnostic/access";
import { journalStudentPayload } from "@/lib/diagnostic/granular/server-delivery-journal";
import { coachReadingLanguage } from "@/lib/linguistic/language-coach";
import { shouldOfferLanguageTip, type CoachingResult } from "@/lib/content/language-coaching";

const request = z.object({ attemptId: z.string().uuid(), requested: z.boolean() });
/** Reads only the caller's saved successful answer. Coaching never changes its grade. */
export async function getPracticeLanguageCoaching(input: unknown): Promise<CoachingResult> {
  await requireRole(["student"]);
  const data = request.parse(input);
  const userDb = await createClient();
  const studentId = await getCurrentStudentId(userDb);
  await requireStudentAccessAuthorized(userDb, studentId);
  const { data: owned, error } = await userDb.from("competency_attempts").select("id,student_id").eq("id", data.attemptId).eq("student_id", studentId).single();
  if (error || !owned) throw new Error("Réponse introuvable.");
  const ownedAttemptId = owned.id;
  const db = createServiceClient();
  const { data: attempt } = await db.from("competency_attempts").select("id,student_id,item_id,answer_text,is_correct,attempted_at,context").eq("id", ownedAttemptId).eq("student_id", studentId).single();
  if (!attempt?.is_correct || attempt.context !== "practice" || !attempt.answer_text) return { tip: null, available: true };
  const { data: item } = await db.from("competency_items").select("prompt_fr,validator_config").eq("id", attempt.item_id).single();
  if (!item?.validator_config?.readingRubric) return { tip: null, available: true };
  const column = data.requested ? "requested_result" : "automatic_result";
  const { data: cache } = await db.from("reading_language_coaching").select("automatic_result,requested_result").eq("attempt_id", attempt.id).maybeSingle();
  async function deliver(result: CoachingResult) {
    await journalStudentPayload(studentId, "legacy:practice-language-tip", {...result, attemptId: ownedAttemptId});
    return result;
  }
  if (cache?.[column]) return deliver(cache[column] as CoachingResult);
  if (!data.requested) {
    const { data: ordinal, error: ordinalError } = await db.rpc("reading_coaching_ordinal", { p_student_id: attempt.student_id, p_attempt_id: attempt.id });
    if (ordinalError || !shouldOfferLanguageTip(Number(ordinal))) return { tip: null, available: true };
  }
  const { data: previous } = await db.from("competency_attempts").select("answer_text").eq("student_id", attempt.student_id).eq("context", "practice").lt("attempted_at", attempt.attempted_at).not("answer_text", "is", null).order("attempted_at", { ascending: false }).limit(3);
  const result = await coachReadingLanguage({ answer: attempt.answer_text, prompt: item.prompt_fr, previousAnswers: (previous ?? []).map((row) => String(row.answer_text).slice(0,2000)), requested: data.requested });
  if (result.available) await db.from("reading_language_coaching").upsert({ attempt_id: attempt.id, student_id: attempt.student_id, [column]: result }, { onConflict: "attempt_id" });
  return deliver(result);
}
