import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { ManagedAccountRole } from "@/lib/user-provisioning";

export type UserManagementData = {
  accounts: Array<{
    profileId: string;
    studentId: string | null;
    displayName: string;
    username: string;
    role: ManagedAccountRole;
    mustChangePassword: boolean;
    feedbackPilotActive: boolean;
  }>;
  schools: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string; schoolId: string | null }>;
  teachers: Array<{ id: string; name: string }>;
  students: Array<{ id: string; profileId: string; name: string }>;
};

export async function getUserManagementData(): Promise<UserManagementData> {
  await requireRole(["platform_admin"]);
  const service = createServiceClient();
  const [profilesResult, studentsResult, schoolsResult, classesResult, pilotResult] = await Promise.all([
    service.from("profiles").select("id,display_name,username,role,must_change_password").in("role", ["student", "teacher", "supervisor"]).order("display_name"),
    service.from("students").select("id,profile_id,display_name").order("display_name"),
    service.from("schools").select("id,name").order("name"),
    service.from("classes").select("id,name,school_id").order("name"),
    service.from("diagnostic_pilot_enrollments").select("student_id").eq("active", true).eq("cohort_kind", "feedback_participant").gt("expires_at", new Date().toISOString()),
  ]);
  const error = profilesResult.error ?? studentsResult.error ?? schoolsResult.error ?? classesResult.error ?? pilotResult.error;
  if (error) throw new Error(error.message);

  const studentByProfile = new Map((studentsResult.data ?? []).map((student) => [student.profile_id as string, student]));
  const feedbackStudentIds = new Set((pilotResult.data ?? []).map((row) => row.student_id as string));
  const accounts = (profilesResult.data ?? []).map((profile) => ({
    profileId: profile.id as string,
    studentId: (studentByProfile.get(profile.id as string)?.id as string | undefined) ?? null,
    displayName: (profile.display_name as string | null) ?? (profile.username as string),
    username: profile.username as string,
    role: profile.role as ManagedAccountRole,
    mustChangePassword: Boolean(profile.must_change_password),
    feedbackPilotActive: feedbackStudentIds.has(studentByProfile.get(profile.id as string)?.id as string),
  }));
  const teachers = accounts.filter((account) => account.role === "teacher").map((account) => ({ id: account.profileId, name: account.displayName }));
  const students = (studentsResult.data ?? []).map((student) => ({
    id: student.id as string,
    profileId: student.profile_id as string,
    name: (student.display_name as string | null) ?? "Élève",
  }));
  return {
    accounts,
    schools: (schoolsResult.data ?? []).map((school) => ({ id: school.id as string, name: school.name as string })),
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
