"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { moderateStudentText } from "@/lib/safety/moderate-input";
import { logAudit } from "@/lib/audit";
import { trackServer } from "@/lib/analytics-server";

/** Teacher server actions (PRD §23). Auth+role verified before any work. */

const classSchema = z.object({ name: z.string().trim().min(2).max(100), grade: z.number().int().min(5).max(12), academicYear: z.string().trim().min(4).max(20) });

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
    const code = `SW-${randomBytes(16).toString("hex").toUpperCase()}`;
    const { data: created, error } = await supabase.from("class_join_codes").insert({
      code,
      class_id: data.classId,
      expires_at: expiresAt,
      max_uses: data.maxUses,
      school_consent_enabled: true,
      created_by_profile_id: session.id,
    }).select("id,code,expires_at,max_uses,uses,school_consent_enabled").single();
    if (!error && created) {
      await logAudit("class.join_code_rotated", {
        targetType: "class", targetId: data.classId,
        metadata: { expiresAt, maxUses: data.maxUses, accessBasis: "school_invitation" },
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

// ---------------------------------------------------------------------------
// Teacher comments on student writing (roadmap 5.4)
// ---------------------------------------------------------------------------

const teacherCommentSchema = z.object({
  studentId: z.string().uuid(),
  targetType: z.enum(["summary", "production", "dictation", "general"]),
  targetId: z.string().uuid().optional(),
  body: z.string().trim().min(1).max(1000),
});

export type StudentWritingSample = { kind: "summary" | "production" | "dictation"; id: string; at: string; title: string; excerpt: string; score: string | null };

/** Recent writing by one student for the teacher's comment panel. RLS scopes the reads. */
export async function loadStudentWritingSamples(studentId: string): Promise<StudentWritingSample[]> {
  await requireRole(["teacher"]);
  const supabase = await createClient();
  const [{ data: productions }, { data: evaluations }, { data: dictations }] = await Promise.all([
    supabase.from("independent_production_submissions").select("id,content,submitted_at,demonstrated,competency_nodes!inner(label_fr)").eq("student_id", studentId).order("submitted_at", { ascending: false }).limit(5),
    supabase.from("writing_evaluations").select("id,submitted_text,revision_number,rubric,created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(5),
    supabase.from("dictation_attempts").select("id,score,submitted_at,dictations!inner(title_fr)").eq("student_id", studentId).not("submitted_at", "is", null).order("submitted_at", { ascending: false }).limit(5),
  ]);
  const excerpt = (text: string) => (text.length > 220 ? `${text.slice(0, 220)}…` : text);
  const samples: StudentWritingSample[] = [
    ...(productions ?? []).map((row) => ({ kind: "production" as const, id: row.id as string, at: row.submitted_at as string, title: `Production : ${(row.competency_nodes as unknown as { label_fr: string }).label_fr}`, excerpt: excerpt(row.content as string), score: row.demonstrated ? "Maîtrise démontrée" : "À retravailler" })),
    ...(evaluations ?? []).map((row) => ({ kind: "summary" as const, id: row.id as string, at: row.created_at as string, title: `Résumé (révision ${row.revision_number})`, excerpt: excerpt(row.submitted_text as string), score: (row.rubric as { score?: number } | null)?.score != null ? `${(row.rubric as { score: number }).score}/100` : null })),
    ...(dictations ?? []).map((row) => ({ kind: "dictation" as const, id: row.id as string, at: row.submitted_at as string, title: `Dictée : ${(row.dictations as unknown as { title_fr: string }).title_fr}`, excerpt: "", score: row.score == null ? null : `${Number(row.score)}/10` })),
  ];
  return samples.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 8);
}

export async function loadTeacherComments(studentId: string) {
  await requireRole(["teacher"]);
  const supabase = await createClient();
  const { data, error } = await supabase.from("teacher_comments").select("id,target_type,target_id,body_fr,created_at,read_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ id: row.id as string, targetType: row.target_type as string, targetId: row.target_id as string | null, body: row.body_fr as string, createdAt: row.created_at as string, readAt: row.read_at as string | null }));
}

/** Posts a short comment, moderated and audited, and drops it into the student's inbox. */
export async function postTeacherComment(input: unknown) {
  const session = await requireRole(["teacher"]);
  const data = teacherCommentSchema.parse(input);
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("teaches_student", { p_student_id: data.studentId });
  if (!allowed) throw new Error("Cet élève n’est pas dans vos classes.");
  const moderation = await moderateStudentText(data.body);
  if (!moderation.allowed) throw new Error("Ce commentaire ne peut pas être envoyé tel quel.");
  const service = createServiceClient();
  const { data: comment, error } = await service.from("teacher_comments").insert({ student_id: data.studentId, teacher_profile_id: session.id, target_type: data.targetType, target_id: data.targetId ?? null, body_fr: data.body }).select("id").single();
  if (error || !comment) throw new Error(error?.message ?? "Commentaire non enregistré.");
  const preview = data.body.length > 140 ? `${data.body.slice(0, 140)}…` : data.body;
  await service.from("student_notifications").insert({ student_id: data.studentId, kind: "teacher_comment", dedupe_key: `teacher_comment:${comment.id as string}`, message_fr: `Message de ton enseignant : « ${preview} »`, payload: { commentId: comment.id, targetType: data.targetType, targetId: data.targetId ?? null } });
  await logAudit("teacher.comment_posted", { targetType: "student", targetId: data.studentId, metadata: { commentId: comment.id, targetType: data.targetType } });
  revalidatePath(`/teacher/students/${data.studentId}`); revalidatePath("/student/inbox");
  return { id: comment.id as string };
}

// ---------------------------------------------------------------------------
// Class cooperative goal (roadmap 6.5)
// ---------------------------------------------------------------------------

const classGoalSchema = z.object({ classId: z.string().uuid(), targetXp: z.number().int().min(50).max(20000) });

/** Monday of the current ISO week, UTC. */
export async function currentWeekStart(now = new Date()): Promise<string> {
  const day = now.getUTCDay(); const diff = (day + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

export type ClassGoalProgress = { weekStart: string; targetXp: number; earnedXp: number; members: number; activeMembers: number } | null;

export async function loadClassGoal(classId: string): Promise<ClassGoalProgress> {
  await requireRole(["teacher", "school_admin"]);
  const supabase = await createClient(); const weekStart = await currentWeekStart();
  const { data, error } = await supabase.rpc("class_goal_progress", { p_class_id: classId, p_week_start: weekStart });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { weekStart, targetXp: Number(row.target_xp), earnedXp: Number(row.earned_xp), members: Number(row.members), activeMembers: Number(row.active_members) };
}

export async function setClassGoal(input: unknown) {
  await requireRole(["teacher"]);
  const data = classGoalSchema.parse(input);
  const supabase = await createClient(); const weekStart = await currentWeekStart();
  const { error } = await supabase.rpc("set_class_goal", { p_class_id: data.classId, p_week_start: weekStart, p_target_xp: data.targetXp });
  if (error) throw new Error(error.message);
  await logAudit("teacher.class_goal_set", { targetType: "class", targetId: data.classId, metadata: { weekStart, targetXp: data.targetXp } });
  revalidatePath(`/teacher/classes/${data.classId}`); revalidatePath("/student");
  return { weekStart, targetXp: data.targetXp };
}
