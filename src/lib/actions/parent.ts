"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { CONSENT_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/consent";
import { deliverProvisionedCredentials, provisionManagedAccount, rotateManagedPassword } from "@/lib/user-provisioning";

/**
 * Parent server actions (PRD §23). Each verifies auth+role server-side; RLS
 * further scopes every query to the caller's linked children (PRD §12, §14).
 */

/** Records guardian consent for a linked child (PRD §10). */
const studentInput = z.object({ studentId: z.string().uuid() });
const childInput = z.object({
  displayName: z.string().trim().min(2).max(100),
  dateOfBirth: z.string().date(),
  grade: z.number().int().min(5).max(12),
  username: z.string().trim().max(32).optional(),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
});

function parsed<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error("Données invalides.");
  return result.data;
}

export async function giveConsent(input: unknown) {
  const session = await requireRole(["parent"]);
  const { studentId } = parsed(studentInput, input);
  const supabase = await createClient();
  const { data: active } = await supabase.from("consent_records").select("id,consent_type")
    .eq("student_id", studentId).is("revoked_at", null).limit(1).maybeSingle();
  if (active) return { ok: true, consentType: active.consent_type as string };
  const { error } = await supabase.from("consent_records").insert({
    student_id: studentId,
    guardian_profile_id: session.id,
    consent_type: "guardian",
    consent_version: CONSENT_VERSION,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
  });
  if (error) throw new Error(error.message);
  await logAudit("consent_given", { targetType: "student", targetId: studentId });
  revalidatePath("/parent"); revalidatePath("/parent/privacy"); revalidatePath("/student");
  return { ok: true, consentType: "guardian" };
}

export async function revokeConsent(input: unknown) {
  const session = await requireRole(["parent"]);
  const { studentId } = parsed(studentInput, input);
  const supabase = await createClient();
  const { error } = await supabase.from("consent_records").update({ revoked_at: new Date().toISOString() })
    .eq("student_id", studentId).eq("guardian_profile_id", session.id).eq("consent_type", "guardian").is("revoked_at", null);
  if (error) throw new Error(error.message);
  await logAudit("consent_revoked", { targetType: "student", targetId: studentId });
  revalidatePath("/parent"); revalidatePath("/parent/privacy"); revalidatePath("/student");
  return { ok: true };
}

/** Creates a child credential without requiring the child to own an email inbox. */
export async function linkStudent(input: unknown) {
  const session = await requireRole(["parent"]);
  const data = parsed(childInput, input);
  const service = createServiceClient();
  const credentials = await provisionManagedAccount({
    role: "student",
    displayName: data.displayName,
    requestedUsername: data.username || null,
    email: data.email || null,
    dateOfBirth: data.dateOfBirth,
    grade: data.grade,
    provisionedByProfileId: session.id,
    deliverEmail: false,
  });
  try {
    if (!credentials.studentId) throw new Error("Élève non créé.");
    const [{ error: guardianError }, { error: consentError }] = await Promise.all([
      service.from("student_guardians").insert({
        student_id: credentials.studentId,
        guardian_profile_id: session.id,
        relationship: "parent",
      }),
      service.from("consent_records").insert({
        student_id: credentials.studentId,
        guardian_profile_id: session.id,
        consent_type: "guardian",
        consent_version: CONSENT_VERSION,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
      }),
    ]);
    if (guardianError || consentError) throw new Error(guardianError?.message ?? consentError?.message);
    await logAudit("student.child_account_created", {
      targetType: "student", targetId: credentials.studentId,
      metadata: { grade: data.grade },
    });
    const emailDelivered = await deliverProvisionedCredentials(credentials, data.displayName);
    revalidatePath("/parent"); revalidatePath("/parent/privacy");
    return {
      studentId: credentials.studentId,
      username: credentials.username,
      password: credentials.temporaryPassword,
      email: credentials.email,
      emailDelivered,
    };
  } catch (error) {
    await service.auth.admin.deleteUser(credentials.authUserId);
    throw error;
  }
}

/** Returns a schema-versioned, fail-closed export of every student-owned data category. */
export async function requestDataExport(studentId:string){await requireRole(["parent"]);parsed(studentInput,{studentId});const client=await createClient();const{data:owned,error:ownedError}=await client.from("students").select("id").eq("id",studentId).maybeSingle();if(ownedError||!owned)throw new Error("Données introuvables.");const service=createServiceClient();async function rows(table:string,column="student_id",value:string|string[]=studentId){let query=service.from(table).select("*");query=Array.isArray(value)?query.in(column,value):query.eq(column,value);const result=await query;if(result.error)throw new Error(`Export incomplet (${table}): ${result.error.message}`);return result.data??[];}const directTables=["benchmark_results","competency_attempts","consent_records","content_reuse_observations","contract_reuse_decisions","deletion_requests","diagnostic_node_dimension_results","diagnostic_node_evidence_results","diagnostic_node_results","diagnostic_pilot_enrollments","diagnostic_recommendations","diagnostic_responses","diagnostic_results","diagnostic_runs","enrollments","generated_content_serving_sessions","generation_contracts","indirect_retrieval_requests","learner_profiles","learning_goals","learning_retrieval_schedules","on_demand_workflow_runs","parent_reports","quiz_remediation_triggers","quiz_responses","quiz_sessions","reading_completion_runs","reading_session_events","reading_sessions","retrieval_attempts","retrieval_cards","retrieval_evidence_occurrences","student_ability_ratings","student_competency_dimension_estimates","student_competency_estimates","student_daily_activity","student_daily_ai_budgets","student_domain_estimates","student_guardians","student_interest_stats","student_interests","student_learning_paths","student_notifications","student_package_completions","student_package_progress","student_reading_estimates","student_skill_estimates","student_target_decisions","student_word_mastery","vocabulary_review_attempts","writing_evaluations"] as const;const pairs=await Promise.all(directTables.map(async table=>[table,await rows(table)]as const));const categories=Object.fromEntries(pairs)as Record<string,unknown[]>;const sessions=(categories.reading_sessions??[])as Array<{id:string}>;const cards=(categories.retrieval_cards??[])as Array<{id:string}>;const diagnosticRuns=(categories.diagnostic_runs??[])as Array<{id:string}>;const diagnosticResults=(categories.diagnostic_results??[])as Array<{id:string}>;const [answers,summaries,schedules,runSections,skillResults]=await Promise.all([sessions.length?rows("student_answers","session_id",sessions.map(row=>row.id)):Promise.resolve([]),sessions.length?rows("student_summaries","session_id",sessions.map(row=>row.id)):Promise.resolve([]),cards.length?rows("retrieval_schedules","retrieval_card_id",cards.map(row=>row.id)):Promise.resolve([]),diagnosticRuns.length?rows("diagnostic_run_sections","run_id",diagnosticRuns.map(row=>row.id)):Promise.resolve([]),diagnosticResults.length?rows("diagnostic_skill_results","diagnostic_result_id",diagnosticResults.map(row=>row.id)):Promise.resolve([])]);categories.student_answers=answers;categories.student_summaries=summaries;categories.retrieval_schedules=schedules;categories.diagnostic_run_sections=runSections;categories.diagnostic_skill_results=skillResults;const{data:student,error:studentError}=await service.from("students").select("id,display_name,current_grade,french_background,created_at,onboarding_completed_at").eq("id",studentId).single();if(studentError||!student)throw new Error("Export incomplet (student).");await logAudit("data_export",{targetType:"student",targetId:studentId});return{exportedAt:new Date().toISOString(),formatVersion:"3.0",student,categories};}

/**
 * Records a data-deletion request (PRD §10). The controller (school/platform
 * admin) fulfils it; the request + actor are captured in the audit log.
 */
export async function requestDataDeletion(studentId: string) {
  const session=await requireRole(["parent"]);
  parsed(studentInput, { studentId });
  const supabase=await createClient();const{data:owned}=await supabase.from("students").select("id").eq("id",studentId).maybeSingle();if(!owned)throw new Error("Enfant non lié.");
  const service=createServiceClient();const{data:student}=await service.from("students").select("profile_id").eq("id",studentId).single();const{data:profile}=await service.from("profiles").select("auth_user_id").eq("id",student?.profile_id).single();if(!profile)throw new Error("Compte introuvable.");
  const{error}=await supabase.from("deletion_requests").insert({student_id:studentId,student_auth_user_id:profile.auth_user_id,requested_by_profile_id:session.id});if(error)throw new Error(error.message);
  await logAudit("data_deletion_requested", {
    targetType: "student",
    targetId: studentId,
  });
  return { ok: true };
}

const childPasswordInput=z.object({studentId:z.string().uuid()});
export async function resetChildPassword(input:unknown){const guardian=await requireRole(["parent"]);const data=parsed(childPasswordInput,input);const db=await createClient();const{data:link,error:linkError}=await db.from("student_guardians").select("student_id").eq("student_id",data.studentId).eq("guardian_profile_id",guardian.id).maybeSingle();if(linkError||!link)throw new Error("Enfant non lié à ce compte.");const service=createServiceClient();const{data:student,error:studentError}=await service.from("students").select("profile_id").eq("id",data.studentId).single();if(studentError||!student?.profile_id)throw new Error("Compte élève introuvable.");const credentials=await rotateManagedPassword(student.profile_id as string);await logAudit("child.password_rotated",{targetType:"student",targetId:data.studentId,metadata:{emailDelivered:credentials.emailDelivered}});return{username:credentials.username,password:credentials.temporaryPassword,emailDelivered:credentials.emailDelivered};}
