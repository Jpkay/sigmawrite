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
import { createDiagnosticPilotEnrollment } from "@/lib/diagnostic/pilot-enrollment";

const uuid = z.string().uuid();
const managedUserInput = z.object({
  role: z.enum(["student", "teacher", "supervisor"]),
  displayName: z.string().trim().min(2).max(120),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  username: z.string().trim().max(32).optional(),
  dateOfBirth: z.union([z.string().date(), z.literal("")]).optional(),
  grade: z.number().int().min(5).max(12).nullable().optional(),
  schoolIds: z.array(uuid).max(20).default([]),
  classIds: z.array(uuid).max(20).default([]),
  teacherIds: z.array(uuid).max(20).default([]),
  studentIds: z.array(uuid).max(100).default([]),
  feedbackPilot: z.object({
    agreementSource: z.enum(["student", "guardian"]),
    agreementConfirmed: z.literal(true),
    agreedAt: z.string().datetime(),
    durationDays: z.number().int().min(1).max(30).default(30),
  }).nullable().optional(),
}).superRefine((value, context) => {
  if (value.role === "student" && (!value.dateOfBirth || value.grade == null)) {
    context.addIssue({ code: "custom", message: "La date de naissance et le niveau sont requis pour un élève." });
  }
  if (value.role === "student" && value.classIds.length === 0) {
    context.addIssue({ code: "custom", message: "Choisissez une classe pour autoriser l’accès de l’élève." });
  }
  if (value.role === "supervisor" && value.schoolIds.length === 0 && value.classIds.length === 0 && value.studentIds.length === 0) {
    context.addIssue({ code: "custom", message: "Définissez au moins une école, classe ou élève pour ce superviseur." });
  }
  if (value.feedbackPilot && value.role !== "student") {
    context.addIssue({ code: "custom", message: "Le pilote de feedback est réservé aux comptes élèves." });
  }
});

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
  const { data, error } = await service.from("profiles").select("id,role").in("id", profileIds);
  if (error || (data ?? []).length !== new Set(profileIds).size || (data ?? []).some((profile) => profile.role !== role)) {
    throw new Error("Une affectation de compte est invalide.");
  }
}

export async function createManagedUser(input: unknown) {
  const session = await requireRole(["teacher", "platform_admin"]);
  const parsed = managedUserInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Données de compte invalides.");
  const data = parsed.data;
  let teacherIds = [...new Set(data.teacherIds)];
  if (session.role === "teacher") {
    if (data.role !== "student") throw new Error("Un enseignant peut uniquement créer des comptes élèves.");
    if (data.feedbackPilot) throw new Error("Seul un administrateur peut inscrire un élève au pilote de feedback.");
    await verifyTeacherClasses(session.id, data.classIds);
    teacherIds = [session.id];
  } else {
    await validateProfileRoles(teacherIds, "teacher");
  }

  const credentials = await provisionManagedAccount({
    role: data.role,
    displayName: data.displayName,
    requestedUsername: data.username || null,
    email: data.email || null,
    dateOfBirth: data.dateOfBirth || null,
    grade: data.grade ?? null,
    provisionedByProfileId: session.id,
    deliverEmail: false,
  });
  const service = createServiceClient();

  try {
    const classIds = [...new Set(data.classIds)];
    const schoolIds = [...new Set(data.schoolIds)];
    const studentIds = [...new Set(data.studentIds)];
    if (classIds.length) {
      const { data: classes, error: classError } = await service.from("classes")
        .select("id,school_id")
        .in("id", classIds);
      if (classError || (classes ?? []).length !== classIds.length) throw new Error("Une classe sélectionnée est invalide.");
      if (data.role === "student" && credentials.studentId) {
        const { error: enrollmentError } = await service.from("enrollments").upsert(
          classIds.map((classId) => ({ student_id: credentials.studentId, class_id: classId, status: "active" })),
          { onConflict: "student_id,class_id" },
        );
        if (enrollmentError) throw new Error(enrollmentError.message);
        const schoolId = (classes ?? []).find((row) => row.school_id)?.school_id as string | undefined;
        if (schoolId) {
          const { error } = await service.from("students").update({ school_id: schoolId }).eq("id", credentials.studentId);
          if (error) throw new Error(error.message);
        }
      }
      if (data.role === "teacher") {
        const { error } = await service.from("teacher_classes").upsert(
          classIds.map((classId) => ({ teacher_profile_id: credentials.profileId, class_id: classId })),
          { onConflict: "teacher_profile_id,class_id" },
        );
        if (error) throw new Error(error.message);
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
      const { error } = await service.from("teacher_students").upsert(
        teacherIds.map((teacherId) => ({ teacher_profile_id: teacherId, student_id: credentials.studentId, assigned_by_profile_id: session.id })),
        { onConflict: "teacher_profile_id,student_id" },
      );
      if (error) throw new Error(error.message);
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

    let feedbackPilotEnrollment: { enrollmentId: string; expiresAt: string } | null = null;
    if (data.role === "student" && credentials.studentId && data.feedbackPilot) {
      feedbackPilotEnrollment = await createDiagnosticPilotEnrollment({
        studentId: credentials.studentId,
        enrolledBy: session.id,
        durationDays: data.feedbackPilot.durationDays,
        cohortKind: "feedback_participant",
        feedbackAgreementSource: data.feedbackPilot.agreementSource,
        feedbackAgreedAt: data.feedbackPilot.agreedAt,
        note: "Créé depuis Utilisateurs et accès",
      });
    }

    const emailDelivered = await deliverProvisionedCredentials(credentials, data.displayName);
    await logAudit("user.managed_account_created", {
      targetType: "profile",
      targetId: credentials.profileId,
      metadata: {
        role: data.role,
        emailDelivered,
        classCount: classIds.length,
        feedbackPilotEnrollmentId: feedbackPilotEnrollment?.enrollmentId,
        feedbackAgreementSource: data.feedbackPilot?.agreementSource,
      },
    });
    revalidatePath("/admin/users");
    revalidatePath("/teacher/classes");
    for (const classId of classIds) revalidatePath(`/teacher/classes/${classId}`);
    return { ...credentials, emailDelivered, feedbackPilotEnrollment };
  } catch (error) {
    await service.auth.admin.deleteUser(credentials.authUserId);
    throw error;
  }
}

export async function resetManagedUserPassword(input: unknown) {
  const session = await requireRole(["teacher", "platform_admin"]);
  const { profileId } = z.object({ profileId: uuid }).parse(input);
  const service = createServiceClient();
  const { data: target } = await service.from("profiles").select("role").eq("id", profileId).maybeSingle();
  if (!target || !["student", "teacher", "supervisor"].includes(target.role as string)) throw new Error("Ce compte ne peut pas être réinitialisé ici.");
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
  const session = await requireRole(["platform_admin"]);
  const data = z.object({
    studentId: uuid,
    classId: uuid,
    teacherProfileId: uuid.optional().nullable(),
  }).parse(input);
  const service = createServiceClient();
  const { data: selectedClass, error: classError } = await service.from("classes").select("id,school_id").eq("id", data.classId).single();
  if (classError || !selectedClass) throw new Error("Classe introuvable.");
  const { error: enrollmentError } = await service.from("enrollments").upsert({ student_id: data.studentId, class_id: data.classId, status: "active" }, { onConflict: "student_id,class_id" });
  if (enrollmentError) throw new Error(enrollmentError.message);
  if (selectedClass.school_id) {
    const { error: studentError } = await service.from("students").update({ school_id: selectedClass.school_id }).eq("id", data.studentId);
    if (studentError) throw new Error(studentError.message);
  }
  if (data.teacherProfileId) {
    await validateProfileRoles([data.teacherProfileId], "teacher");
    const { error } = await service.from("teacher_students").upsert({
      teacher_profile_id: data.teacherProfileId,
      student_id: data.studentId,
      assigned_by_profile_id: session.id,
    }, { onConflict: "teacher_profile_id,student_id" });
    if (error) throw new Error(error.message);
  }
  await logAudit("student.access_assigned", {
    targetType: "student",
    targetId: data.studentId,
    metadata: { classId: data.classId, teacherProfileId: data.teacherProfileId },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}
