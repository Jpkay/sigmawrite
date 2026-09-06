import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { ManagedAccountRole } from "@/lib/user-provisioning";

export type UserManagementData = {
  viewerRole: "platform_admin" | "school_admin";
  viewerSchoolId: string | null;
  accounts: Array<{
    profileId: string;
    studentId: string | null;
    displayName: string;
    username: string;
    role: ManagedAccountRole;
    mustChangePassword: boolean;
    feedbackPilotActive: boolean;
    schoolId: string | null;
    deactivated: boolean;
    emailRecoveryEnabled: boolean;
    classIds: string[];
    guardianCount: number;
  }>;
  schools: Array<{ id: string; name: string; teacherCode: string | null }>;
  classes: Array<{ id: string; name: string; schoolId: string | null }>;
  teachers: Array<{ id: string; name: string }>;
  students: Array<{ id: string; profileId: string; name: string }>;
};

export async function getUserManagementData(): Promise<UserManagementData> {
  const session = await requireRole(["platform_admin", "school_admin"]);
  const service = createServiceClient();
  let viewerSchoolId: string | null = null;
  if (session.role === "school_admin") {
    const { data } = await service.from("profiles").select("school_id").eq("id", session.id).maybeSingle();
    viewerSchoolId = (data?.school_id as string | null) ?? null;
    if (!viewerSchoolId) throw new Error("Votre compte administrateur n’est rattaché à aucune école.");
  }
  const [profilesResult, studentsResult, schoolsResult, classesResult, pilotResult, teacherClassesResult, enrollmentsResult, guardiansResult] = await Promise.all([
    service.from("profiles").select("id,display_name,username,role,must_change_password,school_id,deactivated_at,email_recovery_enabled").in("role", ["student", "teacher", "supervisor", "parent", "school_admin"]).order("display_name"),
    service.from("students").select("id,profile_id,display_name,school_id").order("display_name"),
    viewerSchoolId ? service.from("schools").select("id,name,teacher_code").eq("id", viewerSchoolId) : service.from("schools").select("id,name,teacher_code").order("name"),
    viewerSchoolId ? service.from("classes").select("id,name,school_id").eq("school_id", viewerSchoolId).order("name") : service.from("classes").select("id,name,school_id").order("name"),
    service.from("diagnostic_pilot_enrollments").select("student_id").eq("active", true).eq("cohort_kind", "feedback_participant").gt("expires_at", new Date().toISOString()),
    service.from("teacher_classes").select("teacher_profile_id,class_id"),
    service.from("enrollments").select("student_id,class_id").eq("status", "active"),
    service.from("student_guardians").select("student_id,guardian_profile_id"),
  ]);
  const error = profilesResult.error ?? studentsResult.error ?? schoolsResult.error ?? classesResult.error ?? pilotResult.error ?? teacherClassesResult.error ?? enrollmentsResult.error ?? guardiansResult.error;
  if (error) throw new Error(error.message);

  const classIds = new Set((classesResult.data ?? []).map((row) => row.id as string));
  const studentByProfile = new Map((studentsResult.data ?? []).map((student) => [student.profile_id as string, student]));
  const feedbackStudentIds = new Set((pilotResult.data ?? []).map((row) => row.student_id as string));
  const classesByTeacher = new Map<string, string[]>();
  for (const row of teacherClassesResult.data ?? []) { const list = classesByTeacher.get(row.teacher_profile_id as string) ?? []; list.push(row.class_id as string); classesByTeacher.set(row.teacher_profile_id as string, list); }
  const classesByStudent = new Map<string, string[]>();
  for (const row of enrollmentsResult.data ?? []) { const list = classesByStudent.get(row.student_id as string) ?? []; list.push(row.class_id as string); classesByStudent.set(row.student_id as string, list); }
  const guardiansByStudent = new Map<string, number>();
  const studentsByGuardian = new Map<string, string[]>();
  for (const row of guardiansResult.data ?? []) { guardiansByStudent.set(row.student_id as string, (guardiansByStudent.get(row.student_id as string) ?? 0) + 1); const list = studentsByGuardian.get(row.guardian_profile_id as string) ?? []; list.push(row.student_id as string); studentsByGuardian.set(row.guardian_profile_id as string, list); }

  // School scope: a school administrator sees the school's own accounts, its teachers, its students and their guardians.
  const inScope = (profile: { id: string; role: string; school_id: string | null }, studentId: string | null) => {
    if (!viewerSchoolId) return true;
    if (profile.school_id === viewerSchoolId) return true;
    if (studentId) {
      const student = (studentsResult.data ?? []).find((row) => row.id === studentId);
      if (student?.school_id === viewerSchoolId) return true;
      if ((classesByStudent.get(studentId) ?? []).some((id) => classIds.has(id))) return true;
    }
    if (profile.role === "teacher" && (classesByTeacher.get(profile.id) ?? []).some((id) => classIds.has(id))) return true;
    if (profile.role === "parent") {
      return (studentsByGuardian.get(profile.id) ?? []).some((sid) => (classesByStudent.get(sid) ?? []).some((id) => classIds.has(id)));
    }
    return false;
  };

  const accounts = (profilesResult.data ?? []).map((profile) => {
    const student = studentByProfile.get(profile.id as string);
    const studentId = (student?.id as string | undefined) ?? null;
    return {
      profileId: profile.id as string,
      studentId,
      displayName: (profile.display_name as string | null) ?? (profile.username as string),
      username: profile.username as string,
      role: profile.role as ManagedAccountRole,
      mustChangePassword: Boolean(profile.must_change_password),
      feedbackPilotActive: studentId ? feedbackStudentIds.has(studentId) : false,
      schoolId: (profile.school_id as string | null) ?? (student?.school_id as string | null) ?? null,
      deactivated: Boolean(profile.deactivated_at),
      emailRecoveryEnabled: Boolean(profile.email_recovery_enabled),
      classIds: profile.role === "teacher" ? (classesByTeacher.get(profile.id as string) ?? []) : studentId ? (classesByStudent.get(studentId) ?? []) : [],
      guardianCount: studentId ? (guardiansByStudent.get(studentId) ?? 0) : 0,
      _scope: { id: profile.id as string, role: profile.role as string, school_id: (profile.school_id as string | null) ?? null },
    };
  }).filter((account) => inScope(account._scope, account.studentId)).map(({ _scope, ...account }) => { void _scope; return account; });
  const teachers = accounts.filter((account) => account.role === "teacher" && !account.deactivated).map((account) => ({ id: account.profileId, name: account.displayName }));
  const visibleStudentIds = new Set(accounts.filter((account) => account.studentId).map((account) => account.studentId as string));
  const students = (studentsResult.data ?? []).filter((student) => visibleStudentIds.has(student.id as string)).map((student) => ({
    id: student.id as string,
    profileId: student.profile_id as string,
    name: (student.display_name as string | null) ?? "Élève",
  }));
  return {
    viewerRole: session.role as "platform_admin" | "school_admin",
    viewerSchoolId,
    accounts,
    schools: (schoolsResult.data ?? []).map((school) => ({ id: school.id as string, name: school.name as string, teacherCode: (school.teacher_code as string | null) ?? null })),
    classes: (classesResult.data ?? []).map((selectedClass) => ({ id: selectedClass.id as string, name: selectedClass.name as string, schoolId: selectedClass.school_id as string | null })),
    teachers,
    students,
  };
}

export async function getClassManagedAccounts(classId: string): Promise<Array<{ profileId: string; name: string; username: string }>> {
  const session = await requireRole(["teacher", "school_admin"]);
  if (session.role !== "teacher") return [];
  const service = createServiceClient();
  const { data: ownership } = await service.from("teacher_classes")
    .select("class_id")
    .eq("class_id", classId)
    .eq("teacher_profile_id", session.id)
    .maybeSingle();
  if (!ownership) throw new Error("Classe introuvable.");
  const { data: enrollments, error: enrollmentError } = await service.from("enrollments")
    .select("student_id")
    .eq("class_id", classId)
    .eq("status", "active");
  if (enrollmentError || !enrollments?.length) return [];
  const studentIds = enrollments.map((row) => row.student_id as string);
  const { data: students, error: studentError } = await service.from("students")
    .select("id,profile_id,display_name")
    .in("id", studentIds);
  if (studentError || !students?.length) return [];
  const profileIds = students.map((student) => student.profile_id as string).filter(Boolean);
  if (!profileIds.length) return [];
  const { data: profiles, error: profileError } = await service.from("profiles")
    .select("id,username")
    .in("id", profileIds);
  if (profileError) throw new Error(profileError.message);
  const usernameByProfile = new Map((profiles ?? []).map((profile) => [profile.id as string, profile.username as string]));
  return students.flatMap((student) => {
    const username = usernameByProfile.get(student.profile_id as string);
    return username ? [{ profileId: student.profile_id as string, name: (student.display_name as string | null) ?? "Élève", username }] : [];
  }).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
