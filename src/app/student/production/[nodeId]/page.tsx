import { requireRole } from "@/lib/auth";
import { loadIndependentProductionTask } from "@/lib/actions/student";
import { IndependentProductionPlayer } from "./production-player";

export default async function IndependentProductionPage({ params }: { params: Promise<{ nodeId: string }> }) {
  await requireRole(["student"]);
  const { nodeId } = await params;
  const task = await loadIndependentProductionTask({ nodeId });
  return <IndependentProductionPlayer task={task} />;
}
