"use server";
import {memoryDisplay} from "@/lib/diagnostic/granular/memory-display";
import {homeFallbackDisplay} from "@/lib/diagnostic/granular/home-recommendation-display";
import {recentReadingDisplay} from "@/lib/diagnostic/granular/recent-reading-copy";
import type {AssessmentResponse} from "@/lib/diagnostic/granular/client-state";
import {diagnosticDisplayText} from "@/lib/diagnostic/granular/diagnostic-display-text";
import {captureAssessmentDelivery} from "@/lib/diagnostic/granular/covered-material-delivery";
import {requireRole} from "@/lib/auth";
import {createClient,createServiceClient} from "@/lib/supabase/server";
import {getCurrentStudentId,getStudentStateData} from "@/lib/db/student";
import {requireStudentAccessAuthorized} from "@/lib/diagnostic/access";
import {sharedReleaseContentCache} from "@/lib/diagnostic/granular/release-content-cache";
import {SupabaseAssessmentStore} from "@/lib/diagnostic/granular/store";
import {publicAssessmentView,runAssessmentCommand} from "@/lib/diagnostic/granular/service";
import {serverWritingEvaluator} from "@/lib/diagnostic/granular/server-writing-evaluator";
import {runLearningCheckCommand} from "@/lib/diagnostic/granular/learning-service";
import {runTeachingCommand} from "@/lib/diagnostic/granular/teaching-service";
import {loadDiagnosticAnswerReview} from "@/lib/diagnostic/granular/answer-review";
import {revalidatePath} from "next/cache";
import {span,timedStore,traceCommand} from "@/lib/diagnostic/granular/latency-trace";
async function context(){
 await span("auth.role",()=>requireRole(["student"]));
 const client=await createClient(),studentId=await span("auth.student",()=>getCurrentStudentId(client));
 await span("auth.access",()=>requireStudentAccessAuthorized(client,studentId));
 return {studentId,client,store:timedStore(new SupabaseAssessmentStore(createServiceClient(),{cache:sharedReleaseContentCache,namespace:process.env.NEXT_PUBLIC_SUPABASE_URL!}))};
}
async function deliver<T extends AssessmentResponse>(store:SupabaseAssessmentStore,studentId:string,boundary:string,result:T):Promise<T>{
 const payload={...result,...(result.view?{displayText:diagnosticDisplayText(result.view)}:{}),...(result.studentState?{recentReading:recentReadingDisplay(result.studentState.sessions),homeFallback:homeFallbackDisplay(result.studentState.interests),memoryDisplay:memoryDisplay(result.studentState)}:{})};
 await span("delivery",()=>captureAssessmentDelivery(store,studentId,boundary,payload));
 return result;
}
async function staleSessionResponse(store:SupabaseAssessmentStore,studentId:string,input:unknown,boundary:string){
 const sessionId=input&&typeof input==="object"&&"sessionId" in input?input.sessionId:null;
 if(typeof sessionId!=="string")return null;
 if(await store.currentSessionId(studentId)===sessionId)return null;
 return deliver(store,studentId,boundary,{error:"Ce diagnostic a été remplacé. Recharge la page pour reprendre le nouveau."});
}
export async function startGranularDiagnostic(){
 return traceCommand("granular:start",startDiagnostic);
}
async function startDiagnostic(){
 const {studentId,store,client}=await context();
 const current=await store.latestSession(studentId)
  ?? await store.start(studentId,process.env.GRANULAR_DIAGNOSTIC_RELEASE_KEY??"french-granular-diagnostic-v1");
 if(!current)return deliver(store,studentId,"granular:start",{error:"Ce diagnostic n’est pas encore disponible."});
 const result={view:publicAssessmentView(current.session,current.bundle),history:await store.completedSessions(studentId),...(current.session.state.phase==="learning"?{studentState:await getStudentStateData(studentId,client)}:{})};
 return deliver(store,studentId,"granular:start",result);
}
export async function retakeGranularDiagnostic(){
 const {studentId,store}=await context();
 const current=await store.latestSession(studentId);
 if(!current)return deliver(store,studentId,"granular:retake",{error:"Aucun diagnostic terminé à reprendre."});
 // A repeated click after the first transaction returns the new sitting.
 if(current.session.state.phase==="assessing")return deliver(store,studentId,"granular:retake",{
  view:publicAssessmentView(current.session,current.bundle),history:await store.completedSessions(studentId),
 });
 const releaseKey=process.env.GRANULAR_DIAGNOSTIC_RELEASE_KEY??"french-granular-diagnostic-v1";
 const targetId=await store.publishedReleaseId(releaseKey);
 if(!targetId)return deliver(store,studentId,"granular:retake",{error:"Le nouveau diagnostic n’est pas encore disponible."});
 const successor=await store.createRetake(studentId,current.session.id,targetId);
 const bundle=await store.release(successor.releaseId);
 if(!bundle)throw Error("Diagnostic target release unavailable");
 revalidatePath("/student/diagnostic");
 return deliver(store,studentId,"granular:retake",{
  view:publicAssessmentView(successor,bundle),history:await store.completedSessions(studentId),
 });
}
export async function updateGranularDiagnostic(input:unknown){
 const receivedAt=Date.now();
 const type=input&&typeof input==="object"&&"type" in input&&typeof input.type==="string"?input.type:"unknown";
 return traceCommand(`granular:diagnostic:${type}`,async()=>{
  const {studentId,store,client}=await context();
  const stale=await span("stale",()=>staleSessionResponse(store,studentId,input,"granular:diagnostic"));
  if(stale)return stale;
  const result=await span("command",()=>runAssessmentCommand(store,studentId,input,Date.now,receivedAt));
  return deliver(store,studentId,"granular:diagnostic",{...result,...("view" in result&&result.view?.phase==="learning"?{studentState:await span("studentState",()=>getStudentStateData(studentId,client))}:{})});
 });
}
export async function updateGranularLearningCheck(input:unknown){
 const {studentId,store,client}=await context();
 const stale=await staleSessionResponse(store,studentId,input,"granular:independent-check");
 if(stale)return stale;
 const result=await runLearningCheckCommand(store,studentId,input,Date.now,serverWritingEvaluator(client,studentId));
 return deliver(store,studentId,"granular:independent-check",{...result,...("view" in result&&result.view?{studentState:await getStudentStateData(studentId,client)}:{})});
}
export async function updateGranularTeaching(input:unknown){
 const {studentId,store}=await context();
 const stale=await staleSessionResponse(store,studentId,input,"granular:teaching");
 if(stale)return stale;
 const result=await runTeachingCommand(store,studentId,input);
 return deliver(store,studentId,"granular:teaching",result);
}
export async function getGranularAnswerReview(sessionId:string){
 const {studentId,store}=await context();
 const active=await store.isActiveSession(studentId,sessionId);
 return loadDiagnosticAnswerReview(store,studentId,sessionId,undefined,!active);
}
