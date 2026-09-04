"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { renderPendingDictationAudio } from "@/lib/dictation/audio";

const decisionSchema = z.object({ dictationId: z.string().uuid(), decision: z.enum(["human_approved", "rejected", "needs_human_review"]) });

export type AdminDictationRow = { id: string; key: string; title: string; kind: string; wordCount: number; gradeMin: number; gradeMax: number; focus: string | null; reviewStatus: string; audioStatus: string; audioError: string | null; audioModel: string | null; segments: string[]; attempts: number };

export async function loadAdminDictations(): Promise<AdminDictationRow[]> {
  await requireRole(["platform_admin"]);
  const service = createServiceClient();
  const [{ data, error }, { data: attempts }] = await Promise.all([
    service.from("dictations").select("id,key,title_fr,kind,word_count,grade_min,grade_max,focus_fr,review_status,audio_status,audio_error,audio_model,segments").order("grade_min").order("key"),
    service.from("dictation_attempts").select("dictation_id").not("submitted_at", "is", null),
  ]);
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  for (const attempt of attempts ?? []) counts.set(attempt.dictation_id as string, (counts.get(attempt.dictation_id as string) ?? 0) + 1);
  return (data ?? []).map((row) => ({
    id: row.id as string, key: row.key as string, title: row.title_fr as string, kind: row.kind as string, wordCount: Number(row.word_count), gradeMin: Number(row.grade_min), gradeMax: Number(row.grade_max), focus: row.focus_fr as string | null,
    reviewStatus: row.review_status as string, audioStatus: row.audio_status as string, audioError: row.audio_error as string | null, audioModel: row.audio_model as string | null,
    segments: (row.segments as { text: string }[]).map((segment) => segment.text), attempts: counts.get(row.id as string) ?? 0,
  }));
}

/** Human approval of a dictée text; recorded with reviewer identity and audited. */
export async function reviewDictation(input: unknown) {
  const session = await requireRole(["platform_admin"]);
  const data = decisionSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_dictation", { p_dictation_id: data.dictationId, p_decision: data.decision, p_reviewer: session.id });
  if (error) throw new Error(error.message);
  await logAudit("content.dictation_reviewed", { targetType: "dictation", targetId: data.dictationId, metadata: { decision: data.decision } });
  revalidatePath("/admin/dictations"); revalidatePath("/student/dictee");
  return { ok: true };
}

/** Renders pending audio now instead of waiting for the hourly job. */
export async function renderDictationAudioNow() {
  await requireRole(["platform_admin"]);
  const result = await renderPendingDictationAudio(createServiceClient(), { limit: 10 });
  await logAudit("content.dictation_audio_rendered", { targetType: "dictation", targetId: "batch", metadata: result });
  revalidatePath("/admin/dictations"); revalidatePath("/student/dictee");
  return result;
}
