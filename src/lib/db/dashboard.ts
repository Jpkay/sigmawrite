import { createClient } from "@/lib/supabase/server";
import type { StudentRow, StudentSnapshot } from "@/lib/reports";

/**
 * Server-side dashboard reads. All queries run through the authenticated
 * server client, so Row Level Security scopes results automatically: a parent
 * sees only linked children, a teacher only students in classes they teach
 * (PRD §14, §M, §N). No service role, no manual ownership filters.
 */

type StudentRecord = {
  id: string;
  display_name: string | null;
  app_state: StudentSnapshot | null;
};

const toRow = (r: StudentRecord): StudentRow => ({
  id: r.id,
  name: r.display_name ?? "Élève",
  snap: r.app_state ?? {},
});

/** Students the caller may view (parent → children; teacher → taught). */
export async function getViewableStudents(): Promise<StudentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, display_name, app_state");
  return ((data as StudentRecord[] | null) ?? []).map(toRow);
}

export async function getStudentRow(studentId: string): Promise<StudentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, display_name, app_state")
    .eq("id", studentId)
    .maybeSingle();
  return data ? toRow(data as StudentRecord) : null;
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
    .select("student:students(id, display_name, app_state)")
    .eq("class_id", classId);
  const rows = (data as { student: StudentRecord | StudentRecord[] }[] | null) ?? [];
  return rows
    .map((e) => (Array.isArray(e.student) ? e.student[0] : e.student))
    .filter((s): s is StudentRecord => !!s)
    .map(toRow);
}
