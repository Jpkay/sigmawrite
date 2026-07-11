import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type CompetencyItemRow = {
  id: string; nodeId: string; nodeKey: string; nodeLabel: string; strand: string;
  promptFr: string; correctAnswer: string | null; responseType: string; validatorType: string;
  difficulty: number | null; reviewStatus: string; qcGates: Record<string, unknown>;
  psychometricFlags: unknown[]; generationModel: string | null; promptVersion: string | null;
  choices: Array<{ id: string; text: string; correct: boolean; feedbackFr: string | null }>;
};

export async function getCompetencyItems(filters: { status?: string; node?: string } = {}, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  let query = supabase.from("competency_items").select("id,primary_node_id,strand,prompt_fr,correct_answer,response_type,validator_type,difficulty,review_status,qc_gates,psychometric_flags,generation_model,prompt_version,competency_nodes!inner(key,label_fr),competency_item_choices(id,choice_text,is_correct,feedback_fr)").order("updated_at", { ascending: false }).limit(500);
  if (filters.status) query = query.eq("review_status", filters.status);
  if (filters.node) query = query.eq("competency_nodes.key", filters.node);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const node = row.competency_nodes as unknown as { key: string; label_fr: string };
    const choices = row.competency_item_choices as unknown as Array<{ id: string; choice_text: string; is_correct: boolean; feedback_fr: string | null }>;
    return {
      id: row.id as string, nodeId: row.primary_node_id as string, nodeKey: node.key, nodeLabel: node.label_fr,
      strand: row.strand as string, promptFr: row.prompt_fr as string, correctAnswer: row.correct_answer as string | null,
      responseType: row.response_type as string, validatorType: row.validator_type as string,
      difficulty: row.difficulty == null ? null : Number(row.difficulty), reviewStatus: row.review_status as string,
      qcGates: (row.qc_gates ?? {}) as Record<string, unknown>, psychometricFlags: (row.psychometric_flags ?? []) as unknown[],
      generationModel: row.generation_model as string | null, promptVersion: row.prompt_version as string | null,
      choices: choices.map((choice) => ({ id: choice.id, text: choice.choice_text, correct: choice.is_correct, feedbackFr: choice.feedback_fr })),
    } satisfies CompetencyItemRow;
  });
}

export async function getGenerationRuns(client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase.from("generation_runs").select("*").order("started_at", { ascending: false }).limit(30);
  if (error) throw new Error(error.message);
  return data ?? [];
}
