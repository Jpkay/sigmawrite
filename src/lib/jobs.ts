import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { getStudentStateData } from "@/lib/db/student";
import { proofLayer, weeklyReport } from "@/lib/reports";
import { sendEmail } from "@/lib/email";
import { analyzeItem, boundedDifficultyPrior, predictiveLift } from "@/lib/psychometrics";

export async function withJobRun<T>(jobName: string, work: (db: SupabaseClient) => Promise<{ result: T; processed: number }>) {
  const db = createServiceClient();
  const { data: run, error } = await db.from("job_runs").insert({ job_name: jobName }).select("id").single();
  if (error || !run) throw new Error(error?.message ?? "Job run not created");
  try { const output = await work(db); await db.from("job_runs").update({ status: "completed", finished_at: new Date().toISOString(), processed_count: output.processed }).eq("id", run.id); return output.result; }
  catch (cause) { await db.from("job_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: cause instanceof Error ? cause.message : "Unknown error" }).eq("id", run.id); throw cause; }
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
      const { data: stored, error: reportError } = await db.from("parent_reports").insert({ student_id: student.id, report_period_start: start.toISOString().slice(0,10), report_period_end: end.toISOString().slice(0,10), report_payload: { studentName: student.display_name ?? "Élève", report, proof }, language, recipient_email: email, delivery_status: "pending" }).select("id").single();
      if (reportError || !stored) throw new Error(reportError?.message ?? "Report not stored");
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"; const delivery = await sendEmail({ to: email, subject: language === "en" ? `Weekly reading report — ${student.display_name ?? "student"}` : `Rapport de lecture — ${student.display_name ?? "élève"}`, html: `<h1>${language === "en" ? "Weekly progress" : "Progrès de la semaine"}</h1><p>${report.textsCompleted} ${language === "en" ? "texts" : "textes"} · ${report.minutes} min · ${report.avgSuccess == null ? "—" : Math.round(report.avgSuccess*100)+"%"}</p><p><a href="${base}/parent/reports/${stored.id}">${language === "en" ? "View evidence" : "Voir les preuves"}</a></p>` });
      await db.from("parent_reports").update({ delivery_status: delivery.sent ? "sent" : "no_op" }).eq("id", stored.id); count += 1;
    }
  }
  return count;
}

export async function refreshRetrievalDue(db: SupabaseClient) {
  const { data, error } = await db.from("retrieval_schedules").select("retrieval_card_id,retrieval_cards!inner(student_id)").lte("due_at", new Date().toISOString()).eq("status", "due"); if (error) throw new Error(error.message);
  const counts = new Map<string,number>(); for (const row of data ?? []) { const card = row.retrieval_cards as unknown as { student_id: string }; counts.set(card.student_id,(counts.get(card.student_id)??0)+1); }
  for (const [studentId,count] of counts) await db.from("student_notifications").insert({ student_id: studentId, kind: "retrieval_due", message_fr: `${count} carte${count>1?"s":""} à réviser`, payload: { count } });
  return counts.size;
}

export function authorizeJob(request: Request) {
  const secret = process.env.CRON_SECRET; if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function runPsychometricAnalysis(db:SupabaseClient){
  const {data:attempts,error}=await db.from("competency_attempts").select("student_id,item_id,node_id,is_correct,selected_choice_id").not("item_id","is",null);if(error)throw new Error(error.message);
  const rows=attempts??[];const byStudent=new Map<string,number[]>();for(const row of rows){const list=byStudent.get(row.student_id as string)??[];list.push(row.is_correct?1:0);byStudent.set(row.student_id as string,list);}const studentMean=new Map([...byStudent].map(([id,scores])=>[id,scores.reduce((a,b)=>a+b,0)/scores.length]));
  const byItem=new Map<string,typeof rows>();for(const row of rows){const key=row.item_id as string;const list=byItem.get(key)??[];list.push(row);byItem.set(key,list);}let processed=0;
  for(const [itemId,itemRows] of byItem){const analysis=analyzeItem(itemRows.map(row=>({correct:!!row.is_correct,totalScore:studentMean.get(row.student_id as string)??0})));await db.from("item_stats").upsert({item_id:itemId,attempts_count:analysis.attempts,p_value:analysis.p,point_biserial:analysis.discrimination,flags:analysis.flags,calculated_at:new Date().toISOString()},{onConflict:"item_id"});if(analysis.p!=null){const {data:item}=await db.from("competency_items").select("difficulty").eq("id",itemId).single();const update:Record<string,unknown>={p_value:analysis.p,discrimination:analysis.discrimination,attempts_count:analysis.attempts,psychometric_flags:analysis.flags,difficulty:boundedDifficultyPrior(Number(item?.difficulty??50),analysis.p),updated_at:new Date().toISOString()};if(analysis.flags.length)update.review_status="needs_human_review";await db.from("competency_items").update(update).eq("id",itemId);}processed++;}
  const [{data:edges},{data:estimates}]=await Promise.all([db.from("competency_edges").select("id,source_node_id,target_node_id").eq("edge_type","prerequisite"),db.from("student_competency_estimates").select("student_id,node_id,mastery_probability")]);const mastery=new Map((estimates??[]).map(row=>[`${row.student_id}:${row.node_id}`,Number(row.mastery_probability)]));
  for(const edge of edges??[]){const dependent=rows.filter(row=>row.node_id===edge.target_node_id);const analysis=predictiveLift(dependent.map(row=>({prerequisiteMastered:(mastery.get(`${row.student_id}:${edge.source_node_id}`)??0)>=0.85,dependentSuccess:!!row.is_correct})));await db.from("edge_stats").upsert({edge_id:edge.id,evidence_count:analysis.evidence,predictive_lift:analysis.lift,flagged_no_lift:analysis.flagged,calculated_at:new Date().toISOString()},{onConflict:"edge_id"});await db.from("competency_edges").update({psychometric_flags:analysis.flagged?["no_predictive_lift"]:[]}).eq("id",edge.id);}
  const {data:choices}=await db.from("competency_item_choices").select("id,misconception_id").not("misconception_id","is",null);for(const choice of choices??[]){const hits=rows.filter(row=>row.selected_choice_id===choice.id).length;const total=rows.filter(row=>row.selected_choice_id!=null).length;const confirmed=hits>=30&&hits/Math.max(1,total)>=0.05;await db.from("misconception_stats").upsert({misconception_id:choice.misconception_id,evidence_count:hits,wrong_choice_rate:total?hits/total:0,confirmed:hits>=30?confirmed:null,calculated_at:new Date().toISOString()},{onConflict:"misconception_id"});if(hits>=30)await db.from("misconceptions").update({empirically_confirmed:confirmed}).eq("id",choice.misconception_id);}
  return processed;
}

export async function fulfillDeletionRequests(db:SupabaseClient){const{data:requests,error}=await db.from("deletion_requests").select("id,student_auth_user_id").eq("status","pending").lte("scheduled_for",new Date().toISOString());if(error)throw new Error(error.message);let completed=0;for(const request of requests??[]){const result=await db.auth.admin.deleteUser(request.student_auth_user_id as string);if(result.error){await db.from("deletion_requests").update({status:"failed",error_message:result.error.message}).eq("id",request.id);continue;}await db.from("deletion_requests").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",request.id);completed++;}return completed;}
export async function applyEventRetention(db:SupabaseClient){const cutoff=new Date(Date.now()-730*86_400_000).toISOString();const{data,error}=await db.from("reading_session_events").delete().lt("created_at",cutoff).select("id");if(error)throw new Error(error.message);return data?.length??0;}
