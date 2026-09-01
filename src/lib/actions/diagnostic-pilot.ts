"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createDiagnosticPilotEnrollment,
} from "@/lib/diagnostic/pilot-enrollment";

const toggleSchema = z.object({ enabled: z.boolean() });
const enrollSchema = z.object({
  studentId: z.string().uuid(),
  durationDays: z.number().int().min(1).max(30),
  note: z.string().trim().max(500).optional(),
  cohortKind: z.enum(["internal_test", "feedback_participant"]).default("internal_test"),
  feedbackAgreementSource: z.enum(["student", "guardian"]).optional(),
  agreementConfirmed: z.boolean().optional(),
}).superRefine((value, context) => {
  if (value.cohortKind === "feedback_participant" && (!value.agreementConfirmed || !value.feedbackAgreementSource)) {
    context.addIssue({ code: "custom", message: "Confirmez l’accord de participation au pilote de feedback." });
  }
});
const revokeSchema = z.object({ enrollmentId: z.string().uuid() });

function refresh() {
  revalidatePath("/admin/diagnostic-pilot");
  revalidatePath("/student/diagnostic");
}

export async function setDiagnosticPilotEnabled(input: unknown) {
  const admin = await requireRole(["platform_admin"]);
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) throw new Error("Données invalides.");
  const db = await createClient();
  const { error } = await db.from("diagnostic_pilot_settings").upsert({
    singleton: true,
    enabled: parsed.data.enabled,
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "singleton" });
  if (error) throw new Error(error.message);
  await logAudit(`diagnostic.pilot_${parsed.data.enabled ? "enabled" : "disabled"}`, {
    targetType: "diagnostic_pilot",
    targetId: admin.id,
  });
  refresh();
  return { ok: true };
}

export async function enrollDiagnosticPilotStudent(input: unknown) {
  const admin = await requireRole(["platform_admin"]);
  const parsed = enrollSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Données invalides.");
  const feedbackAgreedAt = parsed.data.cohortKind === "feedback_participant"
    ? new Date().toISOString()
    : null;
  const enrollment = await createDiagnosticPilotEnrollment({
    studentId: parsed.data.studentId,
    enrolledBy: admin.id,
    durationDays: parsed.data.durationDays,
    note: parsed.data.note,
    cohortKind: parsed.data.cohortKind,
    feedbackAgreementSource: parsed.data.feedbackAgreementSource,
    feedbackAgreedAt,
  });
  await logAudit(parsed.data.cohortKind === "feedback_participant"
    ? "diagnostic.feedback_participant_enrolled"
    : "diagnostic.pilot_student_enrolled", {
    targetType: "student",
    targetId: parsed.data.studentId,
    metadata: {
      enrollmentId: enrollment.enrollmentId,
      expiresAt: enrollment.expiresAt,
      cohortKind: parsed.data.cohortKind,
      feedbackAgreementSource: parsed.data.feedbackAgreementSource,
    },
  });
  refresh();
  return { ok: true };
}

export async function revokeDiagnosticPilotEnrollment(input: unknown) {
  const admin = await requireRole(["platform_admin"]);
  const parsed = revokeSchema.safeParse(input);
  if (!parsed.success) throw new Error("Données invalides.");
  const db = await createClient();
  const { data, error } = await db.from("diagnostic_pilot_enrollments").update({
    active: false,
    revoked_at: new Date().toISOString(),
  }).eq("id", parsed.data.enrollmentId).eq("active", true).select("student_id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Cet accès pilote n’est plus actif.");
  await logAudit("diagnostic.pilot_student_revoked", {
    targetType: "student",
    targetId: data.student_id as string,
    metadata: { enrollmentId: parsed.data.enrollmentId, revokedBy: admin.id },
  });
  refresh();
  return { ok: true };
}
