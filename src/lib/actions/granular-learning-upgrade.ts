"use server";
import {revalidatePath} from "next/cache";
import {requireRole} from "@/lib/auth";
import {createClient,createServiceClient} from "@/lib/supabase/server";
import {getCurrentStudentId} from "@/lib/db/student";
import {requireStudentAccessAuthorized} from "@/lib/diagnostic/access";
import {SupabaseAssessmentStore} from "@/lib/diagnostic/granular/store";

/** Student identity and target release come only from trusted server context. */
export async function upgradeGranularLearning(){
 await requireRole(["student"]);
 const client=await createClient();
 const studentId=await getCurrentStudentId(client);
 await requireStudentAccessAuthorized(client,studentId);
 if(process.env.GRANULAR_LEARNING_UPGRADES_ENABLED!=="true")return {changed:false};
 const releaseKey=process.env.GRANULAR_DIAGNOSTIC_RELEASE_KEY;
 if(!releaseKey)throw Error("Learning release is not configured");
 const db=createServiceClient(),store=new SupabaseAssessmentStore(db);
 const current=await store.latestSession(studentId);
 if(!current||current.session.state.phase!=="learning")return {changed:false};
 const {data:target,error}=await db.from("granular_assessment_releases").select("id")
  .eq("release_key",releaseKey).eq("status","published").maybeSingle();
 if(error)throw Error(error.message);
 if(!target)throw Error("Learning release unavailable");
 if(current.session.releaseId===target.id)return {changed:false};
 await store.createLearningSuccessor(studentId,current.session.id,target.id);
 revalidatePath("/student/lessons");
 revalidatePath("/student/diagnostic");
 return {changed:true};
}
