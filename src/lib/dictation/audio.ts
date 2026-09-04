import type { SupabaseClient } from "@supabase/supabase-js";
import { getAIProvider } from "@/lib/ai";

export const DICTATION_AUDIO_BUCKET = "dictation-audio";

type Segment = { text: string; audioPath: string | null };

/**
 * Renders server-side audio for approved dictées whose audio is pending or
 * failed (roadmap 1.2). One file per segment plus one for the whole text,
 * stored in the private bucket. Fails closed: without a speech backend the
 * dictée stays unpublished rather than falling back to browser synthesis.
 */
export async function renderPendingDictationAudio(db: SupabaseClient, options: { limit?: number } = {}) {
  const limit = options.limit ?? 5;
  const { data: rows, error } = await db.from("dictations")
    .select("id,key,segments,audio_status")
    .eq("review_status", "human_approved").in("audio_status", ["pending", "failed"])
    .order("updated_at", { ascending: true }).limit(limit);
  if (error) throw new Error(error.message);
  const provider = getAIProvider();
  await ensureBucket(db);
  let rendered = 0, failed = 0;
  for (const row of rows ?? []) {
    const id = row.id as string;
    const { data: claimed } = await db.from("dictations").update({ audio_status: "rendering", audio_error: null }).eq("id", id).in("audio_status", ["pending", "failed"]).select("id").maybeSingle();
    if (!claimed) continue;
    try {
      const segments = (row.segments as Segment[]).map((segment) => ({ ...segment }));
      let provenance: { provider: string; model: string; voice: string } | null = null;
      for (let index = 0; index < segments.length; index++) {
        const speech = await provider.synthesizeSpeech({ text: segments[index].text, speed: 0.85 });
        const path = `${row.key as string}/segment-${String(index).padStart(2, "0")}.mp3`;
        await upload(db, path, speech.audio, speech.mimeType);
        segments[index].audioPath = path;
        provenance = { provider: speech.provider, model: speech.model, voice: speech.voice };
      }
      const full = await provider.synthesizeSpeech({ text: segments.map((segment) => segment.text).join(" "), speed: 0.9 });
      const fullPath = `${row.key as string}/full.mp3`;
      await upload(db, fullPath, full.audio, full.mimeType);
      const { error: doneError } = await db.from("dictations").update({
        segments, audio_status: "ready", audio_rendered_at: new Date().toISOString(),
        audio_provider: provenance?.provider ?? full.provider, audio_model: provenance?.model ?? full.model, audio_voice: provenance?.voice ?? full.voice,
      }).eq("id", id);
      if (doneError) throw new Error(doneError.message);
      rendered++;
    } catch (caught) {
      failed++;
      await db.from("dictations").update({ audio_status: "failed", audio_error: caught instanceof Error ? caught.message.slice(0, 500) : "unknown" }).eq("id", id);
    }
  }
  return { rendered, failed, considered: rows?.length ?? 0 };
}

async function ensureBucket(db: SupabaseClient) {
  const { data } = await db.storage.getBucket(DICTATION_AUDIO_BUCKET);
  if (data) return;
  const { error } = await db.storage.createBucket(DICTATION_AUDIO_BUCKET, { public: false, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav"] });
  if (error && !/already exists/iu.test(error.message)) throw new Error(error.message);
}

async function upload(db: SupabaseClient, path: string, bytes: Uint8Array, contentType: string) {
  const { error } = await db.storage.from(DICTATION_AUDIO_BUCKET).upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`${path}: ${error.message}`);
}

/** Short-lived signed URLs for one dictée session. */
export async function signDictationAudio(db: SupabaseClient, paths: (string | null)[], expiresInSeconds = 60 * 45): Promise<(string | null)[]> {
  const real = paths.filter((path): path is string => !!path);
  if (real.length === 0) return paths.map(() => null);
  const { data, error } = await db.storage.from(DICTATION_AUDIO_BUCKET).createSignedUrls(real, expiresInSeconds);
  if (error) throw new Error(error.message);
  const byPath = new Map((data ?? []).map((entry) => [entry.path, entry.signedUrl]));
  return paths.map((path) => (path ? byPath.get(path) ?? null : null));
}
