"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getStudentStateData } from "@/lib/db/student";
import { CONSENT_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/consent";

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
  password: z.string().min(8).max(128),
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
  const email = `child+${randomUUID()}@students.sigmawrite.app`;
  const { data: created, error: authError } = await service.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: { role: "student", display_name: data.displayName, date_of_birth: data.dateOfBirth },
  });
  if (authError || !created.user) throw new Error(authError?.message ?? "Compte enfant non créé.");
  try {
    const { data: profile, error: profileError } = await service.from("profiles").select("id").eq("auth_user_id", created.user.id).single();
    if (profileError || !profile) throw new Error(profileError?.message ?? "Profil enfant non créé.");
    const { data: student, error: studentError } = await service.from("students").update({
      current_grade: data.grade,
      display_name: data.displayName,
      date_of_birth: data.dateOfBirth,
    }).eq("profile_id", profile.id).select("id").single();
    if (studentError || !student) throw new Error(studentError?.message ?? "Élève non créé.");
    const [{ error: guardianError }, { error: consentError }] = await Promise.all([
      service.from("student_guardians").insert({
        student_id: student.id,
        guardian_profile_id: session.id,
        relationship: "parent",
      }),
      service.from("consent_records").insert({
        student_id: student.id,
        guardian_profile_id: session.id,
        consent_type: "guardian",
        consent_version: CONSENT_VERSION,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
      }),
    ]);
    if (guardianError || consentError) throw new Error(guardianError?.message ?? consentError?.message);
    await logAudit("student.child_account_created", {
      targetType: "student", targetId: student.id,
      metadata: { grade: data.grade },
    });
    revalidatePath("/parent"); revalidatePath("/parent/privacy");
    return { studentId: student.id as string, email, password: data.password };
  } catch (error) {
    await service.auth.admin.deleteUser(created.user.id);
    throw error;
  }
}

/** Returns a child's full data for download (PRD §10 data export). */
export async function requestDataExport(studentId: string) {
  await requireRole(["parent"]);
  parsed(studentInput, { studentId });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, display_name, current_grade, french_background, created_at")
    .eq("id", studentId)
    .maybeSingle();
  if (error || !data) throw new Error("Données introuvables.");
  const learningEvidence = await getStudentStateData(studentId, supabase);
  const [learnerProfile,goals,competencyAttempts,competencyEstimates,writingEvaluations,interestStats]=await Promise.all([
    supabase.from("learner_profiles").select("*").eq("student_id",studentId).maybeSingle(),supabase.from("learning_goals").select("*").eq("student_id",studentId),supabase.from("competency_attempts").select("*").eq("student_id",studentId),supabase.from("student_competency_estimates").select("*").eq("student_id",studentId),supabase.from("writing_evaluations").select("*").eq("student_id",studentId),supabase.from("student_interest_stats").select("*").eq("student_id",studentId)
  ]);
  await logAudit("data_export", { targetType: "student", targetId: studentId });
  return { exportedAt: new Date().toISOString(),formatVersion:"2.0",student: data, learningEvidence,learnerProfile:learnerProfile.data,learningGoals:goals.data??[],competencyAttempts:competencyAttempts.data??[],competencyEstimates:competencyEstimates.data??[],writingEvaluations:writingEvaluations.data??[],interestStats:interestStats.data??[] };
}

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
