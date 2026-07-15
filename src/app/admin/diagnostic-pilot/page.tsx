import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DiagnosticPilotManager } from "./pilot-manager";

export default async function DiagnosticPilotPage() {
  await requireRole(["platform_admin"]);
  const db = await createClient();
  const [{ data: setting, error: settingError }, { data: students, error: studentError }, { data: enrollments, error: enrollmentError }] = await Promise.all([
    db.from("diagnostic_pilot_settings").select("enabled,updated_at").eq("singleton", true).maybeSingle(),
    db.from("students").select("id,display_name,current_grade").order("display_name").limit(250),
    db.from("diagnostic_pilot_enrollments").select("id,student_id,active,expires_at,note,created_at,students(display_name,current_grade)").eq("active", true).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(100),
  ]);
  if (settingError || studentError || enrollmentError) {
    throw new Error(settingError?.message ?? studentError?.message ?? enrollmentError?.message);
  }
  return <><PageHeader title="Essais du diagnostic" description="Accès temporaire au diagnostic v2 non publié pour des comptes de test isolés." /><DiagnosticPilotManager enabled={Boolean(setting?.enabled)} students={(students ?? []).map((student) => ({ id: student.id as string, name: student.display_name as string, grade: Number(student.current_grade) }))} enrollments={(enrollments ?? []).map((row) => { const student = row.students as unknown as { display_name: string; current_grade: number } | null; return { id: row.id as string, studentId: row.student_id as string, studentName: student?.display_name ?? "Élève", grade: Number(student?.current_grade ?? 0), active: Boolean(row.active), expiresAt: row.expires_at as string, note: row.note as string | null }; })} /></>;
}
