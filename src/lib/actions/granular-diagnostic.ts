"use server";
import {journalMaterialDelivery} from "@/lib/diagnostic/granular/delivery-journal";
import {recordMaterialDelivery} from "@/lib/diagnostic/granular/material-delivery";
import {requireRole} from "@/lib/auth";
import {createClient,createServiceClient} from "@/lib/supabase/server";
import {getCurrentStudentId,getStudentStateData} from "@/lib/db/student";
import {requireStudentAccessAuthorized} from "@/lib/diagnostic/access";
import {sharedReleaseContentCache} from "@/lib/diagnostic/granular/release-content-cache";
import {SupabaseAssessmentStore} from "@/lib/diagnostic/granular/store";
import {publicAssessmentView,runAssessmentCommand} from "@/lib/diagnostic/granular/service";
import {runLearningCheckCommand} from "@/lib/diagnostic/granular/learning-service";
import {runTeachingCommand} from "@/lib/diagnostic/granular/teaching-service";
import {loadDiagnosticAnswerReview} from "@/lib/diagnostic/granular/answer-review";
async function context(){
 await requireRole(["student"]);
 const client=await createClient(),studentId=await getCurrentStudentId(client);
 await requireStudentAccessAuthorized(client,studentId);
 return {studentId,client,store:new SupabaseAssessmentStore(createServiceClient(),{cache:sharedReleaseContentCache,namespace:process.env.NEXT_PUBLIC_SUPABASE_URL!})};
}
async function deliver<T>(store:SupabaseAssessmentStore,studentId:string,boundary:string,result:T):Promise<T>{
 await recordMaterialDelivery(store,studentId,result);
 await journalMaterialDelivery(store,studentId,boundary,result);
 return result;
}
export async function startGranularDiagnostic(){
 const {studentId,store,client}=await context();
 const current=await store.latestSession(studentId)
  ?? await store.start(studentId,process.env.GRANULAR_DIAGNOSTIC_RELEASE_KEY??"french-granular-diagnostic-v1");
 if(!current)return {error:"Ce diagnostic n’est pas encore disponible."};
 const result={view:publicAssessmentView(current.session,current.bundle),...(current.session.state.phase==="learning"?{studentState:await getStudentStateData(studentId,client)}:{})};
 return deliver(store,studentId,"granular:start",result);
}
export async function updateGranularDiagnostic(input:unknown){
 const receivedAt=Date.now();
 const {studentId,store,client}=await context();
 const result=await runAssessmentCommand(store,studentId,input,Date.now,receivedAt);
 return deliver(store,studentId,"granular:diagnostic",{...result,...("view" in result&&result.view?.phase==="learning"?{studentState:await getStudentStateData(studentId,client)}:{})});
}
export async function updateGranularLearningCheck(input:unknown){
 const {studentId,store,client}=await context();
 const result=await runLearningCheckCommand(store,studentId,input);
 return deliver(store,studentId,"granular:independent-check",{...result,...("view" in result&&result.view?{studentState:await getStudentStateData(studentId,client)}:{})});
}
export async function updateGranularTeaching(input:unknown){
 const {studentId,store}=await context();
 const result=await runTeachingCommand(store,studentId,input);
 return deliver(store,studentId,"granular:teaching",result);
}
export async function getGranularAnswerReview(sessionId:string){
 const {studentId,store}=await context();
 return loadDiagnosticAnswerReview(store,studentId,sessionId);
}
