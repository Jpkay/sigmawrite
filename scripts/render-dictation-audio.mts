import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { renderPendingDictationAudio } from "@/lib/dictation/audio";

/**
 * Renders pending dictée audio from any machine that can reach a speech
 * backend (for example a local Kokoro-FastAPI container) and the target
 * Supabase project. Same code path as the hourly job; useful when the hosted
 * runtime has no TTS credentials. Only human-approved texts are rendered.
 *
 *   docker run -d --name plume-kokoro -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
 *   TTS_BASE_URL=http://127.0.0.1:8880/v1 TTS_API_KEY=local TTS_MODEL=kokoro TTS_VOICE=ff_siwis \
 *   npm run dictations:render-audio
 */
loadEnv({ path: ".env.local", quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment required");
if (!process.env.TTS_API_KEY) throw new Error("TTS_API_KEY (and TTS_BASE_URL for a self-hosted backend) required");
const db = createClient(url, key, { auth: { persistSession: false } });
const result = await renderPendingDictationAudio(db, { limit: Number(process.argv[2] ?? 20) });
console.log(JSON.stringify(result));
if (result.failed > 0) {
  const { data } = await db.from("dictations").select("key,audio_error").eq("audio_status", "failed");
  console.error(JSON.stringify(data));
  process.exit(1);
}
