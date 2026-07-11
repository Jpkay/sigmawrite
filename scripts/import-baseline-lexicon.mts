import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { stableUuid, type BaselineLexiconArtifact, verifyBaselineArtifact } from "../src/lib/lexicon/baseline";

loadEnv({ path: ".env.local", quiet: true });
const artifactPath = resolve(process.argv[2] ?? "generated/french-baseline-lexicon.json");
const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as BaselineLexiconArtifact;
if (!verifyBaselineArtifact(artifact)) throw new Error("Lexical artifact checksum mismatch.");
if (!artifact.source.commercialUseAllowed || !artifact.source.licenseIdentifier || !artifact.source.terms) {
  throw new Error("The lexical source has no approved commercial-use decision.");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service environment is required.");
const db = createClient(url, key, { auth: { persistSession: false } });

let source = await db.from("taxonomy_sources").select("id").eq("source_key", artifact.source.key).maybeSingle();
if (source.error) throw new Error(source.error.message);
if (!source.data) {
  const created = await db.from("taxonomy_sources").insert({
    source_key: artifact.source.key,
    title: "SigmaWrite original French pilot corpus",
    owner_name: "SigmaWrite",
    source_kind: "original",
    steward: "taxonomy-steward",
  }).select("id").single();
  if (created.error) throw new Error(created.error.message);
  source = created;
}
const sourceId = source.data!.id as string;
let sourceVersion = await db.from("taxonomy_source_versions").select("id,artifact_checksum").eq("source_id", sourceId).eq("version_label", artifact.source.version).maybeSingle();
if (sourceVersion.error) throw new Error(sourceVersion.error.message);
if (sourceVersion.data && sourceVersion.data.artifact_checksum !== artifact.source.checksum) {
  throw new Error("The registered source version has a different immutable checksum.");
}
if (!sourceVersion.data) {
  const created = await db.from("taxonomy_source_versions").insert({
    source_id: sourceId,
    version_label: artifact.source.version,
    artifact_checksum: artifact.source.checksum,
    rights_status: "importable",
    license_identifier: artifact.source.licenseIdentifier,
    terms_snapshot: artifact.source.terms,
    permitted_fields: ["lemma", "form", "part_of_speech", "frequency"],
    attribution_template: artifact.source.attribution,
    commercial_use_allowed: true,
    decision_notes: "Original SigmaWrite corpus approved by the source register.",
    approved_at: new Date().toISOString(),
  }).select("id,artifact_checksum").single();
  if (created.error) throw new Error(created.error.message);
  sourceVersion = created;
}
const sourceVersionId = sourceVersion.data!.id as string;

for (const entry of artifact.entries) {
  const vocabularyId = entry.id;
  const vocabulary = await db.from("vocabulary_items").upsert({
    id: vocabularyId,
    lemma: entry.lemma,
    display_word: entry.forms[0]?.surface ?? entry.lemma,
    frequency_per_million: entry.frequencyPerMillion,
    frequency_source: `${artifact.source.key}@${artifact.source.version}`,
    active: true,
  }, { onConflict: "id" });
  if (vocabulary.error) throw new Error(vocabulary.error.message);
  const lemma = await db.from("lexical_lemmas").upsert({
    id: entry.id,
    vocabulary_item_id: vocabularyId,
    lemma: entry.lemma,
    normalized_lemma: entry.normalizedLemma,
    part_of_speech: entry.partOfSpeech ?? null,
    active: true,
  }, { onConflict: "id" });
  if (lemma.error) throw new Error(lemma.error.message);
  for (const form of entry.forms) {
    const formResult = await db.from("lexical_forms").upsert({
      id: form.id,
      lemma_id: entry.id,
      surface_form: form.surface,
      normalized_form: form.normalized,
      form_type: form.normalized === entry.normalizedLemma ? "lemma" : "inflected",
      features: {},
      source_version_id: sourceVersionId,
    }, { onConflict: "id" });
    if (formResult.error) throw new Error(formResult.error.message);
  }
  const frequency = await db.from("lexical_frequencies").upsert({
    id: entry.id,
    lemma_id: entry.id,
    form_id: null,
    source_version_id: sourceVersionId,
    corpus_partition: "sigma-pilot-build",
    frequency_per_million: entry.frequencyPerMillion,
  }, { onConflict: "id" });
  if (frequency.error) throw new Error(frequency.error.message);
}

let release = await db.from("lexical_releases").select("id,status,manifest_checksum").eq("release_key", artifact.release.key).maybeSingle();
if (release.error) throw new Error(release.error.message);
if (release.data && release.data.manifest_checksum !== artifact.manifest.contentChecksum) {
  throw new Error("The existing lexical release key has a different immutable checksum.");
}
if (!release.data) {
  const created = await db.from("lexical_releases").insert({
    release_key: artifact.release.key,
    version: artifact.release.version,
    status: "validating",
    manifest: artifact.report,
    manifest_checksum: artifact.manifest.contentChecksum,
    source_attributions: [artifact.source.attribution],
    validation_report: { valid: true, report: artifact.report },
  }).select("id,status,manifest_checksum").single();
  if (created.error) throw new Error(created.error.message);
  release = created;
}
if (release.data!.status === "published" || release.data!.status === "withdrawn") {
  if (release.data!.status === "published") process.stdout.write(JSON.stringify({ ok: true, idempotent: true, releaseId: release.data!.id }));
  process.exit(0);
}
for (const entry of artifact.entries) {
  const result = await db.from("lexical_release_entries").upsert({
    id: stableUuid("sigmawrite-lexical-release-entry", `${artifact.release.key}:${entry.id}`),
    release_id: release.data!.id,
    lemma_id: entry.id,
    sense_id: null,
    stable_key: entry.normalizedLemma,
    record_snapshot: entry,
    record_checksum: artifact.manifest.entriesChecksum,
  }, { onConflict: "id" });
  if (result.error) throw new Error(result.error.message);
}
const publisherId = process.env.LEXICON_PUBLISHER_PROFILE_ID;
if (publisherId) {
  const published = await db.from("lexical_releases").update({
    status: "published",
    published_by: publisherId,
    published_at: new Date().toISOString(),
  }).eq("id", release.data!.id).eq("status", "validating");
  if (published.error) throw new Error(published.error.message);
}
process.stdout.write(`${JSON.stringify({ ok: true, releaseId: release.data!.id, entries: artifact.entries.length, published: Boolean(publisherId) })}\n`);
