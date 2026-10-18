import { authorizeJob, withJobRun } from "@/lib/jobs";
import { renderPendingDictationAudio } from "@/lib/dictation/audio";
import { renderPendingWordAudio } from "@/lib/vocabulary/session/audio";

/** Dictée audio, then the cached word audio for "hear and type" (roadmap 2026-10 D.3). */
export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const processed = await withJobRun("dictation_audio", async (db) => {
    const result = await renderPendingDictationAudio(db);
    const words = await renderPendingWordAudio(db).catch((error: unknown) => ({ error: error instanceof Error ? error.message : "unknown", rendered: 0 }));
    return { result: { ...result, words }, processed: result.rendered + words.rendered };
  });
  return Response.json({ ok: true, processed });
}
