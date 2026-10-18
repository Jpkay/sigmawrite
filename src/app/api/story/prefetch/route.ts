import { z } from "zod";
import { getSessionProfile } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCurrentStudentId } from "@/lib/db/student";
import { generatePending, prefetchBranches } from "@/lib/content/editorial/story-service";
import { storyDeps } from "@/lib/content/editorial/runtime";

export const maxDuration = 300;

/**
 * H.11 prefetch: POST { sagaId, chapterId } while the student reads chapter N.
 * Generates chapter N+1 for both choices (and any pending slot). The player
 * can fire and forget; getChapter also schedules this in after().
 */
export async function POST(request: Request) {
  const session = await getSessionProfile();
  if (!session || session.role !== "student") return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ sagaId: z.string().uuid(), chapterId: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
  const studentId = await getCurrentStudentId(await createClient());
  const service = createServiceClient();
  const { data: saga } = await service.from("story_sagas").select("id").eq("id", parsed.data.sagaId).eq("student_id", studentId).maybeSingle();
  if (!saga) return Response.json({ error: "not_found" }, { status: 404 });
  const deps = storyDeps(service);
  await Promise.allSettled([prefetchBranches(deps, parsed.data.sagaId, parsed.data.chapterId), generatePending(deps, parsed.data.sagaId)]);
  return Response.json({ ok: true });
}
