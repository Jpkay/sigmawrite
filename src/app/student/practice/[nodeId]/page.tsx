import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getNodePractice } from "@/lib/db/practice";
import { PracticePlayer } from "./practice-player";

export default async function PracticePage({ params }: { params: Promise<{ nodeId: string }> }) {
  await requireRole(["student"]); const { nodeId } = await params; const practice = await getNodePractice(nodeId, await createClient());
  return <><PageHeader title={practice.node.label} description={practice.node.description ?? "Une courte série pour renforcer cette base."} /><PracticePlayer practice={practice} /></>;
}
