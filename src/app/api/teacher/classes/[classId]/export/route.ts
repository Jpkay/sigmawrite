import { getSessionProfile } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getClassStudents } from "@/lib/db/dashboard";
import { classSummary, skillGaps } from "@/lib/reports";
import { trackServer } from "@/lib/analytics-server";
import { spreadsheetSafeCsvCell as csv } from "@/lib/csv";

export async function GET(_request: Request, { params }: { params: Promise<{ classId: string }> }) {
  const session = await getSessionProfile(); if (!session || !["teacher","school_admin"].includes(session.role)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { classId } = await params; const supabase = await createClient(); const { data: owned } = await supabase.from("classes").select("id,name").eq("id", classId).maybeSingle(); if (!owned) return Response.json({ error: "not found" }, { status: 404 });
  const students = await getClassStudents(classId); const summary = classSummary(students, Date.now()); const lines = [["Élève","Bande","Réussite moyenne","Textes cette semaine","Lacunes"]];
  for (const row of summary) { const source = students.find((student) => student.id === row.id)!; lines.push([row.name,row.band,row.avgSuccess == null ? "" : Math.round(row.avgSuccess*100)+"%",String(row.textsThisWeek),skillGaps(source.snap).join("; ")]); }
  const reportPayload = { className: owned.name, generatedAt: new Date().toISOString(), students: summary };
  const { error: reportError } = await createServiceClient().from("teacher_reports").insert({ class_id: classId, report_period_start: new Date(Date.now()-7*86_400_000).toISOString().slice(0,10), report_period_end: new Date().toISOString().slice(0,10), report_payload: reportPayload });
  if (reportError) return Response.json({ error: "report_not_recorded" }, { status: 500 });
  await trackServer(session.id,"class_export_downloaded",{class_id:classId,student_count:students.length});
  const body = "\uFEFF" + lines.map((line) => line.map(csv).join(",")).join("\n");
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="classe-${classId}.csv"` } });
}
