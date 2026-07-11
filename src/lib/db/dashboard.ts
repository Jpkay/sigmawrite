import { createClient } from "@/lib/supabase/server";
import type { StudentRow, StudentSnapshot } from "@/lib/reports";
import { getStudentStateData } from "@/lib/db/student";

/**
 * Server-side dashboard reads. All queries run through the authenticated
 * server client, so Row Level Security scopes results automatically: a parent
 * sees only linked children, a teacher only students in classes they teach
 * (PRD §14, §M, §N). No service role, no manual ownership filters.
 */

type StudentRecord = {
  id: string;
  display_name: string | null;
};

const toRow = (r: StudentRecord, snap: StudentSnapshot): StudentRow => ({
  id: r.id,
  name: r.display_name ?? "Élève",
  snap,
});

/** Students the caller may view (parent → children; teacher → taught). */
export async function getViewableStudents(): Promise<StudentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("students").select("id, display_name");
  const students = (data as StudentRecord[] | null) ?? [];
  return Promise.all(students.map(async (student) =>
    toRow(student, await getStudentStateData(student.id, supabase))
  ));
}

export async function getStudentRow(studentId: string): Promise<StudentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, display_name")
    .eq("id", studentId)
    .maybeSingle();
  if (!data) return null;
  const student = data as StudentRecord;
  return toRow(student, await getStudentStateData(student.id, supabase));
}

export type ClassRecord = { id: string; name: string; grade_level: number | null };

export async function getTeacherClasses(): Promise<ClassRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("classes").select("id, name, grade_level");
  return (data as ClassRecord[] | null) ?? [];
}

export async function getClassStudents(classId: string): Promise<StudentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("student:students(id, display_name)")
    .eq("class_id", classId);
  const rows = (data as { student: StudentRecord | StudentRecord[] }[] | null) ?? [];
  const students = rows
    .map((e) => (Array.isArray(e.student) ? e.student[0] : e.student))
    .filter((s): s is StudentRecord => !!s);
  return Promise.all(students.map(async (student) =>
    toRow(student, await getStudentStateData(student.id, supabase))
  ));
}
