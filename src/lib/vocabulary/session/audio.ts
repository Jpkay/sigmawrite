import "server-only";
/**
 * Cached TTS per word for "hear and type" (roadmap 2026-10 D.3). Reuses the
 * dictée audio pipeline: the provider renders speech, the bytes go to the
 * private dictation-audio bucket at a content-addressed immutable path, and
 * sessions get short-lived signed URLs. Fails closed: a word without ready
 * audio is never offered as "hear and type".
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAIProvider } from "@/lib/ai";
import { describeDictationAudio } from "@/lib/dictation/audio-manifest";
import { ensureBucket, signDictationAudio } from "@/lib/dictation/audio";
import { storeImmutableDictationAudio } from "@/lib/dictation/immutable-audio-storage";
import { containsLoosely } from "./sentences";

export const WORD_AUDIO_SPEED = 0.85;

/** "intrépide. Le pompier intrépide entre dans la maison. intrépide." — the sentence disambiguates homophones. */
export function spokenWordText(word: string, example: string | null): string {
  const clean = word.trim();
  const sentence = example?.trim();
  if (sentence && sentence.length <= 160 && containsLoosely(sentence, clean)) {
    return `${clean}. ${/[.!?…]$/u.test(sentence) ? sentence : `${sentence}.`} ${clean}.`;
  }
  return `${clean}.`;
}

/** Adds a pending row for every lemma a student has word cards for and that has no audio yet. */
export async function queueWordAudio(db: SupabaseClient, limit = 200): Promise<number> {
  const { data: cards, error } = await db.from("learning_retrieval_schedules").select("target_id").eq("target_type", "lexical_sense").neq("status", "retired").order("created_at", { ascending: false }).limit(2000);
  if (error) throw new Error(error.message);
  const senseIds = [...new Set((cards ?? []).map((row) => row.target_id as string))];
  if (!senseIds.length) return 0;
  const { data: senses, error: senseError } = await db.from("lexical_senses").select("lemma_id,lexical_lemmas!inner(id,lemma,vocabulary_item_id)").in("id", senseIds.slice(0, 1000));
  if (senseError) throw new Error(senseError.message);
  const lemmas = new Map<string, { lemma: string; itemId: string | null }>();
  for (const row of senses ?? []) {
    const lemma = row.lexical_lemmas as unknown as { id: string; lemma: string; vocabulary_item_id: string | null };
    lemmas.set(lemma.id, { lemma: lemma.lemma, itemId: lemma.vocabulary_item_id });
  }
  if (!lemmas.size) return 0;
  const { data: existing, error: existingError } = await db.from("lexical_word_audio").select("lemma_id").in("lemma_id", [...lemmas.keys()]);
  if (existingError) throw new Error(existingError.message);
  const have = new Set((existing ?? []).map((row) => row.lemma_id as string));
  const missing = [...lemmas.entries()].filter(([id]) => !have.has(id)).slice(0, limit);
  if (!missing.length) return 0;
  const itemIds = missing.flatMap(([, value]) => (value.itemId ? [value.itemId] : []));
  const { data: items } = itemIds.length ? await db.from("vocabulary_items").select("id,example_fr").in("id", itemIds) : { data: [] };
  const exampleByItem = new Map((items ?? []).map((row) => [row.id as string, (row.example_fr as string | null) ?? null]));
  const rows = missing.map(([lemmaId, value]) => ({ lemma_id: lemmaId, spoken_text: spokenWordText(value.lemma, value.itemId ? exampleByItem.get(value.itemId) ?? null : null).slice(0, 400), status: "pending" }));
  const { error: insertError } = await db.from("lexical_word_audio").upsert(rows, { onConflict: "lemma_id", ignoreDuplicates: true });
  if (insertError) throw new Error(insertError.message);
  return rows.length;
}

/** Renders pending word audio. Without a speech backend every row stays pending (no crash, no browser fallback). */
export async function renderPendingWordAudio(db: SupabaseClient, options: { limit?: number } = {}) {
  const queued = await queueWordAudio(db);
  const { data: rows, error } = await db.from("lexical_word_audio").select("lemma_id,spoken_text,updated_at,attempts").in("status", ["pending", "failed"]).lt("attempts", 3).order("updated_at", { ascending: true }).limit(options.limit ?? 25);
  if (error) throw new Error(error.message);
  if (!rows?.length) return { queued, rendered: 0, failed: 0, considered: 0 };
  const provider = getAIProvider();
  await ensureBucket(db);
  let rendered = 0, failed = 0;
  for (const row of rows) {
    const lemmaId = row.lemma_id as string;
    const { data: claimed } = await db.from("lexical_word_audio").update({ status: "rendering", error: null, attempts: Number(row.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("lemma_id", lemmaId).eq("updated_at", row.updated_at).in("status", ["pending", "failed"]).select("lemma_id,updated_at").maybeSingle();
    if (!claimed) continue;
    try {
      const text = row.spoken_text as string;
      const speech = await provider.synthesizeSpeech({ text, speed: WORD_AUDIO_SPEED });
      const asset = describeDictationAudio({ role: "segment", index: 0, sourceText: text, speechPlan: [{ kind: "text", text }], speed: WORD_AUDIO_SPEED, speech });
      await storeImmutableDictationAudio(db, asset, speech.audio);
      const { error: doneError } = await db.from("lexical_word_audio").update({
        status: "ready", audio_path: asset.path, byte_checksum: asset.byteChecksum, byte_length: asset.byteLength, mime_type: asset.mimeType,
        provider: asset.provider, model: asset.model, voice: asset.voice, rendered_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq("lemma_id", lemmaId).eq("status", "rendering");
      if (doneError) throw new Error(doneError.message);
      rendered++;
    } catch (caught) {
      failed++;
      await db.from("lexical_word_audio").update({ status: "failed", error: caught instanceof Error ? caught.message.slice(0, 500) : "unknown", updated_at: new Date().toISOString() }).eq("lemma_id", lemmaId).eq("status", "rendering");
    }
  }
  return { queued, rendered, failed, considered: rows.length };
}

/** Signed URLs for the lemmas that have ready audio. Errors → no audio (the session falls back). */
export async function signWordAudio(db: SupabaseClient, lemmaIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const ids = [...new Set(lemmaIds)];
  if (!ids.length) return out;
  try {
    const { data, error } = await db.from("lexical_word_audio").select("lemma_id,audio_path").in("lemma_id", ids).eq("status", "ready");
    if (error || !data?.length) return out;
    const urls = await signDictationAudio(db, data.map((row) => row.audio_path as string), 60 * 60);
    data.forEach((row, index) => { if (urls[index]) out.set(row.lemma_id as string, urls[index]!); });
  } catch {
    return new Map();
  }
  return out;
}
