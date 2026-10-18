import "server-only";
import { cache } from "react";
import { getCurrentStudentId } from "@/lib/db/student";
import { captureError } from "@/lib/observability";
import { createClient, createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { loadStoryHomeCard, storyAvailability, type StoryHomeCard } from "./server";

/**
 * Navigation guard for story mode: shown only when it can really be served
 * (live generation on, or fallback chapters for the student's interests).
 * Any failure hides the entry instead of breaking the shell.
 */
export const storyVisibleForCurrentStudent = cache(async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const studentId = await getCurrentStudentId(await createClient());
    return (await storyAvailability(createServiceClient(), studentId)).visible;
  } catch (error) {
    captureError(error, { component: "story-ui", step: "nav-visibility" });
    return false;
  }
});

/** Home card data (H.5), or null when story mode is not available or loading fails. */
export async function storyHomeCardFor(studentId: string): Promise<StoryHomeCard> {
  try {
    return await loadStoryHomeCard(createServiceClient(), studentId);
  } catch (error) {
    captureError(error, { component: "story-ui", step: "home-card" });
    return null;
  }
}
