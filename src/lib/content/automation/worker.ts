import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentCandidate } from "@/lib/ai/pipeline";
import { evaluateAutomatedPassage } from "./evaluate";
import { PASSAGE_QA_VERSION } from "./policy";
import { publishPassage } from "@/lib/content/publish";

export async function queueReview(db: SupabaseClient, candidate: ContentCandidate, reviewers: string[]) {
  const { data: existingVersion, error } = await db.from("content_review_versions").select("id").eq("candidate_id",candidate.id).not("workflow_status","in","(retired,rejected)").order("version_number",{ascending:false}).limit(1).maybeSingle();
  let version = existingVersion;
  if (error) throw new Error(error.message);
  if (!version) {
    const { data: last, error: lastError } = await db.from("content_review_versions").select("version_number").eq("candidate_id",candidate.id).order("version_number",{ascending:false}).limit(1).maybeSingle();
    if (lastError) throw new Error(lastError.message);
    const inserted = await db.from("content_review_versions").insert({candidate_id:candidate.id,version_number:(last?.version_number??0)+1,payload:candidate,workflow_status:"in_review",required_reviewers:1}).select("id").single();
    if (inserted.error) throw new Error(inserted.error.message);
    version = inserted.data;
  }
  if (reviewers.length) {
    const { error: assignmentError } = await db.from("review_assignments").upsert(reviewers.map(id=>({review_version_id:version!.id,reviewer_profile_id:id})),{onConflict:"review_version_id,reviewer_profile_id",ignoreDuplicates:true});
    if (assignmentError) throw new Error(assignmentError.message);
  }
}
export async function processPassageAutomation(db: SupabaseClient, limit = 3) {
  const { data: policy, error: policyError } = await db.from("passage_automation_policy").select("*").eq("id",true).single();
  if (policyError) throw new Error(policyError.message);
  if (policy.pipeline_version !== PASSAGE_QA_VERSION) throw new Error("Passage policy/code version mismatch");
  // Existing educator work is never bulk-promoted. Process newly generated content only.
  if (!process.env.PASSAGE_QA_MODEL) return {mode:"unconfigured",results:[]};
  const { data: candidates, error } = await db.rpc("pending_automated_passages",{p_limit:Math.min(limit,10)});
  if (error) throw new Error(error.message);
  const results: Array<{candidateId:string;decision:string;published?:boolean;reasons?:string[]}> = [];
  for (const row of (candidates??[]) as Array<{id:string;payload:ContentCandidate;generation_job_id:string}>) {
    if (results.length>=Math.min(limit,10)) break;
    const { data: prior, error: priorError } = await db.from("passage_qa_runs").select("id,decision,payload_snapshot,created_at,report,sampled")
      .eq("candidate_id",row.id).eq("pipeline_version",PASSAGE_QA_VERSION).order("created_at",{ascending:false}).limit(1).maybeSingle();
    if (priorError) throw new Error(priorError.message);
    // Failed/held cases stay visible in the review queue; no repeated model spend.
    if (prior && JSON.stringify(prior.payload_snapshot)===JSON.stringify(row.payload) && (prior.decision!=="pass" || !policy.enabled)) continue;
    const { data: versions, error: versionsError } = await db.from("content_review_versions").select("id,review_assignments(status)").eq("candidate_id",row.id);
    if (versionsError) throw new Error(versionsError.message);
    if (versions?.some(v=>v.review_assignments?.some((a:{status:string})=>a.status==="submitted"))) continue;
    const candidate = {...row.payload,id:row.id} as ContentCandidate;
    try {
      const { data: job, error: jobError } = await db.from("ai_generation_jobs").select("model_id").eq("id",row.generation_job_id).maybeSingle();
      if (jobError || !job?.model_id) throw new Error("Generator model provenance missing");
      const report = await evaluateAutomatedPassage(candidate,job.model_id,db,policy.sample_percent);
      const { data: run, error: runError } = await db.from("passage_qa_runs").insert({candidate_id:row.id,pipeline_version:PASSAGE_QA_VERSION,payload_snapshot:row.payload,evaluator_model:report.evidence.evaluatorModel,decision:report.decision,report,sampled:report.sampled}).select("id").single();
      if (runError) throw new Error(runError.message);
      if (report.decision!=="pass" || report.sampled) await queueReview(db,candidate,policy.reviewer_ids);
      let published = false;
      if (report.decision==="pass" && policy.enabled) {
        await publishPassage(row.id,db,db,{kind:"automated",runId:run.id});
        published=true;
      }
      results.push({candidateId:row.id,decision:report.decision,published,reasons:report.reasons});
    } catch (cause) {
      const reason=cause instanceof Error?cause.message:"Passage automation failed";
      const { error: recordError } = await db.from("passage_qa_runs").insert({candidate_id:row.id,pipeline_version:PASSAGE_QA_VERSION,payload_snapshot:row.payload,evaluator_model:process.env.PASSAGE_QA_MODEL??"unconfigured",decision:"error",report:{reasons:[reason]}});
      if (recordError) throw new Error(recordError.message);
      await queueReview(db,candidate,policy.reviewer_ids);
      results.push({candidateId:row.id,decision:"error",published:false,reasons:[reason]});
    }
  }
  return {mode:policy.enabled?"bounded_pilot":"shadow",results};
}
