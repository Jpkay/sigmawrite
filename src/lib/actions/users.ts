"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  deliverProvisionedCredentials,
  provisionManagedAccount,
  rotateManagedPassword,
} from "@/lib/user-provisioning";

const uuid = z.string().uuid();
const managedUserInput = z.object({
  role: z.enum(["student", "teacher", "supervisor", "school_admin", "parent"]),
  displayName: z.string().trim().min(2).max(120),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  username: z.string().trim().max(32).optional(),
  grade: z.number().int().min(5).max(12).nullable().optional(),
  schoolIds: z.array(uuid).max(20).default([]),
  classIds: z.array(uuid).max(20).default([]),
  teacherIds: z.array(uuid).max(20).default([]),
  studentIds: z.array(uuid).max(100).default([]),
}).superRefine((value, context) => {
  if (value.role === "student" && value.grade == null) {
    context.addIssue({ code: "custom", message: "Le niveau est requis pour un élève." });
  }
  if (value.role === "student" && value.classIds.length === 0) {
    context.addIssue({ code: "custom", message: "Choisissez une classe pour autoriser l’accès de l’élève." });
  }
  if (value.role === "supervisor" && value.schoolIds.length === 0 && value.classIds.length === 0 && value.studentIds.length === 0) {
    context.addIssue({ code: "custom", message: "Définissez au moins une école, classe ou élève pour ce superviseur." });
  }
  if (value.role === "school_admin" && value.schoolIds.length !== 1) {
    context.addIssue({ code: "custom", message: "Un administrateur d’établissement est rattaché à exactement une école." });
  }
  if (value.role === "teacher" && value.schoolIds.length > 1) {
    context.addIssue({ code: "custom", message: "Un enseignant ne peut être rattaché qu’à une seule école." });
  }
  if (value.role === "parent" && !value.email) {
    context.addIssue({ code: "custom", message: "Un compte parent a besoin d’une adresse e-mail." });
  }
  if (value.teacherIds.length > 0 && value.role !== "student") {
    context.addIssue({ code: "custom", message: "Les enseignants directs s’appliquent uniquement à un compte élève." });
  }
  if (value.studentIds.length > 0 && value.role !== "teacher" && value.role !== "supervisor") {
    context.addIssue({ code: "custom", message: "Les élèves directs ne s’appliquent qu’aux enseignants et superviseurs." });
  }
  if (value.schoolIds.length > 0 && !["teacher", "supervisor", "school_admin"].includes(value.role)) {
    context.addIssue({ code: "custom", message: "Cette affectation d’école ne s’applique pas à ce rôle." });
  }
});

/** The school an administrator manages; platform admins are unscoped. */
async function adminScope(session: { id: string; role: string }): Promise<{ schoolId: string | null }> {
  if (session.role !== "school_admin") return { schoolId: null };
  const authenticated = await createClient();
  const { data } = await authenticated.from("profiles").select("school_id").eq("id", session.id).maybeSingle();
  if (!data?.school_id) throw new Error("Votre compte administrateur n’est rattaché à aucune école.");
  return { schoolId: data.school_id as string };
}

async function assertClassesInSchool(classIds: string[], schoolId: string | null) {
  if (!schoolId || classIds.length === 0) return;
  const service = createServiceClient();
  const { data } = await service.from("classes").select("id").in("id", classIds).eq("school_id", schoolId);
  if ((data ?? []).length !== new Set(classIds).size) throw new Error("Une classe sélectionnée n’appartient pas à votre école.");
}

async function getClassSchoolIds(classIds: string[]): Promise<Map<string, string | null>> {
  if (!classIds.length) return new Map();
  const service = createServiceClient();
  const { data, error } = await service.from("classes").select("id,school_id").in("id", classIds);
  if (error || (data ?? []).length !== new Set(classIds).size) throw new Error("Une classe sélectionnée est invalide.");
  return new Map((data ?? []).map((row) => [row.id as string, row.school_id as string | null]));
}

async function getStudentSchoolIds(studentIds: string[]): Promise<Map<string, string | null>> {
  if (!studentIds.length) return new Map();
  const service = createServiceClient();
  const { data, error } = await service.from("students").select("id,school_id").in("id", studentIds);
  if (error || (data ?? []).length !== new Set(studentIds).size) throw new Error("Un élève sélectionné est invalide.");
  return new Map((data ?? []).map((row) => [row.id as string, row.school_id as string | null]));
}

function assertAssignmentsShareSchool(
  schoolId: string,
  classSchools: Map<string, string | null>,
  studentSchools: Map<string, string | null>,
) {
  if ([...classSchools.values()].some((value) => value !== schoolId)) {
    throw new Error("Toutes les classes sélectionnées doivent appartenir à l’école de l’enseignant.");
  }
  if ([...studentSchools.values()].some((value) => value !== schoolId)) {
    throw new Error("Tous les élèves directement affectés doivent appartenir à l’école de l’enseignant.");
  }
}

async function assertProfileInSchool(profileId: string, schoolId: string | null) {
  if (!schoolId) return;
  const authenticated = await createClient();
  const { data: profile, error } = await authenticated.from("profiles").select("id").eq("id", profileId).maybeSingle();
  if (error || !profile) throw new Error("Ce compte n’appartient pas à votre école.");
}

async function verifyTeacherClasses(teacherProfileId: string, classIds: string[]) {
  if (!classIds.length) throw new Error("Choisissez au moins une classe.");
  const db = await createClient();
  const { data, error } = await db.from("teacher_classes")
    .select("class_id")
    .eq("teacher_profile_id", teacherProfileId)
    .in("class_id", classIds);
  if (error || new Set((data ?? []).map((row) => row.class_id as string)).size !== new Set(classIds).size) {
    throw new Error("Vous ne pouvez créer un compte que dans une classe que vous enseignez.");
  }
}

async function validateProfileRoles(profileIds: string[], role: "teacher") {
  if (!profileIds.length) return;
  const service = createServiceClient();
  const { data, error } = await service.from("profiles").select("id,role,deactivated_at").in("id", profileIds);
  if (error || (data ?? []).length !== new Set(profileIds).size || (data ?? []).some((profile) => profile.role !== role || profile.deactivated_at)) {
    throw new Error("Une affectation de compte est invalide.");
  }
}

async function getActiveTeacherSchoolIds(profileIds: string[]): Promise<Map<string, string | null>> {
  if (!profileIds.length) return new Map();
  const service = createServiceClient();
  const { data, error } = await service.from("profiles")
    .select("id,role,school_id,deactivated_at")
    .in("id", profileIds);
  if (error || (data ?? []).length !== new Set(profileIds).size || (data ?? []).some((profile) => profile.role !== "teacher" || profile.deactivated_at)) {
    throw new Error("Un enseignant sélectionné est introuvable ou inactif.");
  }
  return new Map((data ?? []).map((profile) => [profile.id as string, profile.school_id as string | null]));
}

export async function createManagedUser(input: unknown) {
  const session = await requireRole(["teacher", "school_admin", "platform_admin"]);
  const parsed = managedUserInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Données de compte invalides.");
  const data = parsed.data;
  let teacherIds = [...new Set(data.teacherIds)];
  const classIds = [...new Set(data.classIds)];
  const schoolIds = [...new Set(data.schoolIds)];
  const studentIds = [...new Set(data.studentIds)];
  const scope = await adminScope(session);
  if (session.role === "teacher") {
    if (data.role !== "student") throw new Error("Un enseignant peut uniquement créer des comptes élèves.");
    if (teacherIds.length) throw new Error("Un enseignant ne peut pas s’accorder lui-même un lien direct.");
    await verifyTeacherClasses(session.id, classIds);
    teacherIds = [];
  } else if (session.role === "school_admin") {
    if (!["student", "teacher", "parent"].includes(data.role)) throw new Error("Un administrateur d’établissement crée des comptes élèves, enseignants et parents.");
    await assertClassesInSchool(classIds, scope.schoolId);
    for (const teacherId of teacherIds) await assertProfileInSchool(teacherId, scope.schoolId);
    await validateProfileRoles(teacherIds, "teacher");
  } else {
    await validateProfileRoles(teacherIds, "teacher");
  }

  let accountSchoolId = data.role === "school_admin" ? schoolIds[0] : null;
  let selectedClassSchools = new Map<string, string | null>();
  let selectedStudentSchools = new Map<string, string | null>();
  if (data.role === "teacher") {
    if (session.role === "platform_admin" && schoolIds.length !== 1) {
      throw new Error("Choisissez l’école de l’enseignant.");
    }
    accountSchoolId = scope.schoolId ?? schoolIds[0] ?? null;
    if (!accountSchoolId) throw new Error("L’enseignant doit être rattaché à une école.");
    [selectedClassSchools, selectedStudentSchools] = await Promise.all([
      getClassSchoolIds(classIds),
      getStudentSchoolIds(studentIds),
    ]);
    assertAssignmentsShareSchool(accountSchoolId, selectedClassSchools, selectedStudentSchools);
  }
  if (data.role === "student") {
    selectedClassSchools = await getClassSchoolIds(classIds);
    const studentSchoolIds = new Set([...selectedClassSchools.values()]);
    if (studentSchoolIds.has(null) || studentSchoolIds.size !== 1) {
      throw new Error("Toutes les classes de l’élève doivent appartenir à une seule école.");
    }
    accountSchoolId = [...studentSchoolIds][0];
    const teacherSchools = await getActiveTeacherSchoolIds(teacherIds);
    if ([...teacherSchools.values()].some((schoolId) => schoolId !== accountSchoolId)) {
      throw new Error("Tous les enseignants directs doivent appartenir à l’école de l’élève.");
    }
  }

  const credentials = await provisionManagedAccount({
    role: data.role,
    displayName: data.displayName,
    requestedUsername: data.username || null,
    email: data.email || null,
    grade: data.grade ?? null,
    provisionedByProfileId: session.id,
    schoolId: accountSchoolId,
    deliverEmail: false,
  });
  const service = createServiceClient();

  try {
    if (classIds.length) {
      const classes = selectedClassSchools.size
        ? [...selectedClassSchools].map(([id, school_id]) => ({ id, school_id }))
        : [...await getClassSchoolIds(classIds)].map(([id, school_id]) => ({ id, school_id }));
      if (data.role === "student" && credentials.studentId) {
        const { error: enrollmentError } = await service.from("enrollments").upsert(
          classIds.map((classId) => ({ student_id: credentials.studentId, class_id: classId, status: "active" })),
          { onConflict: "student_id,class_id" },
        );
        if (enrollmentError) throw new Error(enrollmentError.message);
        const schoolId = classes.find((row) => row.school_id)?.school_id as string | undefined;
        if (schoolId) {
          const { error } = await service.from("students").update({ school_id: schoolId }).eq("id", credentials.studentId);
          if (error) throw new Error(error.message);
        }
      }
      if (data.role === "teacher") {
        const db = await createClient();
        for (const classId of classIds) {
          const { error } = await db.rpc("set_teacher_class", {
            p_teacher_profile_id: credentials.profileId,
            p_class_id: classId,
            p_assigned: true,
          });
          if (error) throw new Error(error.message);
        }
      }
      if (data.role === "supervisor") {
        const { error } = await service.from("supervisor_classes").upsert(
          classIds.map((classId) => ({ supervisor_profile_id: credentials.profileId, class_id: classId, assigned_by_profile_id: session.id })),
          { onConflict: "supervisor_profile_id,class_id" },
        );
        if (error) throw new Error(error.message);
      }
    }

    if (data.role === "student" && credentials.studentId && teacherIds.length) {
      const db = await createClient();
      for (const teacherId of teacherIds) {
        const { error } = await db.rpc("set_teacher_student", {
          p_teacher_profile_id: teacherId,
          p_student_id: credentials.studentId,
          p_assigned: true,
        });
        if (error) throw new Error(error.message);
      }
    }
    if (data.role === "teacher" && studentIds.length) {
      const db = await createClient();
      for (const studentId of studentIds) {
        const { error } = await db.rpc("set_teacher_student", {
          p_teacher_profile_id: credentials.profileId,
          p_student_id: studentId,
          p_assigned: true,
        });
        if (error) throw new Error(error.message);
      }
    }
    if (data.role === "supervisor" && schoolIds.length) {
      const { error } = await service.from("supervisor_schools").upsert(
        schoolIds.map((schoolId) => ({ supervisor_profile_id: credentials.profileId, school_id: schoolId, assigned_by_profile_id: session.id })),
        { onConflict: "supervisor_profile_id,school_id" },
      );
      if (error) throw new Error(error.message);
    }
    if (data.role === "supervisor" && studentIds.length) {
      const { error } = await service.from("supervisor_students").upsert(
        studentIds.map((studentId) => ({ supervisor_profile_id: credentials.profileId, student_id: studentId, assigned_by_profile_id: session.id })),
        { onConflict: "supervisor_profile_id,student_id" },
      );
      if (error) throw new Error(error.message);
    }

    const emailDelivered = await deliverProvisionedCredentials(credentials, data.displayName);
    await logAudit("user.managed_account_created", {
      targetType: "profile",
      targetId: credentials.profileId,
      metadata: {
        role: data.role,
        emailDelivered,
        classCount: classIds.length,
      },
    });
    revalidatePath("/admin/users");
    revalidatePath("/teacher");
    revalidatePath("/teacher/classes");
    for (const classId of classIds) revalidatePath(`/teacher/classes/${classId}`);
    return { ...credentials, emailDelivered };
  } catch (error) {
    await service.auth.admin.deleteUser(credentials.authUserId);
    throw error;
  }
}

export async function resetManagedUserPassword(input: unknown) {
  const session = await requireRole(["teacher", "school_admin", "platform_admin"]);
  const { profileId } = z.object({ profileId: uuid }).parse(input);
  if (session.role === "school_admin") await assertProfileInSchool(profileId, (await adminScope(session)).schoolId);
  const service = createServiceClient();
  const { data: target } = await service.from("profiles").select("role").eq("id", profileId).maybeSingle();
  const resettable = session.role === "platform_admin" ? ["student", "teacher", "supervisor", "parent", "school_admin"] : ["student", "teacher", "parent"];
  if (!target || !resettable.includes(target.role as string)) throw new Error("Ce compte ne peut pas être réinitialisé ici.");
  if (session.role === "teacher") {
    const db = await createClient();
    const { data: student } = await db.from("students").select("id").eq("profile_id", profileId).maybeSingle();
    if (!student) throw new Error("Cet élève ne vous est pas affecté.");
  }
  const credentials = await rotateManagedPassword(profileId);
  await logAudit("user.temporary_password_issued", {
    targetType: "profile",
    targetId: profileId,
    metadata: { emailDelivered: credentials.emailDelivered },
  });
  revalidatePath("/admin/users");
  return credentials;
}

export async function assignStudentAccess(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const data = z.object({
    studentId: uuid,
    classId: uuid,
    teacherProfileId: uuid.optional().nullable(),
  }).parse(input);
  const db = await createClient();
  const { error } = await db.rpc("assign_student_class", {
    p_student_id: data.studentId,
    p_class_id: data.classId,
    p_teacher_profile_id: data.teacherProfileId ?? null,
  });
  if (error) {
    const messages: Record<string, string> = {
      student_school_mismatch: "L’élève et la classe doivent appartenir à la même école. Aucun transfert n’a été effectué.",
      student_not_found: "Élève introuvable.",
      class_not_found: "Classe introuvable.",
      not_a_teacher: "L’enseignant sélectionné est introuvable ou inactif.",
      teacher_school_mismatch: "L’enseignant et l’élève doivent appartenir à la même école.",
      forbidden: "Vous ne pouvez pas modifier les affectations de cette école.",
    };
    throw new Error(messages[error.message] ?? error.message);
  }
  await logAudit("student.access_assigned", {
    targetType: "student",
    targetId: data.studentId,
    metadata: { classId: data.classId, teacherProfileId: data.teacherProfileId ?? null, by: session.id },
  });
  revalidatePath("/admin/users");
  revalidatePath("/teacher");
  revalidatePath(`/teacher/students/${data.studentId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Account management (audit 2026-09-06): teacher ↔ class, role changes,
// deactivation, e-mail attachment, guardians, teacher sign-up code.
// ---------------------------------------------------------------------------

export async function setTeacherClass(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const data = z.object({ teacherProfileId: uuid, classId: uuid, assigned: z.boolean() }).parse(input);
  const db = await createClient();
  const { error } = await db.rpc("set_teacher_class", { p_teacher_profile_id: data.teacherProfileId, p_class_id: data.classId, p_assigned: data.assigned });
  if (error) throw new Error(error.message === "teacher_school_mismatch" ? "L’enseignant actif et la classe doivent appartenir à la même école." : error.message);
  await logAudit("user.teacher_class_set", { targetType: "profile", targetId: data.teacherProfileId, metadata: { classId: data.classId, assigned: data.assigned, by: session.id } });
  revalidatePath("/admin/users");
  revalidatePath("/teacher");
  return { ok: true };
}

export async function setTeacherStudent(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const data = z.object({ teacherProfileId: uuid, studentId: uuid, assigned: z.boolean() }).parse(input);
  const db = await createClient();
  const { error } = await db.rpc("set_teacher_student", {
    p_teacher_profile_id: data.teacherProfileId,
    p_student_id: data.studentId,
    p_assigned: data.assigned,
  });
  if (error) {
    const message = error.message === "teacher_school_mismatch"
      ? "L’enseignant actif et l’élève doivent appartenir à la même école."
      : error.message === "student_school_required"
        ? "Cet élève doit d’abord être rattaché à une école."
        : error.message;
    throw new Error(message);
  }
  await logAudit("user.teacher_student_set", {
    targetType: "profile",
    targetId: data.teacherProfileId,
    metadata: { studentId: data.studentId, assigned: data.assigned, by: session.id },
  });
  revalidatePath("/admin/users");
  revalidatePath("/teacher");
  revalidatePath(`/teacher/students/${data.studentId}`);
  return { ok: true };
}

const ROLE_CHANGE_TARGETS = ["student", "parent", "teacher", "supervisor", "school_admin"] as const;

/** Platform admins only. Never touches evidence; a student profile keeps its student row. */
export async function changeUserRole(input: unknown) {
  const session = await requireRole(["platform_admin"]);
  const data = z.object({ profileId: uuid, role: z.enum(ROLE_CHANGE_TARGETS), schoolId: uuid.nullable().optional() }).parse(input);
  if (data.profileId === session.id) throw new Error("Vous ne pouvez pas changer votre propre rôle.");
  if (data.role === "school_admin" && !data.schoolId) throw new Error("Choisissez l’école de cet administrateur.");
  const service = createServiceClient();
  const { data: before } = await service.from("profiles").select("role,school_id").eq("id", data.profileId).maybeSingle();
  if (!before) throw new Error("Compte introuvable.");
  const { error } = await service.from("profiles").update({ role: data.role, school_id: data.schoolId ?? (data.role === "school_admin" ? before.school_id : before.school_id) }).eq("id", data.profileId);
  if (error) throw new Error(error.message);
  if (data.role !== "teacher") {
    await service.from("teacher_classes").delete().eq("teacher_profile_id", data.profileId);
    await service.from("teacher_students").delete().eq("teacher_profile_id", data.profileId);
  }
  await logAudit("user.role_changed", { targetType: "profile", targetId: data.profileId, metadata: { from: before.role, to: data.role, schoolId: data.schoolId ?? null } });
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Offboarding: the account can no longer sign in; teacher links are removed; evidence stays. */
export async function setUserDeactivated(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const data = z.object({ profileId: uuid, deactivated: z.boolean() }).parse(input);
  if (data.profileId === session.id) throw new Error("Vous ne pouvez pas désactiver votre propre compte.");
  const scope = await adminScope(session);
  await assertProfileInSchool(data.profileId, scope.schoolId);
  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("auth_user_id,role").eq("id", data.profileId).maybeSingle();
  if (!profile) throw new Error("Compte introuvable.");
  if (session.role === "school_admin" && !["student", "teacher", "parent"].includes(profile.role as string)) throw new Error("Ce compte ne peut pas être désactivé ici.");
  const { error } = await service.from("profiles").update({ deactivated_at: data.deactivated ? new Date().toISOString() : null }).eq("id", data.profileId);
  if (error) throw new Error(error.message);
  const { error: banError } = await service.auth.admin.updateUserById(profile.auth_user_id as string, { ban_duration: data.deactivated ? "876000h" : "none" });
  if (banError) throw new Error(banError.message);
  if (data.deactivated && profile.role === "teacher") {
    await service.from("teacher_classes").delete().eq("teacher_profile_id", data.profileId);
    await service.from("teacher_students").delete().eq("teacher_profile_id", data.profileId);
  }
  await logAudit(data.deactivated ? "user.deactivated" : "user.reactivated", { targetType: "profile", targetId: data.profileId, metadata: { role: profile.role, by: session.id } });
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Gives an account created without e-mail a real address, enabling recovery and magic links. */
export async function attachEmailToAccount(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const data = z.object({ profileId: uuid, email: z.string().trim().email() }).parse(input);
  const scope = await adminScope(session);
  await assertProfileInSchool(data.profileId, scope.schoolId);
  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("auth_user_id").eq("id", data.profileId).maybeSingle();
  if (!profile) throw new Error("Compte introuvable.");
  const { error } = await service.auth.admin.updateUserById(profile.auth_user_id as string, { email: data.email.toLowerCase(), email_confirm: true });
  if (error) throw new Error(/already/iu.test(error.message) ? "Cette adresse est déjà utilisée par un autre compte." : error.message);
  const { error: profileError } = await service.from("profiles").update({ email_recovery_enabled: true }).eq("id", data.profileId);
  if (profileError) throw new Error(profileError.message);
  await logAudit("user.email_attached", { targetType: "profile", targetId: data.profileId, metadata: { by: session.id } });
  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * Links a guardian to a student by e-mail. An existing parent account is
 * linked directly; otherwise a parent account is provisioned with a temporary
 * password and the credentials are e-mailed. Several guardians per child are
 * allowed (consent is recorded per guardian).
 */
export async function linkGuardian(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin", "teacher"]);
  const data = z.object({ studentId: uuid, email: z.string().trim().email(), displayName: z.string().trim().min(2).max(120).optional() }).parse(input);
  if (session.role === "school_admin") {
    const authenticated = await createClient();
    const { data: student } = await authenticated.from("students").select("profile_id").eq("id", data.studentId).maybeSingle();
    if (!student?.profile_id) throw new Error("Élève introuvable.");
    await assertProfileInSchool(student.profile_id as string, (await adminScope(session)).schoolId);
  }
  if (session.role === "teacher") {
    const db = await createClient();
    const { data: visible } = await db.from("students").select("id").eq("id", data.studentId).maybeSingle();
    if (!visible) throw new Error("Cet élève ne vous est pas affecté.");
  }
  const service = createServiceClient();
  const email = data.email.toLowerCase();
  let guardianProfileId: string | null = null; let created = false; let emailDelivered = false;
  const { data: users } = await service.auth.admin.listUsers({ perPage: 1000 });
  const existing = users?.users.find((user) => user.email?.toLowerCase() === email);
  if (existing) {
    const { data: profile } = await service.from("profiles").select("id,role").eq("auth_user_id", existing.id).maybeSingle();
    if (!profile) throw new Error("Ce compte n’a pas de profil.");
    if (profile.role !== "parent") throw new Error("Cette adresse appartient à un compte qui n’est pas un compte parent.");
    guardianProfileId = profile.id as string;
  } else {
    const credentials = await provisionManagedAccount({ role: "parent", displayName: data.displayName ?? email.split("@")[0], email, provisionedByProfileId: session.id, deliverEmail: true });
    guardianProfileId = credentials.profileId; created = true; emailDelivered = credentials.emailDelivered;
  }
  const { error } = await service.from("student_guardians").upsert({ student_id: data.studentId, guardian_profile_id: guardianProfileId }, { onConflict: "student_id,guardian_profile_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  await logAudit("student.guardian_linked", { targetType: "student", targetId: data.studentId, metadata: { guardianProfileId, created, by: session.id } });
  revalidatePath("/admin/users"); revalidatePath("/parent");
  return { ok: true, created, emailDelivered };
}

export async function rotateSchoolTeacherCode(input: unknown) {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const data = z.object({ schoolId: uuid }).parse(input);
  const scope = await adminScope(session);
  if (scope.schoolId && scope.schoolId !== data.schoolId) throw new Error("Vous ne gérez pas cette école.");
  const db = await createClient();
  const { data: code, error } = await db.rpc("rotate_teacher_code", { p_school_id: data.schoolId });
  if (error) throw new Error(error.message);
  await logAudit("school.teacher_code_rotated", { targetType: "school", targetId: data.schoolId, metadata: { by: session.id } });
  revalidatePath("/admin/users");
  return { code: code as string };
}
