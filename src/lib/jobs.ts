import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { getStudentStateData } from "@/lib/db/student";
import { proofLayer, weeklyReport } from "@/lib/reports";
import { sendEmail } from "@/lib/email";
import { analyzeItem, boundedDifficultyPrior, predictiveLift } from "@/lib/psychometrics";
import { edgePredictiveLift, questionQuality } from "@/lib/monitoring/psychometrics";
import { selectSparseReview } from "@/lib/review/sparse-calibration";
import { captureError } from "@/lib/observability";

export async function withJobRun<T>(jobName: string, work: (db: SupabaseClient) => Promise<{ result: T; processed: number }>) {
  const db = createServiceClient();
  const { data: runId, error } = await db.rpc("claim_job_run", { p_job_name: jobName, p_lease_minutes: 120 });
  if (error || !runId) {
    if (error?.code === "55000") throw new Error(`Job already running: ${jobName}`);
    throw new Error(error?.message ?? "Job run not created");
  }
  try {
    const output = await work(db);
    const { error: finishError } = await db.from("job_runs").update({ status: "completed", finished_at: new Date().toISOString(), processed_count: output.processed }).eq("id", runId);
    if (finishError) throw new Error(`Job completion was not recorded: ${finishError.message}`);
    return output.result;
  } catch (cause) {
    const { error: failureError } = await db.from("job_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: cause instanceof Error ? cause.message : "Unknown error" }).eq("id", runId);
    captureError(cause,{jobName,jobRunId:runId});
    const alertTo=process.env.OPS_ALERT_EMAIL;
    if(alertTo)void sendEmail({to:alertTo,subject:`Plume job failed: ${jobName}`,html:`<h1>Background job failed</h1><p>${jobName}</p><p>Run ${runId}</p>`,text:`Background job failed\n\n${jobName}\nRun ${runId}`}).catch(alertError=>captureError(alertError,{jobName,alert:"email"}));
    if (failureError) throw new AggregateError([cause, failureError], "Job failed and its failure state was not recorded");
    throw cause;
  }
}

export async function generateWeeklyParentReports(db: SupabaseClient) {
  const { data: students, error } = await db.from("students").select("id,display_name"); if (error) throw new Error(error.message);
  const end = new Date(); const start = new Date(end.getTime() - 7*86_400_000); let count = 0;
  for (const student of students ?? []) {
    const snapshot = await getStudentStateData(student.id as string, db); const report = weeklyReport(snapshot, end.getTime()); const proof = proofLayer(snapshot);
    const { data: guardians } = await db.from("student_guardians").select("profiles!inner(auth_user_id,preferred_language)").eq("student_id", student.id);
    for (const guardianRow of guardians ?? []) {
      const guardian = guardianRow.profiles as unknown as { auth_user_id: string; preferred_language: string };
      const { data: auth } = await db.auth.admin.getUserById(guardian.auth_user_id); const email = auth.user?.email; if (!email) continue;
      const language = guardian.preferred_language === "en" ? "en" : "fr";
      const periodStart = start.toISOString().slice(0,10), periodEnd = end.toISOString().slice(0,10);
      const { data: previous, error: previousError } = await db.from("parent_reports").select("id,delivery_status").eq("student_id",student.id).eq("report_period_start",periodStart).eq("report_period_end",periodEnd).eq("recipient_email",email).maybeSingle();
      if (previousError) throw new Error(previousError.message);
      if (previous?.delivery_status === "sent") continue;
      let stored = previous;
      if (!stored) {
        const inserted = await db.from("parent_reports").insert({ student_id: student.id, report_period_start: periodStart, report_period_end: periodEnd, report_payload: { studentName: student.display_name ?? "Élève", report, proof }, language, recipient_email: email, delivery_status: "pending" }).select("id,delivery_status").single();
        if (inserted.error || !inserted.data) {
          if (inserted.error?.code === "23505") continue;
          throw new Error(inserted.error?.message ?? "Report not stored");
        }
        stored = inserted.data;
      }
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"; const reportUrl = `${base}/parent/reports/${stored.id}`; const reportSummary = `${report.textsCompleted} ${language === "en" ? "texts" : "textes"} · ${report.minutes} min · ${report.avgSuccess == null ? "—" : Math.round(report.avgSuccess*100)+"%"}`; const delivery = await sendEmail({ to: email, subject: language === "en" ? `Weekly reading report — ${student.display_name ?? "student"}` : `Rapport de lecture — ${student.display_name ?? "élève"}`, html: `<h1>${language === "en" ? "Weekly progress" : "Progrès de la semaine"}</h1><p>${reportSummary}</p><p><a href="${reportUrl}">${language === "en" ? "View evidence" : "Voir les preuves"}</a></p>`, text: `${language === "en" ? "Weekly progress" : "Progrès de la semaine"}\n\n${reportSummary}\n\n${language === "en" ? "View evidence" : "Voir les preuves"}: ${reportUrl}` });
      const { error: deliveryError } = await db.from("parent_reports").update({ delivery_status: delivery.sent ? "sent" : "no_op" }).eq("id", stored.id); if(deliveryError)throw new Error(deliveryError.message); count += 1;
    }
  }
  return count;
}

export async function refreshRetrievalDue(db: SupabaseClient) {
  const { data, error } = await db.from("retrieval_schedules").select("retrieval_card_id,retrieval_cards!inner(student_id)").lte("due_at", new Date().toISOString()).eq("status", "due"); if (error) throw new Error(error.message);
  const counts = new Map<string,number>(); for (const row of data ?? []) { const card = row.retrieval_cards as unknown as { student_id: string }; counts.set(card.student_id,(counts.get(card.student_id)??0)+1); }
  const day = new Date().toISOString().slice(0,10);
  for (const [studentId,count] of counts) { const {error:noticeError}=await db.from("student_notifications").upsert({ student_id: studentId, kind: "retrieval_due", dedupe_key:`retrieval_due:${day}`, message_fr: `${count} carte${count>1?"s":""} à réviser`, payload: { count } },{onConflict:"student_id,dedupe_key"}); if(noticeError)throw new Error(noticeError.message); }
  return counts.size;
}

export function authorizeJob(request: Request) {
  const secret = process.env.CRON_SECRET; if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function isPublishedDiagnosticItem(db: SupabaseClient, itemId: string) {
  const { data, error } = await db.from("diagnostic_item_bank_memberships")
    .select("item_id,diagnostic_item_bank_releases!inner(status)")
    .eq("item_id", itemId)
    .eq("diagnostic_item_bank_releases.status", "published")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export async function runPsychometricAnalysis(db:SupabaseClient){
  const {data:attempts,error}=await db.from("competency_attempts").select("student_id,item_id,node_id,is_correct,selected_choice_id").eq("provisional",false).not("item_id","is",null);if(error)throw new Error(error.message);
  const rows=attempts??[];const byStudent=new Map<string,number[]>();for(const row of rows){const list=byStudent.get(row.student_id as string)??[];list.push(row.is_correct?1:0);byStudent.set(row.student_id as string,list);}const studentMean=new Map([...byStudent].map(([id,scores])=>[id,scores.reduce((a,b)=>a+b,0)/scores.length]));
  const byItem=new Map<string,typeof rows>();for(const row of rows){const key=row.item_id as string;const list=byItem.get(key)??[];list.push(row);byItem.set(key,list);}let processed=0;
  for(const [itemId,itemRows] of byItem){const analysis=analyzeItem(itemRows.map(row=>({correct:!!row.is_correct,totalScore:studentMean.get(row.student_id as string)??0})));await db.from("item_stats").upsert({item_id:itemId,attempts_count:analysis.attempts,p_value:analysis.p,point_biserial:analysis.discrimination,flags:analysis.flags,calculated_at:new Date().toISOString()},{onConflict:"item_id"});if(analysis.p!=null){const {data:item}=await db.from("competency_items").select("difficulty").eq("id",itemId).single();const update:Record<string,unknown>={p_value:analysis.p,discrimination:analysis.discrimination,attempts_count:analysis.attempts,psychometric_flags:analysis.flags,difficulty:boundedDifficultyPrior(Number(item?.difficulty??50),analysis.p),updated_at:new Date().toISOString()};if(analysis.flags.length&&!await isPublishedDiagnosticItem(db,itemId))update.review_status="needs_human_review";await db.from("competency_items").update(update).eq("id",itemId);}processed++;}
  const [{data:edges},{data:estimates}]=await Promise.all([db.from("competency_edges").select("id,source_node_id,target_node_id").eq("edge_type","prerequisite"),db.from("student_competency_estimates").select("student_id,node_id,mastery_probability")]);const mastery=new Map((estimates??[]).map(row=>[`${row.student_id}:${row.node_id}`,Number(row.mastery_probability)]));
  for(const edge of edges??[]){const dependent=rows.filter(row=>row.node_id===edge.target_node_id);const analysis=predictiveLift(dependent.map(row=>({prerequisiteMastered:(mastery.get(`${row.student_id}:${edge.source_node_id}`)??0)>=0.85,dependentSuccess:!!row.is_correct})));await db.from("edge_stats").upsert({edge_id:edge.id,evidence_count:analysis.evidence,predictive_lift:analysis.lift,flagged_no_lift:analysis.flagged,calculated_at:new Date().toISOString()},{onConflict:"edge_id"});await db.from("competency_edges").update({psychometric_flags:analysis.flagged?["no_predictive_lift"]:[]}).eq("id",edge.id);}
  const {data:choices}=await db.from("competency_item_choices").select("id,misconception_id").not("misconception_id","is",null);for(const choice of choices??[]){const hits=rows.filter(row=>row.selected_choice_id===choice.id).length;const total=rows.filter(row=>row.selected_choice_id!=null).length;const confirmed=hits>=30&&hits/Math.max(1,total)>=0.05;await db.from("misconception_stats").upsert({misconception_id:choice.misconception_id,evidence_count:hits,wrong_choice_rate:total?hits/total:0,confirmed:hits>=30?confirmed:null,calculated_at:new Date().toISOString()},{onConflict:"misconception_id"});if(hits>=30)await db.from("misconceptions").update({empirically_confirmed:confirmed}).eq("id",choice.misconception_id);}
  return processed;
}

export async function fulfillDeletionRequests(db:SupabaseClient){const{data:requests,error}=await db.rpc("claim_due_deletion_requests",{p_limit:25});if(error)throw new Error(error.message);let completed=0;for(const request of requests??[]){const result=await db.auth.admin.deleteUser(request.student_auth_user_id as string);if(result.error){const{error:updateError}=await db.from("deletion_requests").update({status:"failed",error_message:result.error.message}).eq("id",request.id).eq("status","processing");if(updateError)throw new Error(updateError.message);continue;}const{error:updateError}=await db.from("deletion_requests").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",request.id).eq("status","processing");if(updateError)throw new Error(updateError.message);completed++;}return completed;}
export async function applyEventRetention(db:SupabaseClient){const cutoff=new Date(Date.now()-730*86_400_000).toISOString();const{data,error}=await db.from("reading_session_events").delete().lt("created_at",cutoff).select("id");if(error)throw new Error(error.message);return data?.length??0;}

export async function runFrenchAutomationMonitoring(db:SupabaseClient){
  const [{data:attempts,error},{data:edges},{data:estimates},{data:policy}]=await Promise.all([db.from("competency_attempts").select("student_id,item_id,node_id,is_correct").eq("provisional",false).not("item_id","is",null),db.from("competency_edges").select("id,source_node_id,target_node_id").eq("edge_type","prerequisite"),db.from("student_competency_estimates").select("student_id,node_id,mastery_probability"),db.from("sparse_review_policies").select("id,version,low_risk_sample_percent,medium_risk_sample_percent,always_review_high_risk").eq("active",true).order("version",{ascending:false}).limit(1).maybeSingle()]);if(error)throw new Error(error.message);if(!policy)throw new Error("Sparse review policy missing");
  const rows=attempts??[],studentScores=new Map<string,number[]>();for(const row of rows){const values=studentScores.get(row.student_id as string)??[];values.push(row.is_correct?1:0);studentScores.set(row.student_id as string,values);}const ability=new Map([...studentScores].map(([id,v])=>[id,v.reduce((a,b)=>a+b,0)/v.length])),mastery=new Map((estimates??[]).map(e=>[`${e.student_id}:${e.node_id}`,Number(e.mastery_probability)]));let processed=0;
  const record=async(metricKey:string,entityType:string,entityId:string,metric:{status:string;flag:string|null;[key:string]:unknown})=>{const{data:snapshot,error:snapshotError}=await db.from("empirical_metric_snapshots").insert({metric_key:metricKey,entity_type:entityType,entity_id:entityId,sample_size:Number(metric.n??0),status:metric.status,metric_payload:metric,calculation_version:"1.0.0"}).select("id").single();if(snapshotError||!snapshot)throw new Error(snapshotError?.message??"Metric snapshot missing");if(metric.status==="active"&&metric.flag){const{data:event,error:eventError}=await db.from("empirical_review_events").insert({metric_snapshot_id:snapshot.id,event_type:metric.flag==="no_predictive_lift"?"no_lift":"empirical_anomaly",reason_key:metric.flag,explanation:metric}).select("id").single();if(eventError||!event)throw new Error(eventError?.message??"Review event missing");const selection=selectSparseReview({candidateId:entityId,riskClass:"low",riskDecision:"pass",anomalyReasonKeys:[metric.flag],qaDisagreement:false,benchmarkFailed:false,pipelineVersion:"monitoring-1.0.0"},{lowRiskSamplePercent:Number(policy.low_risk_sample_percent),mediumRiskSamplePercent:Number(policy.medium_risk_sample_percent),alwaysReviewHighRisk:!!policy.always_review_high_risk,pipelineVersions:[]});await db.from("sparse_review_cases").insert({subject_type:entityType,subject_id:entityId,policy_id:policy.id,source_empirical_event_id:event.id,primary_reason:"empirical_anomaly",reason_keys:selection.reasons,selection_explanation:selection.explanation,queue_key:"empirical_anomaly",pipeline_version:"monitoring-1.0.0"});}processed++;};
  const byItem=new Map<string,typeof rows>();for(const row of rows){const id=row.item_id as string,list=byItem.get(id)??[];list.push(row);byItem.set(id,list);}for(const[id,itemRows]of byItem){const metric=questionQuality(itemRows.map(row=>({correct:!!row.is_correct,ability:ability.get(row.student_id as string)??0})));await record("question_quality","competency_item",id,metric);}
  for(const edge of edges??[]){const targetRows=rows.filter(row=>row.node_id===edge.target_node_id),metric=edgePredictiveLift(targetRows.map(row=>({prerequisiteMastered:(mastery.get(`${row.student_id}:${edge.source_node_id}`)??0)>=.85,targetSuccess:!!row.is_correct})));await record("edge_predictive_lift","competency_edge",edge.id as string,metric);}return processed;
}
