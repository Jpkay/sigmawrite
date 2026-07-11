import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReviewAdminNav } from "../review-nav";
import { ReviewerManager } from "./reviewer-manager";

export default async function ReviewerManagementPage() {
  await requireRole(["platform_admin"]);
  const db=await createClient();
  const {data,error}=await db.from("content_reviewer_profiles").select("profile_id,active,invite_status,invited_email,last_activity_at,instructions_acknowledged_at,profiles!content_reviewer_profiles_profile_id_fkey(display_name,role)").order("created_at");
  if(error)throw new Error(error.message);
  return <><PageHeader title="Évaluateurs" description="Invitez deux éducateurs, activez leur accès et suivez leur première connexion."/><ReviewAdminNav/><ReviewerManager initialReviewers={(data??[]) as unknown as Parameters<typeof ReviewerManager>[0]["initialReviewers"]}/></>;
}
