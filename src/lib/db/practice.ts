import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { itemRatingFromDifficulty, orderByTargetSuccess } from "@/lib/scoring/elo";
import { conjugationLesson } from "@/lib/conjugation/lessons";
import {
  PRONOUN_PRACTICE_NODE_KEY,
  pronounLesson,
  selectPronounPracticeItems,
} from "@/lib/grammar/pronouns";
import { predictedSuccess, selectOptimalPracticeItems } from "@/lib/practice/session";

export type CatchUpStep = {
  nodeId: string;
  key: string;
  label: string;
  depth: number;
  mastery: number;
  status?: "pending" | "available" | "in_progress";
  requiredEvidenceExpectation?: "receptive" | "controlled_production" | "independent_production";
};

export async function getCatchUpPlan(studentId: string, client?: SupabaseClient): Promise<CatchUpStep[]> {
  const supabase = client ?? await createClient();
  const { data: activePath, error: pathError } = await supabase.from("student_learning_paths")
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pathError) throw new Error(pathError.message);
  if (activePath) {
    const { data: steps, error: stepError } = await supabase.from("student_learning_path_steps")
      .select("node_id,position,mastery_snapshot,status,required_evidence_expectation")
      .eq("path_id", activePath.id)
      .in("status", ["available", "pending", "in_progress"])
      .order("position")
      .limit(12);
    if (stepError) throw new Error(stepError.message);
    const pathNodeIds = (steps ?? []).map((step) => step.node_id as string);
    const { data: pathNodes, error: pathNodeError } = pathNodeIds.length
      ? await supabase.from("competency_nodes").select("id,key,label_fr").in("id", pathNodeIds)
      : { data: [], error: null };
    if (pathNodeError) throw new Error(pathNodeError.message);
    const nodeById = new Map((pathNodes ?? []).map((node) => [node.id as string, node]));
    return (steps ?? []).map((step) => ({
      nodeId: step.node_id as string,
      key: nodeById.get(step.node_id as string)?.key as string ?? step.node_id as string,
      label: nodeById.get(step.node_id as string)?.label_fr as string ?? step.node_id as string,
      depth: Math.max(0, (steps?.length ?? 1) - Number(step.position)),
      mastery: Number(step.mastery_snapshot),
      status: step.status as CatchUpStep["status"],
      requiredEvidenceExpectation: step.required_evidence_expectation as CatchUpStep["requiredEvidenceExpectation"] ?? undefined,
    }));
  }
  // Backward-compatible fallback for students whose legacy diagnostic predates
  // persisted graph-derived learning paths.
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
    status: "available",
  }));
}

export async function getNodePractice(nodeId: string, client?: SupabaseClient, studentId?: string) {
  const supabase = client ?? await createClient();
  const { data: node, error: nodeError } = await supabase.from("competency_nodes").select("id,key,label_fr,description_fr,strand").eq("id", nodeId).single();
  if (nodeError || !node) throw new Error("Compétence introuvable.");
  const { data: itemRows, error } = await supabase.from("competency_items")
    .select("id,prompt_fr,instructions_fr,response_type,validator_type,validator_config,correct_answer,acceptable_answers,difficulty,difficulty_rating,competency_item_choices(id,choice_text,position,feedback_fr)")
    .eq("primary_node_id", nodeId).in("review_status", ["auto_approved", "human_approved"])
    .in("validator_type", ["exact", "regex", "conjugator", "agreement", "grammalecte"]).order("difficulty").limit(80);
  if (error) throw new Error(error.message);
  // Practice targets ~82% predicted success (Elo/1PL) when the learner has a
  // rating; without one the authored easy→hard order stands.
  let learnerRating = 0;
  let completedPracticeSessions = 0;
  if (studentId && (itemRows?.length ?? 0) > 0) {
    const { data: rating } = await supabase.from("student_ability_ratings")
      .select("rating").eq("student_id", studentId).eq("strand", node.strand as string).maybeSingle();
    learnerRating = Number(rating?.rating ?? 0);
    if (node.key === PRONOUN_PRACTICE_NODE_KEY) {
      const { count, error: sessionError } = await supabase.from("practice_learning_sessions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("node_id", nodeId)
        .eq("status", "completed");
      if (sessionError) throw new Error(sessionError.message);
      completedPracticeSessions = count ?? 0;
    }
  }
  const ratedItems = (itemRows ?? []).map((item) => ({
    ...item,
    difficultyRating: item.difficulty_rating != null
      ? Number(item.difficulty_rating)
      : itemRatingFromDifficulty(item.difficulty == null ? null : Number(item.difficulty)),
    responseType: item.response_type as string,
    validatorConfig: item.validator_config as Record<string, unknown> | null,
  }));
  const items = node.key === PRONOUN_PRACTICE_NODE_KEY
    ? selectPronounPracticeItems(ratedItems, completedPracticeSessions, learnerRating)
    : selectOptimalPracticeItems(
      studentId ? orderByTargetSuccess(ratedItems, (item) => item.difficultyRating, learnerRating) : ratedItems,
      learnerRating,
    );
  let scaffoldLevel = 0;
  if(studentId){const{data:estimate}=await supabase.from("student_competency_estimates").select("scaffold_level").eq("student_id",studentId).eq("node_id",nodeId).maybeSingle();scaffoldLevel=Number(estimate?.scaffold_level??0);}
  return { node: { id: node.id as string, key: node.key as string, label: node.label_fr as string, description: node.description_fr as string | null, strand: node.strand as string }, scaffoldLevel,
    lesson: node.strand === "conjugaison"
      ? conjugationLesson(node.key as string, node.label_fr as string)
      : node.key === PRONOUN_PRACTICE_NODE_KEY
        ? pronounLesson(completedPracticeSessions, node.label_fr as string)
        : null,
    items: items.map((item) => ({
    id: item.id as string, promptFr: item.prompt_fr as string, instructionsFr: item.instructions_fr as string | null,
    responseType: item.response_type as string, validatorType: item.validator_type as string,
    validatorConfig: item.validatorConfig, correctAnswer: item.correct_answer as string | null,
    acceptableAnswers: item.acceptable_answers as string[], difficulty: item.difficulty == null ? null : Number(item.difficulty),
    predictedSuccess: predictedSuccess(learnerRating, item.difficultyRating),
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
