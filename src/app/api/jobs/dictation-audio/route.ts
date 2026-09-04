import { authorizeJob, withJobRun } from "@/lib/jobs";
import { renderPendingDictationAudio } from "@/lib/dictation/audio";

export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const processed = await withJobRun("dictation_audio", async (db) => { const result = await renderPendingDictationAudio(db); return { result, processed: result.rendered }; });
  return Response.json({ ok: true, processed });
}
