import { speechConfigured } from "@/lib/ai";
import { authorizeJob, withJobRun } from "@/lib/jobs";
import { renderPendingDictationAudio } from "@/lib/dictation/audio";
import { renderPendingWordAudio } from "@/lib/vocabulary/session/audio";

/**
 * Dictée audio, then the cached word audio for "hear and type" (roadmap 2026-10 D.3).
 * Without a voice on this deployment the job does nothing: the audio is then
 * rendered by the GitHub Actions job with the Pocket TTS sidecar
 * (.github/workflows/dictation-audio.yml), and an unconfigured run here must
 * not mark dictées failed or spend the word-audio retries.
 */
export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!speechConfigured()) return Response.json({ ok: true, skipped: "no_speech_backend" });
  const processed = await withJobRun("dictation_audio", async (db) => {
    const result = await renderPendingDictationAudio(db);
    const words = await renderPendingWordAudio(db).catch((error: unknown) => ({ error: error instanceof Error ? error.message : "unknown", rendered: 0 }));
    return { result: { ...result, words }, processed: result.rendered + words.rendered };
  });
  return Response.json({ ok: true, processed });
}
