import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type CatchUpStep = { nodeId: string; key: string; label: string; depth: number; mastery: number };

export async function getCatchUpPlan(studentId: string, client?: SupabaseClient): Promise<CatchUpStep[]> {
  const supabase = client ?? await createClient();
  const { data: target } = await supabase.from("competency_nodes").select("id")
    .eq("key", "narration_passe").in("review_status", ["auto_approved", "human_approved"]).maybeSingle();
  if (!target) return [];
  const { data, error } = await supabase.rpc("student_catch_up_path", { p_student_id: studentId, p_target_node_id: target.id, p_threshold: 0.85 });
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((row: { node_id: string }) => row.node_id);
  const { data: nodes } = ids.length ? await supabase.from("competency_nodes").select("id,key,label_fr").in("id", ids) : { data: [] };
  const byId = new Map((nodes ?? []).map((node) => [node.id as string, node]));
  return (data ?? []).map((row: { node_id: string; depth: number; mastery: number | string }) => ({
    nodeId: row.node_id, key: byId.get(row.node_id)?.key as string ?? row.node_id,
    label: byId.get(row.node_id)?.label_fr as string ?? row.node_id,
    depth: row.depth, mastery: Number(row.mastery),
  }));
}

export async function getNodePractice(nodeId: string, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  const { data: node, error: nodeError } = await supabase.from("competency_nodes").select("id,key,label_fr,description_fr").eq("id", nodeId).single();
  if (nodeError || !node) throw new Error("Compétence introuvable.");
  const { data: items, error } = await supabase.from("competency_items")
    .select("id,prompt_fr,instructions_fr,response_type,validator_type,validator_config,correct_answer,acceptable_answers,difficulty,competency_item_choices(id,choice_text,position,feedback_fr)")
    .eq("primary_node_id", nodeId).in("review_status", ["auto_approved", "human_approved"]).order("difficulty").limit(8);
  if (error) throw new Error(error.message);
  return { node: { id: node.id as string, key: node.key as string, label: node.label_fr as string, description: node.description_fr as string | null }, items: (items ?? []).map((item) => ({
    id: item.id as string, promptFr: item.prompt_fr as string, instructionsFr: item.instructions_fr as string | null,
    responseType: item.response_type as string, validatorType: item.validator_type as string,
    validatorConfig: item.validator_config as Record<string, unknown> | null, correctAnswer: item.correct_answer as string | null,
    acceptableAnswers: item.acceptable_answers as string[], difficulty: item.difficulty == null ? null : Number(item.difficulty),
    choices: ((item.competency_item_choices ?? []) as Array<{ id: string; choice_text: string; position: number | null; feedback_fr: string | null }>).sort((a,b) => (a.position ?? 0)-(b.position ?? 0)).map((choice) => ({ id: choice.id, text: choice.choice_text, feedbackFr: choice.feedback_fr })),
  })) };
}

export async function recommendTextForNode(nodeId: string, band?: string, client?: SupabaseClient) {
  const supabase = client ?? await createClient();
  let query = supabase.from("text_version_nodes").select("text_versions!inner(id,title,difficulty_band,texts!inner(slug,status))")
    .eq("node_id", nodeId).eq("text_versions.texts.status", "active").in("text_versions.review_status", ["human_approved", "benchmark_locked"]);
  if (band) query = query.eq("text_versions.difficulty_band", band);
  const { data } = await query.limit(1).maybeSingle();
  const version = data?.text_versions as unknown as { id: string; title: string; texts: { slug: string } } | null;
  return version ? { id: version.texts.slug, title: version.title } : null;
}
