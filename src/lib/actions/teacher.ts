"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { trackServer } from "@/lib/analytics-server";

/** Teacher server actions (PRD §23). Auth+role verified before any work. */

const classSchema = z.object({ name: z.string().trim().min(2).max(100), grade: z.number().int().min(1).max(12), academicYear: z.string().trim().min(4).max(20) });

export async function createClass(input: unknown) {
  await requireRole(["teacher", "school_admin"]); const parsed = classSchema.safeParse(input); if (!parsed.success) throw new Error("Paramètres de classe invalides.");
  const supabase = await createClient(); const { data, error } = await supabase.rpc("create_teacher_class", { p_name: parsed.data.name, p_grade: parsed.data.grade, p_year: parsed.data.academicYear });
  if (error || !data) throw new Error(error?.message ?? "Classe non créée.");
  await logAudit("class.created", { targetType: "class", targetId: data as string, metadata: { grade: parsed.data.grade, academicYear: parsed.data.academicYear } }); revalidatePath("/teacher"); revalidatePath("/teacher/classes"); return { classId: data as string };
}

const inviteSchema = z.object({
  classId: z.string().uuid(),
  expiresInDays: z.number().int().min(1).max(90),
  maxUses: z.number().int().min(1).max(500),
  schoolConsentEnabled: z.boolean(),
});

export async function inviteStudents(input: unknown) {
  const session = await requireRole(["teacher"]);
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) throw new Error("Paramètres du code invalides.");
  const data = parsed.data;
  const supabase = await createClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + data.expiresInDays * 86_400_000).toISOString();
  const { error: revokeError } = await supabase.from("class_join_codes").update({
    revoked_at: now.toISOString(),
  }).eq("class_id", data.classId).is("revoked_at", null);
  if (revokeError) throw new Error(revokeError.message);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = `SW-${randomBytes(3).toString("hex").toUpperCase()}`;
    const { data: created, error } = await supabase.from("class_join_codes").insert({
      code,
      class_id: data.classId,
      expires_at: expiresAt,
      max_uses: data.maxUses,
      school_consent_enabled: data.schoolConsentEnabled,
      created_by_profile_id: session.id,
    }).select("id,code,expires_at,max_uses,uses,school_consent_enabled").single();
    if (!error && created) {
      await logAudit("class.join_code_rotated", {
        targetType: "class", targetId: data.classId,
        metadata: { expiresAt, maxUses: data.maxUses, schoolConsentEnabled: data.schoolConsentEnabled },
      });
      revalidatePath(`/teacher/classes/${data.classId}`);
      return {
        id: created.id as string,
        code: created.code as string,
        expiresAt: created.expires_at as string,
        maxUses: created.max_uses as number,
        uses: created.uses as number,
        schoolConsentEnabled: created.school_consent_enabled as boolean,
      };
    }
    if (error?.code !== "23505") throw new Error(error?.message ?? "Code non créé.");
  }
  throw new Error("Impossible de générer un code unique. Réessaie.");
}

/** Assigns a reading to a class (PRD §N). RLS enforces the teacher owns the class. */
const assignmentSchema = z.object({ classId: z.string().uuid(), targetType: z.enum(["text","competency_node","catch_up_step"]).default("text"), textSlug: z.string().min(1).max(150).optional(), targetNodeId: z.string().uuid().optional(), title: z.string().trim().min(1).max(200), instructions: z.string().trim().max(1000).optional(), dueAt: z.string().date().optional().or(z.literal("")) }).refine((value) => value.targetType === "text" ? !!value.textSlug : !!value.targetNodeId, "Cible requise");

export async function createAssignment(input: unknown) {
  const session = await requireRole(["teacher"]);
  const parsed = assignmentSchema.safeParse(input); if (!parsed.success) throw new Error("Devoir invalide."); const data = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("assignments").insert({
    class_id: data.classId,
    teacher_profile_id: session.id,
    target_type: data.targetType, text_slug: data.textSlug ?? null, target_node_id: data.targetNodeId ?? null,
    title: data.title, instructions: data.instructions || null, due_at: data.dueAt || null,
  });
  if (error) throw new Error(error.message);
  await logAudit("assignment_created", {
    targetType: "class",
    targetId: data.classId,
    metadata: { targetType: data.targetType, textSlug: data.textSlug, targetNodeId: data.targetNodeId },
  });
  await trackServer(session.id,"assignment_created",{target_type:data.targetType,class_id:data.classId});
  revalidatePath("/teacher/assignments");
  return { ok: true };
}

export async function deleteAssignment(id: string) {
  await requireRole(["teacher"]);
  const parsed = z.string().uuid().safeParse(id); if (!parsed.success) throw new Error("Identifiant invalide.");
  const supabase = await createClient();
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/teacher/assignments");
  return { ok: true };
}

const enrollmentSchema = z.object({ classId: z.string().uuid(), studentId: z.string().uuid(), status: z.enum(["active","removed"]) });
export async function setClassEnrollment(input: unknown) {
  await requireRole(["teacher"]); const parsed = enrollmentSchema.safeParse(input); if (!parsed.success) throw new Error("Élève invalide.");
  const supabase = await createClient(); const { error } = await supabase.rpc("set_class_enrollment", { p_class_id: parsed.data.classId, p_student_id: parsed.data.studentId, p_status: parsed.data.status }); if (error) throw new Error(error.message);
  await logAudit("class.enrollment_changed", { targetType: "class", targetId: parsed.data.classId, metadata: { studentId: parsed.data.studentId, status: parsed.data.status } }); revalidatePath(`/teacher/classes/${parsed.data.classId}`); return { ok: true };
}

export async function viewClassProgress() {
  await requireRole(["teacher", "school_admin"]);
  return { ok: true };
}

export async function createInterventionGroup() {
  await requireRole(["teacher"]);
  return { ok: true };
}

export async function exportClassReport() {
  await requireRole(["teacher", "school_admin"]);
  return { ok: true };
}
