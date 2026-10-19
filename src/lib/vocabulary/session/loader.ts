import "server-only";
/**
 * Loads everything one word burst needs (roadmap 2026-10 D.1–D.4): today's
 * due cards (caps applied by getDueWordCards), words to introduce, vetted
 * definitions, sentences from the student's interests, lexical relations,
 * close neighbours for wrong options, and cached audio.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDueWordCards, type DueWordPlan } from "../server";
import type { WordFacet, WordStatus } from "../types";
import { localDay } from "../days";
import { signWordAudio } from "./audio";
import type { BuildWordSessionInput, SessionReview, SessionWord } from "./builder";
import type { LexicalNeighbour, Relation } from "./distractors";
import { parseValidation, type ValidationEntry } from "./explain";
import { parseExamples } from "./sentences";

type Db = SupabaseClient;

export type LoadedWordSession = {
  input: BuildWordSessionInput;
  plan: Pick<DueWordPlan, "paused" | "holiday" | "rampActive">;
  validation: Map<string, ValidationEntry[]>;
  /** Introductions: sense → first-met sentence and interest. */
  introductions: Map<string, { sentence: string | null; interest: string | null }>;
};

type LemmaRow = { id: string; lemma: string; part_of_speech: string | null; vocabulary_item_id: string | null };
type SenseRow = { id: string; definition_fr: string; domain: string | null; lemma_id: string; lexical_lemmas: LemmaRow };

const SENSE_COLUMNS = "id,definition_fr,domain,lemma_id,lexical_lemmas!inner(id,lemma,part_of_speech,vocabulary_item_id)";

async function loadSenses(db: Db, ids: string[]): Promise<SenseRow[]> {
  if (!ids.length) return [];
  const { data, error } = await db.from("lexical_senses").select(SENSE_COLUMNS).in("id", [...new Set(ids)].slice(0, 400)).eq("review_status", "human_approved");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SenseRow[];
}

async function loadItems(db: Db, itemIds: string[]) {
  const ids = [...new Set(itemIds)];
  if (!ids.length) return new Map<string, { example: string | null; examples: unknown; validation: unknown }>();
  const { data, error } = await db.from("vocabulary_items").select("id,example_fr,examples_fr,definition_validation").in("id", ids.slice(0, 400));
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.id as string, { example: (row.example_fr as string | null) ?? null, examples: row.examples_fr, validation: row.definition_validation }]));
}

async function loadForms(db: Db, lemmaIds: string[]) {
  const out = new Map<string, string[]>();
  const ids = [...new Set(lemmaIds)];
  if (!ids.length) return out;
  const { data, error } = await db.from("lexical_forms").select("lemma_id,surface_form").in("lemma_id", ids.slice(0, 400)).limit(4000);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const list = out.get(row.lemma_id as string) ?? [];
    list.push(row.surface_form as string);
    out.set(row.lemma_id as string, list);
  }
  return out;
}

function examplesOf(item: { example: string | null; examples: unknown } | undefined): Array<{ text: string; interest: string | null }> {
  if (!item) return [];
  const list = parseExamples(item.examples);
  if (item.example?.trim() && !list.some((entry) => entry.text === item.example!.trim())) list.push({ text: item.example.trim(), interest: null });
  return list;
}

/**
 * `units` = words to review (both traces of a word are one unit) and
 * `newWords` = words to introduce, as planned by the daily session.
 */
export async function loadWordSessionData(db: Db, studentId: string, options: { units: number; newWords: number; now?: string; offset?: number; explainEnabled?: boolean }): Promise<LoadedWordSession> {
  const now = options.now ?? new Date().toISOString();
  const plan = await getDueWordCards(db, studentId, { now });
  // Group the planned cards by sense, keeping the planner's priority order.
  const bySense = new Map<string, { facets: WordFacet[]; retrievability: number; cardIds: string[] }>();
  for (const review of plan.reviews) {
    if (!review.word || !review.definition) continue;
    const entry = bySense.get(review.senseId) ?? { facets: [], retrievability: review.retrievability, cardIds: [] };
    if (!entry.facets.includes(review.facet)) entry.facets.push(review.facet);
    entry.retrievability = Math.min(entry.retrievability, review.retrievability);
    entry.cardIds.push(review.id);
    bySense.set(review.senseId, entry);
  }
  const reviewSenses = [...bySense.keys()].slice(0, Math.max(0, options.units));
  const intros = plan.toIntroduce.filter((word) => word.definition).slice(0, Math.max(0, Math.min(options.newWords, plan.newWordAllowance)));
  const introSenses = intros.map((word) => word.senseId).filter((id) => !bySense.has(id));

  const [lapseRows, interestRows] = await Promise.all([
    reviewSenses.length
      ? db.from("learning_retrieval_schedules").select("target_id,lapse_count").eq("student_id", studentId).eq("target_type", "lexical_sense").in("target_id", reviewSenses)
      : Promise.resolve({ data: [], error: null }),
    db.from("student_interests").select("interest_key,declared_strength,inferred_strength").eq("student_id", studentId),
  ]);
  if (lapseRows.error) throw new Error(lapseRows.error.message);
  const lapses = new Map<string, number>();
  for (const row of lapseRows.data ?? []) lapses.set(row.target_id as string, Math.max(lapses.get(row.target_id as string) ?? 0, Number(row.lapse_count ?? 0)));
  const interests = (interestRows.data ?? [])
    .sort((a, b) => Number(b.declared_strength ?? 0) + Number(b.inferred_strength ?? 0) - Number(a.declared_strength ?? 0) - Number(a.inferred_strength ?? 0))
    .map((row) => row.interest_key as string);

  const targetSenses = await loadSenses(db, [...reviewSenses, ...introSenses]);
  const targetIds = new Set(targetSenses.map((sense) => sense.id));
  const itemIds = targetSenses.flatMap((sense) => (sense.lexical_lemmas.vocabulary_item_id ? [sense.lexical_lemmas.vocabulary_item_id] : []));

  // Relations, the student's other words and look-alike lemmas feed the wrong options.
  const [relationRows, ownCards, masteryRows] = await Promise.all([
    targetIds.size
      ? db.from("lexical_relationships").select("source_sense_id,target_sense_id,relationship_type,strength").or(`source_sense_id.in.(${[...targetIds].join(",")}),target_sense_id.in.(${[...targetIds].join(",")})`).limit(400)
      : Promise.resolve({ data: [], error: null }),
    db.from("learning_retrieval_schedules").select("target_id").eq("student_id", studentId).eq("target_type", "lexical_sense").limit(300),
    itemIds.length
      ? db.from("student_word_mastery").select("vocabulary_item_id,first_seen_sentence,first_seen_interest,word_status").eq("student_id", studentId).in("vocabulary_item_id", itemIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (relationRows.error) throw new Error(relationRows.error.message);
  const relationsBySense = new Map<string, Relation[]>();
  const relatedIds = new Set<string>();
  for (const row of relationRows.data ?? []) {
    const source = row.source_sense_id as string, target = row.target_sense_id as string;
    const type = row.relationship_type as Relation["type"];
    if (!["synonym", "antonym", "commonly_confused_with", "broader_than", "narrower_than", "simpler_than"].includes(type)) continue;
    for (const [own, other] of [[source, target], [target, source]] as const) {
      if (!targetIds.has(own)) continue;
      const list = relationsBySense.get(own) ?? [];
      list.push({ senseId: other, type, strength: Number(row.strength ?? 1) });
      relationsBySense.set(own, list);
      relatedIds.add(other);
    }
  }
  const prefixes = [...new Set(targetSenses.map((sense) => sense.lexical_lemmas.lemma.normalize("NFC").toLocaleLowerCase("fr").slice(0, 2)).filter((prefix) => /^\p{L}{2}$/u.test(prefix)))];
  const lookalikes = prefixes.length
    ? await db.from("lexical_lemmas").select("id").eq("active", true).or(prefixes.map((prefix) => `normalized_lemma.like.${prefix}*`).join(",")).limit(80)
    : { data: [], error: null };
  const lookalikeLemmas = (lookalikes.data ?? []).map((row) => row.id as string);
  const lookalikeSenses = lookalikeLemmas.length
    ? await db.from("lexical_senses").select("id").in("lemma_id", lookalikeLemmas).eq("review_status", "human_approved").limit(120)
    : { data: [], error: null };
  const poolIds = [...new Set([
    ...relatedIds,
    ...(ownCards.data ?? []).map((row) => row.target_id as string),
    ...(lookalikeSenses.data ?? []).map((row) => row.id as string),
  ])].filter((id) => !targetIds.has(id));
  const poolSenses = await loadSenses(db, poolIds);
  const allSenses = [...targetSenses, ...poolSenses];
  const [items, forms, audio] = await Promise.all([
    loadItems(db, allSenses.flatMap((sense) => (sense.lexical_lemmas.vocabulary_item_id ? [sense.lexical_lemmas.vocabulary_item_id] : []))),
    loadForms(db, allSenses.map((sense) => sense.lemma_id)),
    signWordAudio(db, targetSenses.filter((sense) => bySense.get(sense.id)?.facets.includes("spelling")).map((sense) => sense.lemma_id)),
  ]);
  const mastery = new Map((masteryRows.data ?? []).map((row) => [row.vocabulary_item_id as string, row]));

  const words = new Map<string, SessionWord>();
  const validation = new Map<string, ValidationEntry[]>();
  for (const sense of targetSenses) {
    const lemma = sense.lexical_lemmas;
    const item = lemma.vocabulary_item_id ? items.get(lemma.vocabulary_item_id) : undefined;
    const met = lemma.vocabulary_item_id ? mastery.get(lemma.vocabulary_item_id) : undefined;
    const intro = intros.find((word) => word.senseId === sense.id);
    words.set(sense.id, {
      senseId: sense.id,
      word: lemma.lemma,
      definition: sense.definition_fr,
      forms: [lemma.lemma, ...(forms.get(lemma.id) ?? []).filter((form) => form !== lemma.lemma)],
      partOfSpeech: lemma.part_of_speech,
      domain: sense.domain,
      firstSeen: { sentence: (met?.first_seen_sentence as string | null) ?? intro?.firstSeenSentence ?? null, interest: (met?.first_seen_interest as string | null) ?? intro?.interest ?? null },
      examples: examplesOf(item),
      relations: relationsBySense.get(sense.id) ?? [],
      audioUrl: audio.get(lemma.id) ?? null,
    });
    validation.set(sense.id, parseValidation(item?.validation));
  }
  const pool: LexicalNeighbour[] = poolSenses.map((sense) => {
    const item = sense.lexical_lemmas.vocabulary_item_id ? items.get(sense.lexical_lemmas.vocabulary_item_id) : undefined;
    return {
      senseId: sense.id,
      word: sense.lexical_lemmas.lemma,
      definition: sense.definition_fr,
      partOfSpeech: sense.lexical_lemmas.part_of_speech,
      domain: sense.domain,
      sentences: examplesOf(item).map((entry) => entry.text),
    };
  });
  const reviews: SessionReview[] = reviewSenses.filter((id) => words.has(id)).map((senseId) => {
    const entry = bySense.get(senseId)!;
    const lemma = targetSenses.find((sense) => sense.id === senseId)?.lexical_lemmas;
    const status = lemma?.vocabulary_item_id ? (mastery.get(lemma.vocabulary_item_id)?.word_status as WordStatus | undefined) ?? null : null;
    return { senseId, facets: entry.facets, retrievability: entry.retrievability, lapses: lapses.get(senseId) ?? 0, status };
  });
  const introductions = new Map(intros.filter((word) => words.has(word.senseId)).map((word) => [word.senseId, { sentence: words.get(word.senseId)!.firstSeen.sentence, interest: words.get(word.senseId)!.firstSeen.interest }]));
  return {
    input: {
      seed: `${studentId}:${localDay(now)}:${options.offset ?? 0}`,
      interests,
      reviews,
      introductions: [...introductions.keys()],
      words,
      pool,
      explainEnabled: options.explainEnabled ?? process.env.WORD_EXPLAIN_ENABLED !== "false",
      maxItems: Math.max(1, options.units + options.newWords),
    },
    plan: { paused: plan.paused, holiday: plan.holiday, rampActive: plan.rampActive },
    validation,
    introductions,
  };
}

/** Synonyms and antonyms of a sense, as words (for the explanation check). */
export async function loadRelatedWords(db: Db, senseId: string): Promise<{ synonyms: string[]; antonyms: string[] }> {
  const { data, error } = await db.from("lexical_relationships").select("source_sense_id,target_sense_id,relationship_type").or(`source_sense_id.eq.${senseId},target_sense_id.eq.${senseId}`).in("relationship_type", ["synonym", "antonym"]).limit(40);
  if (error || !data?.length) return { synonyms: [], antonyms: [] };
  const others = data.map((row) => ({ id: (row.source_sense_id === senseId ? row.target_sense_id : row.source_sense_id) as string, type: row.relationship_type as string }));
  const senses = await loadSenses(db, others.map((entry) => entry.id));
  const word = new Map(senses.map((sense) => [sense.id, sense.lexical_lemmas.lemma]));
  return {
    synonyms: others.filter((entry) => entry.type === "synonym").flatMap((entry) => (word.get(entry.id) ? [word.get(entry.id)!] : [])),
    antonyms: others.filter((entry) => entry.type === "antonym").flatMap((entry) => (word.get(entry.id) ? [word.get(entry.id)!] : [])),
  };
}
