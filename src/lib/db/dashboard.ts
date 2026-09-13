import { createClient } from "@/lib/supabase/server";
import type { StudentRow, StudentSnapshot } from "@/lib/reports";
import { getStudentStateData } from "@/lib/db/student";
import { requireRole } from "@/lib/auth";

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

export type TeacherStudentRow = StudentRow & {
  access: {
    direct: boolean;
    classes: ClassRecord[];
    schoolScope: boolean;
  };
};

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

/**
 * Teacher-home roster with the grants that make each student visible.
 * Every read uses the caller-bound client: students and evidence remain RLS
 * filtered, while the access labels explain rather than confer permission.
 */
export async function getTeacherStudentRoster(): Promise<TeacherStudentRow[]> {
  const session = await requireRole(["teacher", "school_admin"]);
  const supabase = await createClient();
  const [studentsResult, classesResult] = await Promise.all([
    supabase.from("students").select("id, display_name").order("display_name"),
    supabase.from("classes").select("id, name, grade_level").order("name"),
  ]);
  if (studentsResult.error) throw new Error(studentsResult.error.message);
  if (classesResult.error) throw new Error(classesResult.error.message);

  const students = (studentsResult.data as StudentRecord[] | null) ?? [];
  const classes = (classesResult.data as ClassRecord[] | null) ?? [];
  const classById = new Map(classes.map((row) => [row.id, row]));

  const [teacherClassesResult, directResult] = session.role === "teacher"
    ? await Promise.all([
      supabase.from("teacher_classes").select("class_id").eq("teacher_profile_id", session.id),
      supabase.from("teacher_students").select("student_id").eq("teacher_profile_id", session.id),
    ])
    : [{ data: classes.map((row) => ({ class_id: row.id })), error: null }, { data: [], error: null }];
  if (teacherClassesResult.error) throw new Error(teacherClassesResult.error.message);
  if (directResult.error) throw new Error(directResult.error.message);

  const teacherClassIds = new Set((teacherClassesResult.data ?? []).map((row) => row.class_id as string));
  const directStudentIds = new Set((directResult.data ?? []).map((row) => row.student_id as string));
  const studentIds = students.map((student) => student.id);
  const enrollmentResult = studentIds.length && teacherClassIds.size
    ? await supabase.from("enrollments")
      .select("student_id, class_id")
      .in("student_id", studentIds)
      .in("class_id", [...teacherClassIds])
      .eq("status", "active")
    : { data: [], error: null };
  if (enrollmentResult.error) throw new Error(enrollmentResult.error.message);

  const classesByStudent = new Map<string, ClassRecord[]>();
  for (const row of enrollmentResult.data ?? []) {
    const selectedClass = classById.get(row.class_id as string);
    if (!selectedClass) continue;
    const studentClasses = classesByStudent.get(row.student_id as string) ?? [];
    studentClasses.push(selectedClass);
    classesByStudent.set(row.student_id as string, studentClasses);
  }

  return Promise.all(students.map(async (student) => ({
    ...toRow(student, await getStudentStateData(student.id, supabase)),
    access: {
      direct: directStudentIds.has(student.id),
      classes: classesByStudent.get(student.id) ?? [],
      schoolScope: session.role === "school_admin",
    },
  })));
}

/** Resolve the current caller's grants for one already-RLS-visible student. */
export async function getTeacherStudentAccess(studentId: string): Promise<TeacherStudentRow["access"] | null> {
  const session = await requireRole(["teacher", "school_admin"]);
  const supabase = await createClient();
  const { data: student, error: studentError } = await supabase.from("students").select("id").eq("id", studentId).maybeSingle();
  if (studentError) throw new Error(studentError.message);
  if (!student) return null;

  const { data: classes, error: classError } = await supabase.from("classes").select("id, name, grade_level").order("name");
  if (classError) throw new Error(classError.message);
  const visibleClasses = (classes as ClassRecord[] | null) ?? [];
  const classById = new Map(visibleClasses.map((row) => [row.id, row]));
  const teacherClassResult = session.role === "teacher"
    ? await supabase.from("teacher_classes").select("class_id").eq("teacher_profile_id", session.id)
    : { data: visibleClasses.map((row) => ({ class_id: row.id })), error: null };
  if (teacherClassResult.error) throw new Error(teacherClassResult.error.message);
  const teacherClassIds = new Set((teacherClassResult.data ?? []).map((row) => row.class_id as string));
  const [enrollmentResult, directResult] = await Promise.all([
    teacherClassIds.size
      ? supabase.from("enrollments").select("class_id").eq("student_id", studentId).in("class_id", [...teacherClassIds]).eq("status", "active")
      : Promise.resolve({ data: [], error: null }),
    session.role === "teacher"
      ? supabase.from("teacher_students").select("student_id").eq("teacher_profile_id", session.id).eq("student_id", studentId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (enrollmentResult.error) throw new Error(enrollmentResult.error.message);
  if (directResult.error) throw new Error(directResult.error.message);
  return {
    direct: Boolean(directResult.data),
    classes: (enrollmentResult.data ?? []).flatMap((row) => {
      const selectedClass = classById.get(row.class_id as string);
      return selectedClass ? [selectedClass] : [];
    }),
    schoolScope: session.role === "school_admin",
  };
}
