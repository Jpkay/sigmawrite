"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentId } from "@/lib/db/student";
import { canSelfConsent, CONSENT_VERSION, PRIVACY_POLICY_VERSION } from "@/lib/consent";
import { logAudit } from "@/lib/audit";

export async function giveStudentConsent(input: unknown) {
  await requireRole(["student"]);
  if (!z.object({}).strict().safeParse(input).success) throw new Error("Données invalides.");
  const supabase = await createClient();
  const studentId = await getCurrentStudentId(supabase);
  const { data: student, error } = await supabase.from("students").select("date_of_birth").eq("id", studentId).single();
  if (error || !student || !canSelfConsent(student.date_of_birth as string | null)) {
    throw new Error("Le consentement d'un responsable est nécessaire.");
  }
  const { data: active } = await supabase.from("consent_records").select("id")
    .eq("student_id", studentId).is("revoked_at", null).maybeSingle();
  if (!active) {
    const { error: consentError } = await supabase.from("consent_records").insert({
      student_id: studentId,
      consent_type: "student_over_15",
      consent_version: CONSENT_VERSION,
      privacy_policy_version: PRIVACY_POLICY_VERSION,
    });
    if (consentError) throw new Error(consentError.message);
  }
  await logAudit("consent.student_over_15_given", { targetType: "student", targetId: studentId });
  revalidatePath("/student", "layout");
  return { ok: true };
}
