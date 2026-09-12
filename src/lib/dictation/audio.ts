import type { SupabaseClient } from "@supabase/supabase-js";
import { getAIProvider } from "@/lib/ai";
import { buildSpeechPlan, guardLiaisons, speakableFullText, speakableSegment } from "./speech-text";

import {buildDictationAudioManifest,describeDictationAudio,type DictationAudioAsset} from './audio-manifest';
import {storeImmutableDictationAudio} from './immutable-audio-storage';

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
    .select("id,key,segments,audio_status,updated_at")
    .eq("review_status", "human_approved").in("audio_status", ["pending", "failed"])
    .order("updated_at", { ascending: true }).limit(limit);
  if (error) throw new Error(error.message);
  const provider = getAIProvider();
  await ensureBucket(db);
  let rendered = 0, failed = 0;
  for (const row of rows ?? []) {
    const id = row.id as string;
    const { data: claimed } = await db.from("dictations").update({ audio_status: "rendering", audio_error: null }).eq("id", id).eq("updated_at", row.updated_at).in("audio_status", ["pending", "failed"]).select("id,updated_at").maybeSingle();
    if (!claimed) continue;
    try {
      const segments = (row.segments as Segment[]).map((segment) => ({ ...segment }));
      const assets:DictationAudioAsset[]=[];
      let provenance: { provider: string; model: string; voice: string } | null = null;
      for (let index = 0; index < segments.length; index++) {
        // "point final" only on the last segment: it tells the class the dictée is over.
        const plan = buildSpeechPlan(speakableSegment(segments[index].text, { final: index === segments.length - 1 }));
        const speech = await provider.synthesizeSpeechPlan(plan, { speed: 0.85 });
        const asset=describeDictationAudio({role:'segment',index,sourceText:segments[index].text,speechPlan:plan,speed:0.85,speech});
        await storeImmutableDictationAudio(db,asset,speech.audio);
        assets.push(asset);
        segments[index].audioPath = asset.path;
        provenance = { provider: speech.provider, model: speech.model, voice: speech.voice };
      }
      const fullSource=speakableFullText(segments.map(segment=>segment.text));
      const fullSpeech=guardLiaisons(fullSource);
      const full = await provider.synthesizeSpeech({ text: fullSpeech, speed: 0.9 });
      const fullAsset=describeDictationAudio({role:'full',index:0,sourceText:fullSource,speechPlan:[{kind:'text',text:fullSpeech}],speed:0.9,speech:full});
      await storeImmutableDictationAudio(db,fullAsset,full.audio);
      assets.push(fullAsset);
      const manifest=buildDictationAudioManifest(id,assets,segments.map(segment=>segment.text));
      const { data: done, error: doneError } = await db.from("dictations").update({
        segments, audio_manifest:manifest, audio_status: "ready", audio_rendered_at: new Date().toISOString(),
        audio_provider: provenance?.provider ?? full.provider, audio_model: provenance?.model ?? full.model, audio_voice: provenance?.voice ?? full.voice,
      }).eq("id", id).eq("updated_at", claimed.updated_at).eq("audio_status", "rendering").select("id").maybeSingle();
      if (doneError || !done) throw new Error(doneError?.message ?? 'Dictation changed while audio was rendering');
      rendered++;
    } catch (caught) {
      failed++;
      await db.from("dictations").update({ audio_status: "failed", audio_error: caught instanceof Error ? caught.message.slice(0, 500) : "unknown" }).eq("id", id).eq("updated_at", claimed.updated_at).eq("audio_status", "rendering");
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

/** Short-lived signed URLs for one dictée session. */
export async function signDictationAudio(db: SupabaseClient, paths: (string | null)[], expiresInSeconds = 60 * 45): Promise<(string | null)[]> {
  const real = paths.filter((path): path is string => !!path);
  if (real.length === 0) return paths.map(() => null);
  const { data, error } = await db.storage.from(DICTATION_AUDIO_BUCKET).createSignedUrls(real, expiresInSeconds);
  if (error) throw new Error(error.message);
  const byPath = new Map((data ?? []).map((entry) => [entry.path, entry.signedUrl]));
  return paths.map((path) => (path ? byPath.get(path) ?? null : null));
}
