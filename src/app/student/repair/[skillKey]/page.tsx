import {requireRole} from "@/lib/auth";
import {isSupabaseConfigured} from "@/lib/supabase/server";
import {repairDisplay} from "@/lib/diagnostic/granular/repair-display";
import { MICRO_LESSONS } from "@/lib/content/micro-lessons";
import { journalCurrentStudentPayload } from "@/lib/diagnostic/granular/server-delivery-journal";
import { RepairPlayer } from "./repair-player";

export default async function RepairPage({ params }: { params: Promise<{ skillKey: string }> }) {
  const owner = isSupabaseConfigured ? (await requireRole(["student"])).id : "local";
  const { skillKey } = await params;
  const lesson = Object.hasOwn(MICRO_LESSONS, skillKey) ? MICRO_LESSONS[skillKey] : null;
  // Record the whole delivered lesson, including answers available in client
  // props. This conservatively excludes reuse; it does not prove attention.
  await journalCurrentStudentPayload("legacy:repair", { lesson,display:repairDisplay(lesson) });
  return <RepairPlayer key={`${owner}:${skillKey}`} skillKey={skillKey} lesson={lesson} />;
}
