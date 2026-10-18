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

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

// Sends the teacher back to the same page and item, where the confirmation is shown.
function feedbackReturnPath(tab: string, rowId: FormDataEntryValue | null, page: FormDataEntryValue | null) {
  const params = new URLSearchParams({ kind: tab, sent: "1" });
  const pageNumber = typeof page === "string" ? Number.parseInt(page, 10) : 1;
  if (Number.isSafeInteger(pageNumber) && pageNumber > 1) params.set("page", String(pageNumber));
  const safeRowId = typeof rowId === "string" && /^[A-Za-z0-9:_.-]{1,200}$/.test(rowId) ? rowId : null;
  if (safeRowId) params.set("sentId", safeRowId);
  return `/teacher/content?${params.toString()}${safeRowId ? `#content-${safeRowId}` : ""}`;
}

export async function submitTeacherContentFeedback(formData: FormData) {
  const teacher = await requireRole(["teacher"]);
  const input = feedbackInput.parse({
    kind: formData.get("kind"), id: formData.get("id"),
    releaseId: formData.get("releaseId"), contentKey: formData.get("contentKey"),
    comment: formData.get("comment"),
  });
  const supabase = await createClient();
  // A teacher who clicks "send" twice must not create duplicate observations.
  let duplicate = supabase.from("teacher_content_feedback").select("id").eq("teacher_profile_id", teacher.id)
    .eq("content_kind", input.kind).eq("comment", input.comment)
    .gte("created_at", new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString()).limit(1);
  duplicate = input.id ? duplicate.eq("content_id", input.id) : duplicate.eq("release_id", input.releaseId).eq("content_key", input.contentKey);
  const { data: existing } = await duplicate;
  const { error } = existing?.length ? { error: null } : await supabase.from("teacher_content_feedback").insert({
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
  redirect(feedbackReturnPath(tab, formData.get("rowId"), formData.get("page")));
}
