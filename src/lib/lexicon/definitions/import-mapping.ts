/**
 * Pure mapping from the committed definitions artifact to database writes
 * (`npm run lexicon:import-definitions`). Idempotent: stable ids, upserts, and
 * a definition written by a person is never overwritten.
 */
import { stableUuid } from "../baseline";
import { normalizeForMatch } from "./gates";
import { LEXICON_DEFINITIONS_SENSE_KEY, type LexiconDefinitionEntry } from "./types";

export type DbLemma = { id: string; normalized_lemma: string; vocabulary_item_id: string | null };
export type DbVocabularyItem = { id: string; definition_fr: string | null; content_pipeline_version: string | null };
export type DbSense = { id: string; lemma_id: string; sense_key: string; review_status: string };

export type SenseUpsert = {
  id: string;
  lemma_id: string;
  sense_key: string;
  definition_fr: string;
  review_status: "auto_approved";
  is_teachable: true;
  examples_fr: Array<{ text: string; interest: string | null }>;
  definition_validation: unknown[];
  close_words: Record<string, string[]>;
  grade_level: number;
  pipeline_version: string;
  gate_results: LexiconDefinitionEntry["gateResults"];
  auto_approved_at: string;
};

export type VocabularyUpdate = {
  id: string;
  definition_fr: string;
  examples_fr: Array<{ text: string; interest: string | null }>;
  grade_level: number;
  related_topics: string[];
  definition_validation: unknown[];
  content_pipeline_version: string;
};

export type RelationshipUpsert = {
  id: string;
  source_sense_id: string;
  target_sense_id: string;
  relationship_type: "synonym" | "antonym" | "commonly_confused_with";
  strength: number;
  rationale: string;
};

export type SkipReason = "not_accepted" | "lemma_missing" | "human_definition" | "human_sense" | "taken_down";

export type DefinitionImportPlan = {
  senses: SenseUpsert[];
  vocabulary: VocabularyUpdate[];
  relationships: RelationshipUpsert[];
  skipped: Array<{ lemma: string; reason: SkipReason }>;
};

export function autoSenseId(lemmaId: string): string {
  return stableUuid("sigmawrite-lexicon-definitions-sense", `${lemmaId}:${LEXICON_DEFINITIONS_SENSE_KEY}`);
}

const APPROVED = new Set(["human_approved", "auto_approved"]);

export function planDefinitionImport(
  entries: LexiconDefinitionEntry[],
  db: { lemmas: DbLemma[]; vocabulary: DbVocabularyItem[]; senses: DbSense[] },
  options: { now: string },
): DefinitionImportPlan {
  const lemmaById = new Map(db.lemmas.map((lemma) => [lemma.id, lemma]));
  const lemmaByNormalized = new Map<string, DbLemma>();
  for (const lemma of db.lemmas) {
    const key = normalizeForMatch(lemma.normalized_lemma);
    // Prefer the lemma anchored to a vocabulary item when several share a spelling.
    if (!lemmaByNormalized.has(key) || (lemma.vocabulary_item_id && !lemmaByNormalized.get(key)!.vocabulary_item_id)) lemmaByNormalized.set(key, lemma);
  }
  const vocabularyById = new Map(db.vocabulary.map((item) => [item.id, item]));
  const sensesByLemma = new Map<string, DbSense[]>();
  for (const sense of db.senses) sensesByLemma.set(sense.lemma_id, [...(sensesByLemma.get(sense.lemma_id) ?? []), sense]);

  const plan: DefinitionImportPlan = { senses: [], vocabulary: [], relationships: [], skipped: [] };
  /** normalised lemma → the one approved sense words can point at (planned or existing). */
  const senseByLemma = new Map<string, string>();
  for (const [lemmaId, senses] of sensesByLemma) {
    const approved = senses.filter((sense) => APPROVED.has(sense.review_status));
    const lemma = lemmaById.get(lemmaId);
    if (lemma && approved.length === 1) senseByLemma.set(normalizeForMatch(lemma.normalized_lemma), approved[0].id);
  }

  const imported: Array<{ entry: LexiconDefinitionEntry; senseId: string }> = [];
  for (const entry of entries) {
    if (entry.status !== "accepted" || !entry.definitionFr) {
      plan.skipped.push({ lemma: entry.lemma, reason: "not_accepted" });
      continue;
    }
    const lemma = lemmaById.get(entry.lemmaId) ?? lemmaByNormalized.get(normalizeForMatch(entry.normalizedLemma));
    if (!lemma) {
      plan.skipped.push({ lemma: entry.lemma, reason: "lemma_missing" });
      continue;
    }
    const item = lemma.vocabulary_item_id ? vocabularyById.get(lemma.vocabulary_item_id) : undefined;
    if (item && item.definition_fr?.trim() && !item.content_pipeline_version) {
      plan.skipped.push({ lemma: entry.lemma, reason: "human_definition" });
      continue;
    }
    const senses = sensesByLemma.get(lemma.id) ?? [];
    const own = senses.find((sense) => sense.sense_key === LEXICON_DEFINITIONS_SENSE_KEY);
    if (own && (own.review_status === "retired" || own.review_status === "rejected")) {
      plan.skipped.push({ lemma: entry.lemma, reason: "taken_down" });
      continue;
    }
    const others = senses.filter((sense) => sense.sense_key !== LEXICON_DEFINITIONS_SENSE_KEY && sense.review_status !== "retired" && sense.review_status !== "rejected");
    if (others.length > 0) {
      plan.skipped.push({ lemma: entry.lemma, reason: "human_sense" });
      continue;
    }
    const senseId = own?.id ?? autoSenseId(lemma.id);
    const closeWords = entry.closeWords ?? { synonyms: [], antonyms: [], semantic: [], orthographic: [] };
    plan.senses.push({
      id: senseId,
      lemma_id: lemma.id,
      sense_key: LEXICON_DEFINITIONS_SENSE_KEY,
      definition_fr: entry.definitionFr,
      review_status: "auto_approved",
      is_teachable: true,
      examples_fr: entry.examplesFr ?? [],
      definition_validation: entry.definitionValidation ?? [],
      close_words: closeWords,
      grade_level: entry.gradeLevel,
      pipeline_version: entry.pipelineVersion,
      gate_results: entry.gateResults,
      auto_approved_at: options.now,
    });
    if (item) {
      plan.vocabulary.push({
        id: item.id,
        definition_fr: entry.definitionFr,
        examples_fr: entry.examplesFr ?? [],
        grade_level: entry.gradeLevel,
        related_topics: entry.relatedTopics ?? [],
        definition_validation: entry.definitionValidation ?? [],
        content_pipeline_version: entry.pipelineVersion,
      });
    }
    senseByLemma.set(normalizeForMatch(lemma.normalized_lemma), senseId);
    imported.push({ entry, senseId });
  }

  const seen = new Set<string>();
  const relate = (source: string, targetLemma: string, type: RelationshipUpsert["relationship_type"], strength: number, rationale: string) => {
    const target = senseByLemma.get(normalizeForMatch(targetLemma));
    if (!target || target === source) return;
    const key = `${source}:${target}:${type}`;
    if (seen.has(key)) return;
    seen.add(key);
    plan.relationships.push({
      id: stableUuid("sigmawrite-lexicon-definitions-relationship", key),
      source_sense_id: source,
      target_sense_id: target,
      relationship_type: type,
      strength,
      rationale,
    });
  };
  for (const { entry, senseId } of imported) {
    const rationale = `${entry.pipelineVersion}: generated, independently verified, spelling vetted against the licensed lexicon`;
    for (const word of entry.closeWords?.synonyms ?? []) relate(senseId, word, "synonym", 0.8, rationale);
    for (const word of entry.closeWords?.antonyms ?? []) relate(senseId, word, "antonym", 0.8, rationale);
    for (const word of entry.closeWords?.orthographic ?? []) relate(senseId, word, "commonly_confused_with", 0.5, `${entry.pipelineVersion}: orthographic neighbour (edit distance ≤ 2)`);
  }
  return plan;
}
