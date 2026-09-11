import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SupabaseAssessmentStore } from "@/lib/diagnostic/granular/store";
import { recordPracticeMaterialDelivery } from "@/lib/diagnostic/granular/practice-material-delivery";
import { getCurrentStudentId } from "@/lib/db/student";
import { getNodePractice } from "@/lib/db/practice";
import { PracticePlayer } from "./practice-player";

export default async function PracticePage({ params }: { params: Promise<{ nodeId: string }> }) {
  await requireRole(["student"]); const { nodeId } = await params; const supabase = await createClient();
  const studentId = await getCurrentStudentId(supabase);
  const practice = await getNodePractice(nodeId, supabase, studentId);
  if (process.env.GRANULAR_DIAGNOSTIC_ENABLED === "true") {
    await recordPracticeMaterialDelivery(new SupabaseAssessmentStore(createServiceClient()), studentId, practice);
  }
  return <PracticePlayer practice={practice} />;
}
