import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getContentCandidate } from "@/lib/db/content";
import { getAIProvider, getAIEmbeddingInfo } from "@/lib/ai";
import { contentSlug } from "@/lib/content/workflow";
import { logAudit } from "@/lib/audit";

type Approval = { kind: "human"; reviewerId: string; reviewVersionId: string } | { kind: "automated"; runId: string };
export async function publishPassage(id: string, supabase: SupabaseClient, service: SupabaseClient, approval: Approval) {
  const automated = approval.kind === "automated";
  const reviewer = { id: approval.kind === "human" ? approval.reviewerId : null };
  const reviewVersionId = approval.kind === "human" ? approval.reviewVersionId : "";
  if (automated) {
    const { error } = await service.rpc("authorize_automated_passage", { p_run_id: approval.runId, p_candidate_id: id });
    if (error) throw new Error(error.message);
  }
  const candidate = await getContentCandidate(id, supabase);
  if (candidate.approvedTextVersionId) return { textVersionId: candidate.approvedTextVersionId };
  const { data: claims, error: claimError } = await service.rpc("claim_content_publication", { p_candidate_id: id });
  if (claimError) throw new Error(claimError.message);
  const claim = claims?.[0] as { claimed: boolean; status: string; result_payload: unknown } | undefined;
  if (!claim?.claimed) {
    if (claim?.status === "completed" && claim.result_payload) return claim.result_payload as { textVersionId: string };
    throw new Error("Publication already in progress");
  }
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
  if (textError || !text) {const message=textError?.message??"Texte non créé.";await service.rpc("fail_content_publication",{p_candidate_id:id,p_error:message});throw new Error(message);}

  let createdVersionId:string|null=null;
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
      generation_type: automated ? "ai_automated" : "ai_human_reviewed",
      review_status: "draft",
      source_policy: "generated",
    }).select("id").single();
    if (versionError || !version) throw new Error(versionError?.message ?? "Version non créée.");
    createdVersionId=version.id as string;
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
      const { error: nodeLinkError } = await supabase.from("text_version_nodes").insert(nodeLinks.map((node) => ({ text_version_id: version.id, node_id: node.id, source: automated ? "ai_proposed" : "human_confirmed", confidence: automated ? 0.8 : 1, confirmed_by: reviewer.id })));
      if (nodeLinkError) throw new Error(nodeLinkError.message);
    }

    const citedPacketIds = new Set(candidate.generated.factualClaims
      .flatMap((claim) => claim.sourcePacketIds ?? []));
    const groundedConceptIds = new Set((candidate.input.groundingPackets ?? [])
      .filter((packet) => citedPacketIds.has(packet.packetVersionId))
      .map((packet) => packet.conceptId));
    const { data: interestConcepts, error: interestConceptError } = await supabase.from("interest_concepts")
      .select("concept_id,relevance")
      .eq("interest_key", candidate.input.primaryInterest);
    if (interestConceptError) throw new Error(interestConceptError.message);
    const conceptLinks = [
      ...[...groundedConceptIds].map((conceptId) => ({
        text_version_id: version.id,
        concept_id: conceptId,
        source: "packet_grounding",
        confidence: 1,
        confirmed_by: reviewer.id,
      })),
      ...(interestConcepts ?? [])
        .filter((row) => !groundedConceptIds.has(row.concept_id as string))
        .map((row) => ({
          text_version_id: version.id,
          concept_id: row.concept_id,
          source: "interest_backfill",
          confidence: Number(row.relevance),
          confirmed_by: reviewer.id,
        })),
    ];
    if (conceptLinks.length) {
      const { error: conceptLinkError } = await supabase.from("text_version_concepts").insert(conceptLinks);
      if (conceptLinkError) throw new Error(conceptLinkError.message);
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
    if (automated) {
      const { error } = await service.rpc("finalize_automated_passage", { p_run_id: approval.runId, p_text_version_id: version.id });
      if (error) throw new Error(error.message);
    } else {
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
    }).eq("id", reviewVersionId);
    if (reviewVersionError) throw new Error(reviewVersionError.message);
    const{error:versionPublishError}=await supabase.from("text_versions").update({review_status:"human_approved"}).eq("id",version.id);if(versionPublishError)throw new Error(versionPublishError.message);
    }
    const{error:textPublishError}=await supabase.from("texts").update({status:"active",updated_at:now}).eq("id",text.id);if(textPublishError)throw new Error(textPublishError.message);
    const publication={textId:text.id as string,textVersionId:version.id as string,slug};const{error:finishError}=await service.rpc("finish_content_publication",{p_candidate_id:id,p_result:publication});if(finishError)throw new Error(finishError.message);
    if (!automated) await logAudit("content.text_approved", {
      targetType: "text_version",
      targetId: version.id,
      metadata: { candidateId: id, textId: text.id },
    });

    return publication;
  } catch (error) {
    const message=error instanceof Error?error.message:"Erreur inconnue";
    if(createdVersionId){const[{error:candidateRollbackError},{error:reviewRollbackError}]=await Promise.all([supabase.from("ai_generated_candidates").update({review_status:"needs_human_review",approved_text_version_id:null,reviewer_profile_id:null,reviewed_at:null}).eq("id",id),automated ? service.rpc("rollback_automated_passage",{p_run_id:approval.runId}) : supabase.from("content_review_versions").update({workflow_status:"approved",published_text_version_id:null}).eq("id",reviewVersionId)]);if(candidateRollbackError||reviewRollbackError)throw new Error(`Publication interrompue; réconciliation requise: ${candidateRollbackError?.message??reviewRollbackError?.message}`);}
    const{error:cleanupError}=await supabase.from("texts").delete().eq("id",text.id);if(cleanupError)throw new Error(`Publication interrompue; nettoyage requis: ${cleanupError.message}`);
    await service.rpc("fail_content_publication",{p_candidate_id:id,p_error:message});
    throw error;
  }
}
