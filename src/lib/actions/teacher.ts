"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

/** Teacher server actions (PRD §23). Auth+role verified before any work. */

const notImplemented = (name: string) => {
  throw new Error(`${name}: not implemented`);
};

export async function createClass() {
  await requireRole(["teacher", "school_admin"]);
  return notImplemented("createClass");
}

export async function inviteStudents() {
  await requireRole(["teacher", "school_admin"]);
  return notImplemented("inviteStudents");
}

/** Assigns a reading to a class (PRD §N). RLS enforces the teacher owns the class. */
export async function createAssignment(input: {
  classId: string;
  textSlug: string;
  title: string;
  instructions?: string;
  dueAt?: string;
}) {
  const session = await requireRole(["teacher"]);
  const supabase = await createClient();
  const { error } = await supabase.from("assignments").insert({
    class_id: input.classId,
    teacher_profile_id: session.id,
    text_slug: input.textSlug,
    title: input.title,
    instructions: input.instructions || null,
    due_at: input.dueAt || null,
  });
  if (error) throw new Error(error.message);
  await logAudit("assignment_created", {
    targetType: "class",
    targetId: input.classId,
    metadata: { textSlug: input.textSlug },
  });
  revalidatePath("/teacher/assignments");
  return { ok: true };
}

export async function deleteAssignment(id: string) {
  await requireRole(["teacher"]);
  const supabase = await createClient();
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/teacher/assignments");
  return { ok: true };
}

export async function viewClassProgress() {
  await requireRole(["teacher", "school_admin"]);
  return notImplemented("viewClassProgress");
}

export async function createInterventionGroup() {
  await requireRole(["teacher"]);
  return notImplemented("createInterventionGroup");
}

export async function exportClassReport() {
  await requireRole(["teacher", "school_admin"]);
  return notImplemented("exportClassReport");
}
