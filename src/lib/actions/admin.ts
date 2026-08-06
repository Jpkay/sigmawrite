"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { runGenerationPipeline } from "@/lib/ai/pipeline";
import { getAIEmbeddingInfo, getAIProvider, getAIProviderInfo } from "@/lib/ai";
import { generateTextInputSchema } from "@/lib/ai/schemas";
import { contentSlug, rescoreCandidateBody } from "@/lib/content/workflow";
import { getContentCandidate } from "@/lib/db/content";
import { getActivePrompt } from "@/lib/db/ai";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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
  const data = checked(generateTextInputSchema, input);
  const supabase = await createClient();
  const prompt = await getActivePrompt("text_generation", supabase);
  const providerInfo = getAIProviderInfo();
  const startedAt = Date.now();
  const { data: job, error: jobError } = await supabase.from("ai_generation_jobs").insert({
    job_type: "text_generation",
    status: "running",
    input_payload: {
      request: data,
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
    let candidate = await runGenerationPipeline(data, { systemPrompt: prompt.promptText });
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
  const candidate = await getContentCandidate(id, supabase);
  const { data: approvedReview } = await supabase.from("content_review_versions")
    .select("id").eq("candidate_id", id).eq("workflow_status", "approved")
    .order("version_number", { ascending: false }).limit(1).maybeSingle();
  if (!approvedReview) throw new Error("Une décision éditoriale approuvée est requise avant publication.");
  if (candidate.approvedTextVersionId) return { textVersionId: candidate.approvedTextVersionId };
  const service=createServiceClient();const{data:claims,error:claimError}=await service.rpc("claim_content_publication",{p_candidate_id:id});if(claimError)throw new Error(claimError.message);const claim=claims?.[0] as{claimed:boolean;status:string;result_payload:unknown}|undefined;if(!claim?.claimed){if(claim?.status==="completed"&&claim.result_payload)return claim.result_payload as{textId:string;textVersionId:string;slug:string};throw new Error("La publication de ce candidat est déjà en cours.");}

  const generated = candidate.generated;
  const desiredSlug = contentSlug(generated.title);
  const { data: collision } = await supabase.from("texts").select("id").eq("slug", desiredSlug).maybeSingle();
  const slug = collision ? contentSlug(generated.title, id) : desiredSlug;
  const domainKey = candidate.input.knowledgeDomains[0];
  const { data: domain } = domainKey
    ? await supabase.from("knowledge_domains").select("id").eq("key", domainKey).maybeSingle()
    : { data: null };
  const { data: text, error: textError } = await supabase.from("texts").insert({
    slug,
    canonical_title: generated.title,
    primary_interest: candidate.input.primaryInterest,
    primary_domain_id: domain?.id ?? null,
    status: "draft",
  }).select("id").single();
  if (textError || !text) throw new Error(textError?.message ?? "Texte non créé.");

  try {
    const difficulty = candidate.difficulty;
    const { data: version, error: versionError } = await supabase.from("text_versions").insert({
      text_id: text.id,
      version_number: 1,
      title: generated.title,
      body: generated.body,
      language: "fr",
      word_count: difficulty.features.wordCount,
      text_type: candidate.input.textType,
      difficulty_band: difficulty.band,
      lexical_difficulty: difficulty.lexical,
      syntax_difficulty: difficulty.syntax,
      knowledge_difficulty: difficulty.knowledge,
      inference_difficulty: difficulty.inference,
      stamina_difficulty: difficulty.stamina,
      overall_difficulty: difficulty.overall,
      generation_type: "ai_human_reviewed",
      review_status: "draft",
      source_policy: "generated",
    }).select("id").single();
    if (versionError || !version) throw new Error(versionError?.message ?? "Version non créée.");
    const embedding = await getAIProvider().embed({ text: `${generated.title}\n\n${generated.body}` });
    const { error: embeddingError } = await supabase.from("text_versions").update({ embedding: `[${embedding.join(",")}]`, embedding_model: getAIEmbeddingInfo().model }).eq("id", version.id);
    if (embeddingError) throw new Error(embeddingError.message);

    const skillKeys = new Set<string>();
    for (const [index, question] of generated.questions.entries()) {
      const primarySkill = question.skillIds[0] ?? question.questionType;
      skillKeys.add(primarySkill);
      question.skillIds.forEach((key) => skillKeys.add(key));
      const { data: questionRow, error: questionError } = await supabase.from("questions").insert({
        text_version_id: version.id,
        question_key: `q${index + 1}`,
        question_text: question.questionText,
        question_type: question.questionType,
        answer_format: question.answerFormat,
        correct_answer: question.correctAnswer ?? null,
        rubric: { rubric: question.rubric ?? null, skill_key: primarySkill },
        difficulty: candidate.questionDifficulties[index] ?? question.difficulty,
      }).select("id").single();
      if (questionError || !questionRow) throw new Error(questionError?.message ?? "Question non créée.");
      if (question.choices?.length) {
        const { error: choicesError } = await supabase.from("question_choices").insert(
          question.choices.map((choice, choiceIndex) => ({
            question_id: questionRow.id,
            choice_index: choiceIndex,
            choice_text: choice,
            is_correct: choice === question.correctAnswer,
          }))
        );
        if (choicesError) throw new Error(choicesError.message);
      }
      if (question.skillIds.length) {
        const { data: questionSkills } = await supabase.from("skills").select("id,key").in("key", question.skillIds);
        if (questionSkills?.length) {
          const { error: linksError } = await supabase.from("question_skills").insert(
            questionSkills.map((skill) => ({ question_id: questionRow.id, skill_id: skill.id }))
          );
          if (linksError) throw new Error(linksError.message);
        }
      }
    }
    candidate.input.targetSkills.forEach((key) => skillKeys.add(key));
    const { data: textSkills } = skillKeys.size
      ? await supabase.from("skills").select("id,key").in("key", [...skillKeys])
      : { data: [] };
    if (textSkills?.length) {
      const { error: linksError } = await supabase.from("text_skills").insert(
        textSkills.map((skill) => ({ text_version_id: version.id, skill_id: skill.id }))
      );
      if (linksError) throw new Error(linksError.message);
    }

    const { data: targetNodes } = await supabase.from("competency_nodes").select("id,key").in("key", [...skillKeys]);
    let nodeLinks = targetNodes ?? [];
    if (nodeLinks.length === 0) {
      const { data: fallbackNode } = await supabase.from("competency_nodes").select("id,key").eq("key", "comprehension_recit_passe").maybeSingle();
      if (fallbackNode) nodeLinks = [fallbackNode];
    }
    if (nodeLinks.length) {
      const { error: nodeLinkError } = await supabase.from("text_version_nodes").insert(nodeLinks.map((node) => ({ text_version_id: version.id, node_id: node.id, source: "human_confirmed", confidence: 1, confirmed_by: reviewer.id })));
      if (nodeLinkError) throw new Error(nodeLinkError.message);
    }

    for (const vocabulary of generated.targetVocabulary) {
      const lemma = vocabulary.word.trim().toLowerCase();
      let { data: item } = await supabase.from("vocabulary_items").select("id").eq("lemma", lemma).limit(1).maybeSingle();
      if (!item) {
        const result = await supabase.from("vocabulary_items").insert({
          lemma,
          display_word: vocabulary.word,
          definition_fr: vocabulary.definitionFr,
          example_fr: vocabulary.exampleSentenceFr,
        }).select("id").single();
        if (result.error || !result.data) throw new Error(result.error?.message ?? "Vocabulaire non créé.");
        item = result.data;
      }
      const { error: vocabularyError } = await supabase.from("text_vocabulary").insert({
        text_version_id: version.id,
        vocabulary_item_id: item.id,
        is_target_word: true,
      });
      if (vocabularyError) throw new Error(vocabularyError.message);
    }

    const now = new Date().toISOString();
    const { error: candidateError } = await supabase.from("ai_generated_candidates").update({
      review_status: "human_approved",
      approved_text_version_id: version.id,
      reviewer_profile_id: reviewer.id,
      reviewed_at: now,
      updated_at: now,
    }).eq("id", id);
    if (candidateError) throw new Error(candidateError.message);
    const { error: reviewVersionError } = await supabase.from("content_review_versions").update({
      workflow_status: "published", published_text_version_id: version.id, updated_at: now,
    }).eq("id", approvedReview.id);
    if (reviewVersionError) throw new Error(reviewVersionError.message);
    const{error:versionPublishError}=await supabase.from("text_versions").update({review_status:"human_approved"}).eq("id",version.id);if(versionPublishError)throw new Error(versionPublishError.message);
    const{error:textPublishError}=await supabase.from("texts").update({status:"active",updated_at:now}).eq("id",text.id);if(textPublishError)throw new Error(textPublishError.message);
    const publication={textId:text.id as string,textVersionId:version.id as string,slug};const{error:finishError}=await service.rpc("finish_content_publication",{p_candidate_id:id,p_result:publication});if(finishError)throw new Error(finishError.message);
    await logAudit("content.text_approved", {
      targetType: "text_version",
      targetId: version.id,
      metadata: { candidateId: id, textId: text.id },
    });
    refreshContent();
    return publication;
  } catch (error) {
    await supabase.from("texts").delete().eq("id", text.id);
    throw error;
  }
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
