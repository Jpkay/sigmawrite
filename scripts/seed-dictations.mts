import { readFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { dictationTagsSchema } from "@/lib/dictation/tags";

/**
 * Imports authored dictée texts (generated/dictations-v1.json) as
 * needs_human_review, with their G.1 tags. Publication is automatic:
 * `npm run dictations:auto-approve` runs the gates and marks passing texts
 * auto_approved; /admin/dictations stays for audit and takedown. Re-running
 * updates text and segments for unpublished rows only, so published content
 * never changes silently. Tags are refreshed on every row (they never change
 * the text a student hears).
 */
loadEnv({ path: ".env.local", quiet: true });
const path = process.argv[2] ?? "generated/dictations-v1.json";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment required");
const db = createClient(url, key, { auth: { persistSession: false } });

type Authored = {
  key: string; title_fr: string; kind: string; grade_min: number; grade_max: number; focus_fr?: string; source_note?: string; target_node_keys: string[]; segments: string[];
  themes?: string[]; interests?: string[]; tenses?: string[]; target_lemmas?: string[]; grammar_node_keys?: string[]; cefr_band?: string | null;
};
const file = JSON.parse(readFileSync(path, "utf8")) as { dictations: Authored[] };

const { data: existing, error: existingError } = await db.from("dictations").select("key,review_status");
if (existingError) throw new Error(existingError.message);
const statusByKey = new Map((existing ?? []).map((row) => [row.key as string, row.review_status as string]));

let inserted = 0, updated = 0, retagged = 0;
for (const entry of file.dictations) {
  const tags = dictationTagsSchema.parse({
    themes: entry.themes ?? [], interests: entry.interests ?? [], tenses: entry.tenses ?? [], target_lemmas: entry.target_lemmas ?? [],
    grammar_node_keys: entry.grammar_node_keys ?? [], cefr_band: entry.cefr_band ?? null,
  });
  const text = entry.segments.join(" ");
  const wordCount = text.split(/\s+/u).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
  const row = {
    key: entry.key, title_fr: entry.title_fr, kind: entry.kind, text_fr: text,
    segments: entry.segments.map((segment) => ({ text: segment, audioPath: null })),
    word_count: wordCount, grade_min: entry.grade_min, grade_max: entry.grade_max,
    target_node_keys: entry.target_node_keys, focus_fr: entry.focus_fr ?? null, source_note: entry.source_note ?? null,
    ...tags,
  };
  const status = statusByKey.get(entry.key);
  if (!status) {
    const { error } = await db.from("dictations").insert(row); if (error) throw new Error(`${entry.key}: ${error.message}`); inserted++;
  } else if (status === "needs_human_review" || status === "rejected") {
    const { error } = await db.from("dictations").update({ ...row, audio_status: "pending" }).eq("key", entry.key); if (error) throw new Error(`${entry.key}: ${error.message}`); updated++;
  } else {
    const { error } = await db.from("dictations").update(tags).eq("key", entry.key); if (error) throw new Error(`${entry.key}: ${error.message}`); retagged++;
  }
}
console.log(JSON.stringify({ inserted, updated, retagged, total: file.dictations.length }));
