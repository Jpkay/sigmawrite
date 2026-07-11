import { PageHeader } from "@/components/page";
import { FrontierReportView } from "@/components/frontier-report";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentId } from "@/lib/db/student";
import { frontierForStudent } from "@/lib/diagnostic/live";

export default async function StudentFrontierPage() {
  await requireRole(["student"]); const supabase = await createClient(); const studentId = await getCurrentStudentId(supabase);
  const data = await frontierForStudent(studentId, supabase);
  return <><PageHeader title="Ma frontière d’apprentissage" description="Une carte évolutive fondée sur tes réponses, jamais une étiquette définitive." /><FrontierReportView data={data} /></>;
}
