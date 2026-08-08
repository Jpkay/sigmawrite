import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { getAdminReviewVersions } from "@/lib/db/reviews";
import { createClient } from "@/lib/supabase/server";
import { ReviewAdminNav } from "../review-nav";
import { AssignmentManager } from "./assignment-manager";

export default async function ReviewAssignmentAdminPage(){
  const admin=await requireRole(["platform_admin"]);const db=await createClient();
  const [versions,{data:reviewers,error}]=await Promise.all([getAdminReviewVersions(db),db.from("content_reviewer_profiles").select("profile_id,active,profiles!content_reviewer_profiles_profile_id_fkey(display_name)").eq("active",true).order("created_at")]);
  if(error)throw new Error(error.message);
  const assignable=versions.filter(v=>["ready_for_review","in_review"].includes(v.workflowStatus)).sort((a,b)=>new Date(b.candidate.createdAt).getTime()-new Date(a.candidate.createdAt).getTime());
  return <><PageHeader title="Attribuer les passages" description="Sélectionnez les passages et deux ou trois évaluateurs. Chaque passage sera attribué à chacun d’eux."/><ReviewAdminNav/><AssignmentManager currentAdminId={admin.id} versions={assignable.map(v=>({id:v.id,title:v.candidate.generated.title,topic:v.candidate.input.topic,band:v.candidate.input.targetReadingBand,interest:v.candidate.input.primaryInterest,textType:v.candidate.input.textType,assigned:v.assignments.map(a=>a.reviewerProfileId)}))} reviewers={(reviewers??[]) as unknown as Array<{profile_id:string;active:boolean;profiles:{display_name:string|null}}>}/></>;
}
