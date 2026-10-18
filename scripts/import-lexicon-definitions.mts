/**
 * Idempotent import of the automatic word definitions
 * (generated/lexicon-definitions-v1.json + shards) into lexical_senses,
 * vocabulary_items and lexical_relationships.
 *
 *   npm run lexicon:import-definitions -- [manifest path] [--dry-run]
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Requires the
 * lexical release to be imported first (npm run lexicon:import). Senses are
 * `auto_approved` with the pipeline version and gate results; a definition
 * written by a person is never overwritten (see import-mapping.ts).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { checksum } from "../src/lib/taxonomy/validate";
import { planDefinitionImport, type DbLemma, type DbSense, type DbVocabularyItem } from "../src/lib/lexicon/definitions/import-mapping";
import type { LexiconDefinitionEntry, LexiconDefinitionsManifest } from "../src/lib/lexicon/definitions/types";

loadEnv({ path: ".env.local", quiet: true });
const dryRun = process.argv.includes("--dry-run");
const manifestPath = resolve(process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "generated/lexicon-definitions-v1.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as LexiconDefinitionsManifest;
const entries: LexiconDefinitionEntry[] = [];
for (const shard of manifest.shards) {
  const content = JSON.parse(readFileSync(resolve(dirname(manifestPath), shard.path), "utf8")) as { entries: LexiconDefinitionEntry[] };
  if (checksum(content.entries) !== shard.checksum) throw new Error(`Shard checksum mismatch: ${shard.path}`);
  entries.push(...content.entries);
}
if (checksum(entries) !== manifest.entriesChecksum) throw new Error("Definitions artifact checksum mismatch.");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment is required.");
const db = createClient(url, key, { auth: { persistSession: false } });

async function selectAll<T>(table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).order("id").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return rows;
  }
}

const [lemmas, vocabulary, senses] = await Promise.all([
  selectAll<DbLemma>("lexical_lemmas", "id,normalized_lemma,vocabulary_item_id"),
  selectAll<DbVocabularyItem>("vocabulary_items", "id,definition_fr,content_pipeline_version"),
  selectAll<DbSense>("lexical_senses", "id,lemma_id,sense_key,review_status"),
]);
const plan = planDefinitionImport(entries, { lemmas, vocabulary, senses }, { now: new Date().toISOString() });
const skippedByReason = plan.skipped.reduce<Record<string, number>>((counts, row) => ({ ...counts, [row.reason]: (counts[row.reason] ?? 0) + 1 }), {});
const summary = { target: new URL(url).host, dryRun, pipelineVersion: manifest.pipelineVersion, senses: plan.senses.length, vocabulary: plan.vocabulary.length, relationships: plan.relationships.length, skipped: skippedByReason };
if (dryRun) {
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  process.exit(0);
}

const batches = <T>(items: T[], size = 200) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
for (const batch of batches(plan.senses)) {
  const { error } = await db.from("lexical_senses").upsert(batch, { onConflict: "id" });
  if (error) throw new Error(`lexical_senses: ${error.message}`);
}
// Updates only (rows exist); guarded so a definition a person wrote meanwhile is never replaced.
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < plan.vocabulary.length) {
    const { id, ...values } = plan.vocabulary[next++];
    const { error } = await db.from("vocabulary_items").update(values).eq("id", id)
      .or("definition_fr.is.null,definition_fr.eq.,content_pipeline_version.not.is.null");
    if (error) throw new Error(`vocabulary_items ${id}: ${error.message}`);
  }
}));
const existing = await selectAll<{ id: string; source_sense_id: string; target_sense_id: string; relationship_type: string; home_language: string | null }>("lexical_relationships", "id,source_sense_id,target_sense_id,relationship_type,home_language");
const taken = new Map(existing.filter((row) => row.home_language === null).map((row) => [`${row.source_sense_id}:${row.target_sense_id}:${row.relationship_type}`, row.id]));
const relationships = plan.relationships.filter((row) => {
  const owner = taken.get(`${row.source_sense_id}:${row.target_sense_id}:${row.relationship_type}`);
  return !owner || owner === row.id; // another source already links these senses: keep theirs
});
for (const batch of batches(relationships)) {
  const { error } = await db.from("lexical_relationships").upsert(batch, { onConflict: "id" });
  if (error) throw new Error(`lexical_relationships: ${error.message}`);
}
process.stdout.write(`${JSON.stringify({ ok: true, ...summary })}\n`);
