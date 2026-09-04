import { requireRole } from "@/lib/auth";
import { DictationPlayer } from "./dictation-player";

export default async function Page({ params }: { params: Promise<{ dictationId: string }> }) {
  await requireRole(["student"]);
  const { dictationId } = await params;
  return <DictationPlayer dictationId={dictationId} />;
}
