import { readFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

/**
 * Imports authored dictée texts (generated/dictations-v1.json) as
 * needs_human_review. Approval happens in /admin/dictations; audio is
 * rendered by the dictation-audio job. Re-running updates text and segments
 * for unapproved rows only, so approved content never changes silently.
 */
loadEnv({ path: ".env.local", quiet: true });
const path = process.argv[2] ?? "generated/dictations-v1.json";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment required");
const db = createClient(url, key, { auth: { persistSession: false } });

type Authored = { key: string; title_fr: string; kind: string; grade_min: number; grade_max: number; focus_fr?: string; source_note?: string; target_node_keys: string[]; segments: string[] };
const file = JSON.parse(readFileSync(path, "utf8")) as { dictations: Authored[] };

const { data: existing, error: existingError } = await db.from("dictations").select("key,review_status");
if (existingError) throw new Error(existingError.message);
const statusByKey = new Map((existing ?? []).map((row) => [row.key as string, row.review_status as string]));

let inserted = 0, updated = 0, skipped = 0;
for (const entry of file.dictations) {
  const text = entry.segments.join(" ");
  const wordCount = text.split(/\s+/u).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
  const row = {
    key: entry.key, title_fr: entry.title_fr, kind: entry.kind, text_fr: text,
    segments: entry.segments.map((segment) => ({ text: segment, audioPath: null })),
    word_count: wordCount, grade_min: entry.grade_min, grade_max: entry.grade_max,
    target_node_keys: entry.target_node_keys, focus_fr: entry.focus_fr ?? null, source_note: entry.source_note ?? null,
  };
  const status = statusByKey.get(entry.key);
  if (!status) {
    const { error } = await db.from("dictations").insert(row); if (error) throw new Error(`${entry.key}: ${error.message}`); inserted++;
  } else if (status === "needs_human_review") {
    const { error } = await db.from("dictations").update({ ...row, audio_status: "pending" }).eq("key", entry.key); if (error) throw new Error(`${entry.key}: ${error.message}`); updated++;
  } else skipped++;
}
console.log(JSON.stringify({ inserted, updated, skipped, total: file.dictations.length }));
