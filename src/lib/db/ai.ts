import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type PromptVersion = {
  id: string;
  promptKey: string;
  versionNumber: number;
  promptText: string;
  schema: unknown;
  active: boolean;
  createdAt: string;
};

export type AIJob = {
  id: string;
  jobType: string;
  status: string;
  provider: string | null;
  modelId: string | null;
  promptKey: string | null;
  promptVersion: number | null;
  durationMs: number | null;
  gateOutcomes: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

function promptFromRow(row: Record<string, unknown>): PromptVersion {
  return {
    id: row.id as string,
    promptKey: row.prompt_key as string,
    versionNumber: row.version_number as number,
    promptText: row.prompt_text as string,
    schema: row.schema,
    active: !!row.active,
    createdAt: row.created_at as string,
  };
}

export async function getActivePrompt(promptKey: string, client?: SupabaseClient): Promise<PromptVersion> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase.from("prompt_versions")
    .select("id,prompt_key,version_number,prompt_text,schema,active,created_at")
    .eq("prompt_key", promptKey).eq("active", true).single();
  if (error || !data) throw new Error(`Aucun prompt actif pour ${promptKey}.`);
  return promptFromRow(data as Record<string, unknown>);
}

export async function getPromptVersions(client?: SupabaseClient): Promise<PromptVersion[]> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase.from("prompt_versions")
    .select("id,prompt_key,version_number,prompt_text,schema,active,created_at")
    .order("prompt_key").order("version_number", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => promptFromRow(row as Record<string, unknown>));
}

export async function getAIJobs(client?: SupabaseClient, limit = 100): Promise<AIJob[]> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase.from("ai_generation_jobs")
    .select("id,job_type,status,provider,model_id,prompt_key,prompt_version,duration_ms,gate_outcomes,error_message,created_at,completed_at")
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    jobType: row.job_type as string,
    status: row.status as string,
    provider: row.provider as string | null,
    modelId: row.model_id as string | null,
    promptKey: row.prompt_key as string | null,
    promptVersion: row.prompt_version as number | null,
    durationMs: row.duration_ms as number | null,
    gateOutcomes: (row.gate_outcomes ?? {}) as Record<string, unknown>,
    errorMessage: row.error_message as string | null,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | null,
  }));
}
