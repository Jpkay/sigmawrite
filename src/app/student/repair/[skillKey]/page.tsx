import { MICRO_LESSONS } from "@/lib/content/micro-lessons";
import { journalCurrentStudentPayload } from "@/lib/diagnostic/granular/server-delivery-journal";
import { RepairPlayer } from "./repair-player";

export default async function RepairPage({ params }: { params: Promise<{ skillKey: string }> }) {
  const { skillKey } = await params;
  const lesson = Object.hasOwn(MICRO_LESSONS, skillKey) ? MICRO_LESSONS[skillKey] : null;
  // Record the whole delivered lesson, including answers available in client
  // props. This conservatively excludes reuse; it does not prove attention.
  await journalCurrentStudentPayload("legacy:repair", { lesson });
  return <RepairPlayer key={skillKey} skillKey={skillKey} lesson={lesson} />;
}
