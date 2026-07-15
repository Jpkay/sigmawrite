"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  DIAGNOSTIC_ITEM_BANK_RELEASE_KEY,
  DIAGNOSTIC_TAXONOMY_RELEASE_KEY,
} from "@/lib/diagnostic/protocol";

const toggleSchema = z.object({ enabled: z.boolean() });
const enrollSchema = z.object({
  studentId: z.string().uuid(),
  durationDays: z.number().int().min(1).max(30),
  note: z.string().trim().max(500).optional(),
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
  if (!parsed.success) throw new Error("Données invalides.");
  const db = await createClient();
  const [{ data: taxonomy, error: taxonomyError }, { data: bank, error: bankError }] = await Promise.all([
    db.from("taxonomy_releases").select("id").eq("release_key", DIAGNOSTIC_TAXONOMY_RELEASE_KEY).in("status", ["validating", "published"]).maybeSingle(),
    db.from("diagnostic_item_bank_releases").select("id,taxonomy_release_id").eq("bank_key", DIAGNOSTIC_ITEM_BANK_RELEASE_KEY).in("status", ["draft", "validating"]).maybeSingle(),
  ]);
  if (taxonomyError || bankError) throw new Error(taxonomyError?.message ?? bankError?.message);
  if (!taxonomy || !bank || bank.taxonomy_release_id !== taxonomy.id) {
    throw new Error("La taxonomie et la banque pilote ne sont pas disponibles.");
  }
  const expiresAt = new Date(Date.now() + parsed.data.durationDays * 86_400_000).toISOString();
  const { data: enrollment, error } = await db.from("diagnostic_pilot_enrollments").insert({
    student_id: parsed.data.studentId,
    taxonomy_release_id: taxonomy.id,
    bank_release_id: bank.id,
    expires_at: expiresAt,
    enrolled_by: admin.id,
    note: parsed.data.note || null,
  }).select("id").single();
  if (error || !enrollment) {
    if (error?.code === "23505") throw new Error("Cet élève possède déjà un accès pilote actif.");
    throw new Error(error?.message ?? "Inscription pilote impossible.");
  }
  await logAudit("diagnostic.pilot_student_enrolled", {
    targetType: "student",
    targetId: parsed.data.studentId,
    metadata: { enrollmentId: enrollment.id, expiresAt },
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
