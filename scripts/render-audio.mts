/**
 * Renders pending dictée audio and cached word audio with the configured voice
 * (roadmap 2026-10 D.3). Run by .github/workflows/dictation-audio.yml next to
 * the Pocket TTS sidecar; the same functions the Vercel job calls, so claims,
 * immutable storage and manifests are identical.
 *
 *   TTS_BASE_URL=http://127.0.0.1:8880/v1 TTS_API_KEY=local TTS_MODEL=pocket-tts TTS_VOICE=estelle \
 *   node --conditions=react-server --env-file=<private env> --import tsx scripts/render-audio.mts [--rounds 4]
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { speechConfigured } from "../src/lib/ai";
import { renderPendingDictationAudio } from "../src/lib/dictation/audio";
import { renderPendingWordAudio } from "../src/lib/vocabulary/session/audio";

const arg = (name: string, fallback: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const rounds = Math.max(1, Number(arg("rounds", "4")));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
if (!speechConfigured()) throw new Error("No speech backend: set TTS_BASE_URL and TTS_API_KEY");

const db = createClient(url, key, { auth: { persistSession: false } });
// Same lease and history as the Vercel job (withJobRun), so two renderers never overlap.
const { data: runId, error: claimError } = await db.rpc("claim_job_run", { p_job_name: "dictation_audio", p_lease_minutes: 300 });
if (claimError || !runId) {
  if (claimError?.code === "55000") { console.log("dictation_audio already running; nothing to do"); process.exit(0); }
  throw new Error(claimError?.message ?? "Job run not created");
}
// A run killed mid-render (timeout, cancelled runner) leaves rows in "rendering", which no renderer picks up.
const stale = new Date(Date.now() - 6 * 3600_000).toISOString();
await db.from("dictations").update({ audio_status: "failed", audio_error: "render interrupted" }).eq("audio_status", "rendering").lt("updated_at", stale);
await db.from("lexical_word_audio").update({ status: "failed", error: "render interrupted", updated_at: new Date().toISOString() }).eq("status", "rendering").lt("updated_at", stale);
const totals = { dictations: { rendered: 0, failed: 0 }, words: { rendered: 0, failed: 0, queued: 0 } };
try {
  for (let round = 0; round < rounds; round += 1) {
    const dictations = await renderPendingDictationAudio(db, { limit: 5 });
    const words = await renderPendingWordAudio(db, { limit: 25 });
    totals.dictations.rendered += dictations.rendered; totals.dictations.failed += dictations.failed;
    totals.words.rendered += words.rendered; totals.words.failed += words.failed; totals.words.queued += words.queued;
    console.log(JSON.stringify({ round, dictations, words }));
    if (dictations.considered === 0 && words.considered === 0) break;
  }
  await db.from("job_runs").update({ status: "completed", finished_at: new Date().toISOString(), processed_count: totals.dictations.rendered + totals.words.rendered }).eq("id", runId);
} catch (cause) {
  await db.from("job_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: cause instanceof Error ? cause.message : "Unknown error" }).eq("id", runId);
  throw cause;
}
console.log(JSON.stringify({ totals }));
if (totals.dictations.failed && !totals.dictations.rendered) process.exitCode = 1;
