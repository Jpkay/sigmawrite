import { createClient } from "@/lib/supabase/server";

/** Reading assignments (PRD §N). RLS scopes reads to teacher/enrolled/staff. */
export type Assignment = {
  id: string;
  class_id: string;
  text_slug: string | null;
  target_type: "text" | "competency_node" | "catch_up_step" | "dictation";
  target_node_id: string | null;
  target_dictation_id?: string | null;
  title: string;
  instructions: string | null;
  due_at: string | null;
  created_at: string;
};

const COLS = "id, class_id, text_slug, target_type, target_node_id, target_dictation_id, title, instructions, due_at, created_at";

export async function getTeacherAssignments(): Promise<Assignment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select(COLS)
    .order("created_at", { ascending: false });
  return (data as Assignment[] | null) ?? [];
}

export async function getStudentAssignments(): Promise<Assignment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select(COLS)
    .order("due_at", { ascending: true, nullsFirst: false });
  return (data as Assignment[] | null) ?? [];
}
