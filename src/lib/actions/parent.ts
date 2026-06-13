"use server";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

/**
 * Parent server actions (PRD §23). Each verifies auth+role server-side; RLS
 * further scopes every query to the caller's linked children (PRD §12, §14).
 */

/** Records guardian consent for a linked child (PRD §10). */
export async function giveConsent(studentId: string) {
  const session = await requireRole(["parent"]);
  const supabase = await createClient();
  const { error } = await supabase.from("consent_records").insert({
    student_id: studentId,
    guardian_profile_id: session.id,
    consent_type: "guardian",
    consent_version: "v1",
    privacy_policy_version: "v1",
  });
  if (error) throw new Error(error.message);
  await logAudit("consent_given", { targetType: "student", targetId: studentId });
  return { ok: true };
}

/** Returns a child's full data for download (PRD §10 data export). */
export async function requestDataExport(studentId: string) {
  await requireRole(["parent"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, display_name, current_grade, french_background, created_at, app_state")
    .eq("id", studentId)
    .maybeSingle();
  if (error || !data) throw new Error("Données introuvables.");
  await logAudit("data_export", { targetType: "student", targetId: studentId });
  return { exportedAt: new Date().toISOString(), student: data };
}

/**
 * Records a data-deletion request (PRD §10). The controller (school/platform
 * admin) fulfils it; the request + actor are captured in the audit log.
 */
export async function requestDataDeletion(studentId: string) {
  await requireRole(["parent"]);
  await logAudit("data_deletion_requested", {
    targetType: "student",
    targetId: studentId,
  });
  return { ok: true };
}
