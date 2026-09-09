"use server";

import { PASSAGE_AUTOMATION_INSTRUCTION } from "@/lib/content/automation/policy";
import { publishPassage } from "@/lib/content/publish";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { runGenerationPipeline } from "@/lib/ai/pipeline";
import { getAIProvider, getAIProviderInfo } from "@/lib/ai";
import { generateTextRequestSchema } from "@/lib/ai/schemas";
import { rescoreCandidateBody } from "@/lib/content/workflow";
import { getContentCandidate } from "@/lib/db/content";
import { getActivePrompt } from "@/lib/db/ai";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPublishedKnowledgePackets } from "@/lib/db/knowledge";

const idInput = z.object({ id: z.string().uuid() });
const reviewInput = z.object({
  id: z.string().uuid(),
  decision: z.enum(["reject"]),
  note: z.string().trim().max(1000).optional(),
});
const rescoreInput = z.object({ id: z.string().uuid(), body: z.string().trim().min(80).max(20000) });
const promptActivationInput = z.object({ id: z.string().uuid() });

function checked<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error("Données invalides.");
  return result.data;
}

function refreshContent() {
  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath("/admin/content/review");
  revalidatePath("/admin/benchmarks");
  revalidatePath("/student");
}

export async function generateTextCandidate(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = checked(generateTextRequestSchema, input);
  const supabase = await createClient();
  const prompt = await getActivePrompt("text_generation", supabase);
  const groundingPackets = await getPublishedKnowledgePackets({
    interestKey: data.primaryInterest,
    conceptTerms: data.targetConcepts,
  }, supabase);
  const groundedInput = { ...data, groundingPackets };
  const { data: automationPolicy } = await supabase.from("passage_automation_policy").select("evaluator_model,pipeline_version").eq("id",true).maybeSingle();
  const selectiveScope = data.textType === "expository" && !!automationPolicy?.evaluator_model;
  const generationPrompt = selectiveScope
    ? `${prompt.promptText}\n\n${PASSAGE_AUTOMATION_INSTRUCTION}`
    : prompt.promptText;
  const providerInfo = getAIProviderInfo();
  const startedAt = Date.now();
  const { data: job, error: jobError } = await supabase.from("ai_generation_jobs").insert({
    job_type: "text_generation",
    status: "running",
    input_payload: {
      request: data,
      automationScope: selectiveScope ? automationPolicy?.pipeline_version : null,
      groundingPacketIds: groundingPackets.map((packet) => packet.packetVersionId),
      prompt: { key: prompt.promptKey, version: prompt.versionNumber },
      provider: providerInfo.provider,
      model: providerInfo.model,
    },
    provider: providerInfo.provider,
    model_id: providerInfo.model,
    prompt_key: prompt.promptKey,
    prompt_version: prompt.versionNumber,
  }).select("id").single();
  if (jobError || !job) throw new Error(jobError?.message ?? "Tâche de génération non créée.");
  try {
    let candidate = await runGenerationPipeline(groundedInput, { systemPrompt: generationPrompt });
    try {
      const embedding = await getAIProvider().embed({ text: `${candidate.generated.title}\n\n${candidate.generated.body}` });
      const { data: matches } = await supabase.rpc("match_text_versions", { p_embedding: `[${embedding.join(",")}]`, p_threshold: 0.92, p_limit: 3 });
      if (matches?.length) candidate = { ...candidate, flags: { ...candidate.flags, nearDuplicate: true }, reviewStatus: "needs_human_review" };
    } catch {
      // Generation may continue, but publication must fail closed when the
      // duplicate gate could not run.
      candidate = { ...candidate, flags: { ...candidate.flags, duplicateCheckUnavailable: true }, reviewStatus: "needs_human_review" };
    }
    const { error: candidateError } = await supabase.from("ai_generated_candidates").insert({
      id: candidate.id,
      generation_job_id: job.id,
      candidate_type: "reading_text",
      payload: candidate,
      review_status: candidate.reviewStatus,
    });
    if (candidateError) throw new Error(candidateError.message);
    const [{ error: scoringError }, { error: moderationError }] = await Promise.all([
      supabase.from("ai_scoring_results").insert({
        candidate_id: candidate.id,
        score_payload: {
          difficulty: candidate.difficulty,
          question_difficulties: candidate.questionDifficulties,
          flags: candidate.flags,
        },
      }),
      supabase.from("ai_moderation_results").insert({
        candidate_id: candidate.id,
        moderation_payload: candidate.moderation,
        passed: candidate.moderation.passed,
      }),
    ]);
    if (scoringError || moderationError) {
      await supabase.from("ai_generated_candidates").delete().eq("id", candidate.id);
      throw new Error(scoringError?.message ?? moderationError?.message ?? "Résultats non enregistrés.");
    }
    await supabase.from("ai_generation_jobs").update({
      status: "completed",
      output_payload: { candidate_id: candidate.id, review_status: candidate.reviewStatus },
      duration_ms: Date.now() - startedAt,
      gate_outcomes: {
        schema_valid: true,
        moderation_passed: candidate.flags.moderationPassed,
        factual_review: candidate.flags.factualNeedsReview,
        sensitive_domain: candidate.flags.sensitive,
        difficulty_mismatch: candidate.flags.difficultyMismatch,
      },
      completed_at: new Date().toISOString(),
    }).eq("id", job.id);
    await logAudit("content.candidate_generated", {
      targetType: "ai_generated_candidate",
      targetId: candidate.id,
      metadata: { jobId: job.id, reviewStatus: candidate.reviewStatus },
    });
    refreshContent();
    return candidate;
  } catch (error) {
    await supabase.from("ai_generation_jobs").update({
      status: "failed",
      error_message: error instanceof Error ? error.message : "Erreur inconnue",
      duration_ms: Date.now() - startedAt,
      completed_at: new Date().toISOString(),
    }).eq("id", job.id);
    throw error;
  }
}

export async function runDifficultyScoring(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = checked(rescoreInput, input);
  const supabase = await createClient();
  const existing = await getContentCandidate(data.id, supabase);
  const candidate = rescoreCandidateBody(existing, data.body);
  const now = new Date().toISOString();
  const [{ error: candidateError }, { error: scoreError }] = await Promise.all([
    supabase.from("ai_generated_candidates").update({
      payload: candidate,
      review_status: candidate.reviewStatus,
      approved_text_version_id: null,
      updated_at: now,
    }).eq("id", data.id),
    supabase.from("ai_scoring_results").upsert({
      candidate_id: data.id,
      score_payload: {
        difficulty: candidate.difficulty,
        question_difficulties: candidate.questionDifficulties,
        flags: candidate.flags,
      },
    }, { onConflict: "candidate_id" }),
  ]);
  if (candidateError || scoreError) throw new Error(candidateError?.message ?? scoreError?.message);
  await logAudit("content.candidate_edited", { targetType: "ai_generated_candidate", targetId: data.id });
  refreshContent();
  return candidate;
}

export async function runModeration(input: unknown) {
  await requireRole(["platform_admin"]);
  const { id } = checked(idInput, input);
  const supabase = await createClient();
  const existing = await getContentCandidate(id, supabase);
  const moderation = await getAIProvider().moderate({
    content: existing.generated.body,
    context: "generated_content",
  });
  const candidate = {
    ...existing,
    moderation,
    flags: { ...existing.flags, moderationPassed: moderation.passed },
    reviewStatus: moderation.passed ? existing.reviewStatus : "needs_human_review" as const,
  };
  const [{ error: candidateError }, { error: moderationError }] = await Promise.all([
    supabase.from("ai_generated_candidates").update({
      payload: candidate,
      review_status: candidate.reviewStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", id),
    supabase.from("ai_moderation_results").upsert({
      candidate_id: id,
      moderation_payload: moderation,
      passed: moderation.passed,
    }, { onConflict: "candidate_id" }),
  ]);
  if (candidateError || moderationError) throw new Error(candidateError?.message ?? moderationError?.message);
  refreshContent();
  return candidate;
}

export async function reviewTextCandidate(input: unknown) {
  const reviewer = await requireRole(["platform_admin"]);
  const data = checked(reviewInput, input);
  const supabase = await createClient();
  const { error } = await supabase.from("ai_generated_candidates").update({
    review_status: "rejected",
    reviewer_profile_id: reviewer.id,
    review_note: data.note ?? null,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", data.id);
  if (error) throw new Error(error.message);
  await logAudit("content.candidate_rejected", {
    targetType: "ai_generated_candidate",
    targetId: data.id,
    metadata: data.note ? { note: data.note } : {},
  });
  refreshContent();
  return { ok: true };
}

export async function approveTextVersion(input: unknown) {
  const reviewer = await requireRole(["platform_admin"]);
  const { id } = checked(idInput, input);
  const supabase = await createClient();
  const { data: approvedReview, error } = await supabase.from("content_review_versions")
    .select("id").eq("candidate_id", id).eq("workflow_status", "approved")
    .order("version_number", { ascending: false }).limit(1).maybeSingle();
  if (error || !approvedReview) throw new Error("Une décision éditoriale approuvée est requise avant publication.");
  const result = await publishPassage(id, supabase, createServiceClient(), { kind: "human", reviewerId: reviewer.id, reviewVersionId: approvedReview.id });
  refreshContent();
  return result;
}

export async function retireTextVersion(input: unknown) {
  await requireRole(["platform_admin"]);
  const { id } = checked(idInput, input);
  const supabase = await createClient();
  const { data: version, error } = await supabase.from("text_versions").update({
    review_status: "retired",
  }).eq("id", id).select("text_id").single();
  if (error || !version) throw new Error(error?.message ?? "Version introuvable.");
  await supabase.from("texts").update({ status: "retired", updated_at: new Date().toISOString() }).eq("id", version.text_id);
  await logAudit("content.text_retired", { targetType: "text_version", targetId: id });
  refreshContent();
  return { ok: true };
}

export async function lockBenchmarkTextVersion(input: unknown) {
  await requireRole(["platform_admin"]);
  const { id } = checked(idInput, input);
  const supabase = await createClient();
  const { error } = await supabase.from("text_versions").update({ review_status: "benchmark_locked" }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit("content.text_benchmark_locked", { targetType: "text_version", targetId: id });
  refreshContent();
  return { ok: true };
}

// Later roadmap sprints fill these reference-data surfaces.
export async function createSkill(input: unknown) {
  await requireRole(["platform_admin"]);
  checked(z.never(), input);
}

export async function createKnowledgeConcept(input: unknown) {
  await requireRole(["platform_admin"]);
  checked(z.never(), input);
}

export async function activatePromptVersion(input: unknown) {
  await requireRole(["platform_admin"]);
  const data = checked(promptActivationInput, input);
  const supabase = await createClient();
  const { data: prompt, error: promptError } = await supabase.from("prompt_versions")
    .select("prompt_key,version_number").eq("id", data.id).single();
  if (promptError || !prompt) throw new Error("Version de prompt introuvable.");
  const { error } = await supabase.rpc("activate_prompt_version", { p_prompt_id: data.id });
  if (error) throw new Error(error.message);
  await logAudit("prompt.version_activated", {
    targetType: "prompt_version",
    targetId: data.id,
    metadata: { promptKey: prompt.prompt_key, version: prompt.version_number },
  });
  revalidatePath("/admin/prompts");
  return { ok: true };
}
