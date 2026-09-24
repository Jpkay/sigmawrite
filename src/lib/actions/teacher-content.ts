"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const feedbackInput = z.object({
  kind: z.enum(["lesson", "passage", "exercise", "granular_lesson", "granular_exercise"]),
  id: z.union([z.string().uuid(), z.literal("")]),
  releaseId: z.union([z.string().uuid(), z.literal("")]),
  contentKey: z.string().max(500),
  comment: z.string().trim().min(3).max(2000),
}).refine((input) => input.kind.startsWith("granular_")
  ? input.id === "" && input.releaseId !== "" && input.contentKey.length > 0
  : input.id !== "" && input.releaseId === "" && input.contentKey === "");

export async function submitTeacherContentFeedback(formData: FormData) {
  const teacher = await requireRole(["teacher"]);
  const input = feedbackInput.parse({
    kind: formData.get("kind"), id: formData.get("id"),
    releaseId: formData.get("releaseId"), contentKey: formData.get("contentKey"),
    comment: formData.get("comment"),
  });
  const { error } = await (await createClient()).from("teacher_content_feedback").insert({
    teacher_profile_id: teacher.id,
    content_kind: input.kind,
    content_id: input.id || null,
    release_id: input.releaseId || null,
    content_key: input.contentKey || null,
    comment: input.comment,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/teacher/content");
  const tab = input.kind === "granular_lesson" ? "lesson" : input.kind === "granular_exercise" ? "exercise" : input.kind;
  redirect(`/teacher/content?kind=${tab}&sent=1`);
}
