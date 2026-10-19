"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { renderPendingDictationAudio } from "@/lib/dictation/audio";
import { autoApproveDictation } from "@/lib/dictation/auto-approve";
import type { GateOutcome } from "@/lib/dictation/gates";

const decisionSchema = z.object({ dictationId: z.string().uuid(), decision: z.enum(["human_approved", "rejected", "needs_human_review"]) });

const takedownSchema = z.object({ dictationId: z.string().uuid(), reason: z.string().trim().max(500).optional() });

export type AdminDictationRow = {
  id: string; key: string; title: string; kind: string; wordCount: number; gradeMin: number; gradeMax: number; focus: string | null; reviewStatus: string; audioStatus: string; audioError: string | null; audioModel: string | null; segments: string[]; attempts: number;
  pipelineVersion: string | null; gates: GateOutcome[]; gatesPassed: boolean | null; autoApprovedAt: string | null; takenDownAt: string | null; takedownReason: string | null; themes: string[]; interests: string[];
};

export async function loadAdminDictations(): Promise<AdminDictationRow[]> {
  await requireRole(["platform_admin"]);
  const service = createServiceClient();
  const [{ data, error }, { data: attempts }] = await Promise.all([
    service.from("dictations").select("id,key,title_fr,kind,word_count,grade_min,grade_max,focus_fr,review_status,audio_status,audio_error,audio_model,segments,pipeline_version,gate_results,auto_approved_at,taken_down_at,takedown_reason,themes,interests").order("grade_min").order("key"),
    service.from("dictation_attempts").select("dictation_id").not("submitted_at", "is", null),
  ]);
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  for (const attempt of attempts ?? []) counts.set(attempt.dictation_id as string, (counts.get(attempt.dictation_id as string) ?? 0) + 1);
  return (data ?? []).map((row) => ({
    id: row.id as string, key: row.key as string, title: row.title_fr as string, kind: row.kind as string, wordCount: Number(row.word_count), gradeMin: Number(row.grade_min), gradeMax: Number(row.grade_max), focus: row.focus_fr as string | null,
    reviewStatus: row.review_status as string, audioStatus: row.audio_status as string, audioError: row.audio_error as string | null, audioModel: row.audio_model as string | null,
    segments: (row.segments as { text: string }[]).map((segment) => segment.text), attempts: counts.get(row.id as string) ?? 0,
    pipelineVersion: (row.pipeline_version as string | null) ?? (row.gate_results as { pipelineVersion?: string } | null)?.pipelineVersion ?? null,
    gates: Array.isArray((row.gate_results as { gates?: unknown } | null)?.gates) ? (row.gate_results as { gates: GateOutcome[] }).gates : [],
    gatesPassed: typeof (row.gate_results as { passed?: unknown } | null)?.passed === "boolean" ? (row.gate_results as { passed: boolean }).passed : null,
    autoApprovedAt: row.auto_approved_at as string | null, takenDownAt: row.taken_down_at as string | null, takedownReason: row.takedown_reason as string | null,
    themes: (row.themes as string[] | null) ?? [], interests: (row.interests as string[] | null) ?? [],
  }));
}

/** Human decision on a dictée text (approve, send back, restore after takedown); recorded with reviewer identity and audited. */
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

/** Takedown from the audit portal: the dictée disappears for students at once. */
export async function takeDownDictation(input: unknown) {
  const session = await requireRole(["platform_admin"]);
  const data = takedownSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.rpc("take_down_dictation", { p_dictation_id: data.dictationId, p_reason: data.reason ?? null, p_reviewer: session.id });
  if (error) throw new Error(error.message);
  await logAudit("content.dictation_taken_down", { targetType: "dictation", targetId: data.dictationId, metadata: { reason: data.reason ?? null } });
  revalidatePath("/admin/dictations"); revalidatePath("/student/dictee"); revalidatePath("/student");
  return { ok: true };
}

/** Runs the automatic gates now; a passing dictée is auto-approved and its audio queued. */
export async function runDictationGatesNow(input: unknown) {
  await requireRole(["platform_admin"]);
  const dictationId = z.string().uuid().parse(input);
  const outcome = await autoApproveDictation(createServiceClient(), { dictationId });
  await logAudit("content.dictation_gates_run", { targetType: "dictation", targetId: dictationId, metadata: { status: outcome.status, passed: outcome.report?.passed ?? null } });
  revalidatePath("/admin/dictations"); revalidatePath("/student/dictee");
  return { status: outcome.status };
}

/** Renders pending audio now instead of waiting for the hourly job. */
export async function renderDictationAudioNow() {
  await requireRole(["platform_admin"]);
  const result = await renderPendingDictationAudio(createServiceClient(), { limit: 10 });
  await logAudit("content.dictation_audio_rendered", { targetType: "dictation", targetId: "batch", metadata: result });
  revalidatePath("/admin/dictations"); revalidatePath("/student/dictee");
  return result;
}

/** Private audio preview, authorized independently of the student attempt flow. */
export async function loadDictationReviewAudio(input: unknown) {
  await requireRole(["platform_admin"]);
  const id = z.string().uuid().parse(input);
  const service = createServiceClient();
  const { data: row, error } = await service.from("dictations").select("key,segments,audio_status,audio_manifest").eq("id", id).single();
  if (error || !row) throw new Error("Dictée introuvable.");
  if (row.audio_status !== "ready") return null;
  const { signDictationAudio } = await import("@/lib/dictation/audio");
  const {resolveDictationAudioAssets}=await import("@/lib/dictation/audio-manifest");
  const assets=resolveDictationAudioAssets({id,key:row.key,segments:row.segments,audioManifest:row.audio_manifest});
  const [full, ...urls] = await signDictationAudio(service, [assets.fullPath,...assets.segmentPaths]);
  return { full, segments: urls };
}
