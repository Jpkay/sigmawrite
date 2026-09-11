"use server";
import {recordMaterialDelivery} from "@/lib/diagnostic/granular/material-delivery";
import {requireRole} from "@/lib/auth";
import {createClient,createServiceClient} from "@/lib/supabase/server";
import {getCurrentStudentId,getStudentStateData} from "@/lib/db/student";
import {requireStudentAccessAuthorized} from "@/lib/diagnostic/access";
import {SupabaseAssessmentStore} from "@/lib/diagnostic/granular/store";
import {publicAssessmentView,runAssessmentCommand} from "@/lib/diagnostic/granular/service";
import {runLearningCheckCommand} from "@/lib/diagnostic/granular/learning-service";
import {runTeachingCommand} from "@/lib/diagnostic/granular/teaching-service";
async function context(){
 await requireRole(["student"]);
 const client=await createClient(),studentId=await getCurrentStudentId(client);
 await requireStudentAccessAuthorized(client,studentId);
 return {studentId,client,store:new SupabaseAssessmentStore(createServiceClient())};
}
export async function startGranularDiagnostic(){
 const {studentId,store,client}=await context();
 const current=await store.start(studentId,"french-granular-diagnostic-v1");
 if(!current)return {error:"Ce diagnostic n’est pas encore disponible."};
 const result={view:publicAssessmentView(current.session,current.bundle),...(current.session.state.phase==="learning"?{studentState:await getStudentStateData(studentId,client)}:{})};
 await recordMaterialDelivery(store,studentId,result);
 return result;
}
export async function updateGranularDiagnostic(input:unknown){
 const {studentId,store,client}=await context();
 const result=await runAssessmentCommand(store,studentId,input);
 await recordMaterialDelivery(store,studentId,result);
 return {...result,...("view" in result&&result.view?.phase==="learning"?{studentState:await getStudentStateData(studentId,client)}:{})};
}
export async function updateGranularLearningCheck(input:unknown){
 const {studentId,store,client}=await context();
 const result=await runLearningCheckCommand(store,studentId,input);
 await recordMaterialDelivery(store,studentId,result);
 return {...result,...("view" in result&&result.view?{studentState:await getStudentStateData(studentId,client)}:{})};
}
export async function updateGranularTeaching(input:unknown){
 const {studentId,store}=await context();
 const result=await runTeachingCommand(store,studentId,input);
 await recordMaterialDelivery(store,studentId,result);
 return result;
}
