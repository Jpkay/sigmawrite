import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudentId } from "@/lib/db/student";
import { getNodePractice } from "@/lib/db/practice";
import { PracticePlayer } from "./practice-player";

export default async function PracticePage({ params }: { params: Promise<{ nodeId: string }> }) {
  await requireRole(["student"]); const { nodeId } = await params; const supabase = await createClient();
  const studentId = await getCurrentStudentId(supabase);
  const practice = await getNodePractice(nodeId, supabase, studentId);
  return <><PageHeader title={practice.node.label} description={practice.node.description ?? "Une courte série pour renforcer cette base."} /><PracticePlayer practice={practice} /></>;
}
