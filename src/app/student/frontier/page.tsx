import { PageHeader } from "@/components/page";
import { FrontierReportView } from "@/components/frontier-report";
import { StudentCompetencyGraph } from "@/components/student-competency-graph";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCurrentStudentId } from "@/lib/db/student";
import { frontierForStudent } from "@/lib/diagnostic/live";

export default async function StudentFrontierPage() {
  await requireRole(["student"]); const supabase = await createClient(); const studentId = await getCurrentStudentId(supabase);
  const { data: latestRun } = await supabase.from("diagnostic_runs")
    .select("is_pilot")
    .eq("student_id", studentId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  // Unpublished pilot taxonomy memberships are intentionally hidden by RLS.
  // The authenticated student id still scopes every service-side graph query.
  const graphDb = latestRun?.is_pilot ? createServiceClient() : supabase;
  const data = await frontierForStudent(studentId, graphDb);
  return <>
    <PageHeader title="Ma frontière d’apprentissage" description="Ouvre une compétence pour comprendre les bases nécessaires, les preuves observées et la prochaine étape accessible." />
    <StudentCompetencyGraph graph={data.graphView} />
    <section aria-labelledby="frontier-details-title" className="mt-10">
      <div className="mb-5 max-w-2xl">
        <h2 id="frontier-details-title" className="text-xl font-semibold">Détail des preuves</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Retrouve chaque compétence par état et ouvre-la pour examiner les preuves de reconnaissance et de production.</p>
      </div>
      <FrontierReportView data={data} />
    </section>
  </>;
}
