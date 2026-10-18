import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditorialSettings } from "./kill-switch";
import type { RunLogger, StepLog } from "./team";
import { EDITORIAL_PIPELINE_VERSION, type EditorialKind, type EditorialMode } from "./types";

/** Persistence of runs and steps (editorial_runs / editorial_run_steps). Service-role client only. */

export async function startRun(db: SupabaseClient, input: { mode: EditorialMode | "audit"; kind: EditorialKind | "saga_outline" | "fallback_chapter" | "audit"; brief: unknown; sagaId?: string | null; chapterId?: string | null }): Promise<string> {
  const { data, error } = await db.from("editorial_runs").insert({
    mode: input.mode, kind: input.kind, brief: input.brief ?? {}, pipeline_version: EDITORIAL_PIPELINE_VERSION,
    saga_id: input.sagaId ?? null, chapter_id: input.chapterId ?? null,
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "editorial_run_not_created");
  return data.id as string;
}

export async function finishRun(db: SupabaseClient, runId: string, outcome: { status: "published" | "fallback" | "discarded" | "failed"; reasons?: string[]; rubricMean?: number | null; aiTells?: number | null; gates?: unknown; costUsd: number; latencyMs?: number }) {
  const { error } = await db.from("editorial_runs").update({
    status: outcome.status, decision_reasons: outcome.reasons ?? [], rubric_mean: outcome.rubricMean ?? null, ai_tells_score: outcome.aiTells ?? null,
    gates: outcome.gates ?? [], cost_usd: Number(outcome.costUsd.toFixed(5)), latency_ms: outcome.latencyMs ?? null, finished_at: new Date().toISOString(),
  }).eq("id", runId);
  if (error) throw new Error(error.message);
}

/** Logs each step; logging failures never break generation (the run row still records the outcome). */
export class SupabaseRunLogger implements RunLogger {
  private seq = 0;
  constructor(private readonly db: SupabaseClient, private readonly runId: string) {}
  async step(entry: StepLog) {
    this.seq += 1;
    await this.db.from("editorial_run_steps").insert({
      run_id: this.runId, seq: this.seq, role: entry.role, model: entry.model, prompt_version: entry.promptVersion, input_digest: entry.inputDigest,
      output: entry.output as object, score: entry.score, input_tokens: entry.inputTokens, output_tokens: entry.outputTokens,
      cost_usd: Number(entry.costUsd.toFixed(5)), latency_ms: entry.latencyMs,
    });
  }
}

export async function loadEditorialSettings(db: SupabaseClient): Promise<EditorialSettings | null> {
  const { data } = await db.from("editorial_settings").select("live_enabled,live_mode,auto_switch_reason").eq("id", true).maybeSingle();
  if (!data) return null;
  return { liveEnabled: Boolean(data.live_enabled), liveMode: data.live_mode === "library_only" ? "library_only" : "live", autoSwitchReason: (data.auto_switch_reason as string | null) ?? null };
}

export async function loadClassSwitches(db: SupabaseClient, studentId: string): Promise<boolean[]> {
  const { data: enrollments } = await db.from("enrollments").select("class_id").eq("student_id", studentId).eq("status", "active");
  const classIds = (enrollments ?? []).map((e) => e.class_id as string);
  if (classIds.length === 0) return [];
  const { data } = await db.from("editorial_class_controls").select("live_enabled").in("class_id", classIds);
  return (data ?? []).map((row) => Boolean(row.live_enabled));
}

/** Automatic quality switch (H.15): moves live generation to library texts. Never blocks a text by itself. */
export async function autoSwitchToLibrary(db: SupabaseClient, reason: string) {
  await db.from("editorial_settings").update({ live_mode: "library_only", auto_switch_reason: reason, auto_switched_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", true).eq("live_mode", "live");
}
