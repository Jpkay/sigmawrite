import "server-only";
/**
 * Evidence capture from each place a word is seen (roadmap 2026-10 A.4).
 * Thin adapters around recordWordEvidence; the call sites in the server
 * actions stay one line. All are best-effort: a failure is reported to
 * monitoring and never blocks the student's activity.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { alignProduction, dictationWordOutcomes, freeWritingUses, normalizeWord, sentenceContaining, wordTokens, type ProducedWord } from "./matching";
import { recordWordEvidence, resolveFormTargets, resolveItemTargets, safely, type WordEvidenceInput, type WordTarget } from "./server";
import type { WordActivityFormat, WordEvidenceSource } from "./types";

type Db = SupabaseClient;

/**
 * A.1 + A.3: reading a text adds one exposure per target word (and per
 * word the student already tracks, matched by lemma so "courait" counts for
 * "courir"). Exposure never touches mastery.
 */
export async function captureReadingExposure(db: Db, input: {
  studentId: string;
  sessionId: string;
  textVersionId: string;
  paragraphs: string[];
  interest: string | null;
  at: string;
  source?: WordEvidenceSource;
}) {
  return safely("reading_exposure", async () => {
    const { data: links, error } = await db.from("text_vocabulary").select("vocabulary_item_id,lexical_sense_id").eq("text_version_id", input.textVersionId);
    if (error) throw new Error(error.message);
    const pins = new Map((links ?? []).map((row) => [row.vocabulary_item_id as string, (row.lexical_sense_id as string | null) ?? null]));
    const targets = await resolveItemTargets(db, [...pins.keys()], pins);
    const tokens = new Set(input.paragraphs.flatMap((paragraph) => wordTokens(paragraph)));
    const tracked = await db.from("student_word_mastery").select("vocabulary_item_id").eq("student_id", input.studentId).limit(2000);
    if (tracked.error) throw new Error(tracked.error.message);
    const trackedIds = new Set((tracked.data ?? []).map((row) => row.vocabulary_item_id as string));
    const byForm = await resolveFormTargets(db, [...tokens]);
    const all = new Map<string, { target: WordTarget; forms: Set<string> }>();
    for (const target of targets.values()) all.set(target.vocabularyItemId, { target, forms: new Set([normalizeWord(target.displayWord)]) });
    for (const [form, target] of byForm) {
      const existing = all.get(target.vocabularyItemId);
      if (existing) { existing.forms.add(form); continue; }
      if (trackedIds.has(target.vocabularyItemId)) all.set(target.vocabularyItemId, { target, forms: new Set([form]) });
    }
    const inputs: WordEvidenceInput[] = [...all.values()].map(({ target, forms }) => ({
      target, format: "reading_exposure", source: input.source ?? "reading", correct: true,
      occurrenceKey: `reading:${input.sessionId}:${target.vocabularyItemId}`, at: input.at,
      firstSeen: { sentence: sentenceContaining(input.paragraphs, forms), interest: input.interest },
    }));
    return recordWordEvidence(db, input.studentId, inputs);
  });
}

function producedEvidence(words: Array<ProducedWord & { key: string }>, targets: Map<string, WordTarget>, base: { format: WordActivityFormat; source: WordEvidenceSource; at: string; occurrence: string; responseMs?: number | null }): WordEvidenceInput[] {
  const inputs: WordEvidenceInput[] = [];
  for (const word of words) {
    if (word.outcome === "missing") continue; // a skipped word is not a spelling attempt
    const target = targets.get(word.normalized);
    if (!target) continue;
    inputs.push({
      target, format: base.format, source: base.source,
      correct: word.outcome === "exact", accentOnly: word.outcome === "accent",
      responseMs: base.responseMs ?? null,
      occurrenceKey: `${base.occurrence}:${word.key}`, at: base.at,
      payload: word.outcome === "exact" ? {} : { written: (word.actual ?? "").slice(0, 60) },
    });
  }
  return inputs;
}

/** G.6 / A.4: each dictée segment is spelling evidence for every tracked word in it, correct or misspelled. */
export async function captureDictationEvidence(db: Db, input: { studentId: string; attemptId: string; segments: string[]; answers: string[]; at: string }) {
  return safely("dictation", async () => {
    const outcomes = dictationWordOutcomes(input.segments, input.answers);
    const targets = await resolveFormTargets(db, outcomes.map((word) => word.normalized));
    const words = outcomes.map((word, index) => ({ ...word, key: `${word.segment}:${index}` }));
    return recordWordEvidence(db, input.studentId, producedEvidence(words, targets, { format: "dictation", source: "dictation", at: input.at, occurrence: `dictation:${input.attemptId}` }));
  });
}

/** Practice items and diagnostic items with a typed answer: words of the expected answer. */
export async function captureTypedAnswerEvidence(db: Db, input: {
  studentId: string;
  expected: string | null | undefined;
  produced: string | null | undefined;
  source: "practice" | "diagnostic" | "story";
  occurrenceKey: string;
  at: string;
  responseMs?: number | null;
}) {
  if (!input.expected?.trim() || !input.produced?.trim()) return null;
  return safely(input.source, async () => {
    const outcomes = alignProduction(input.expected!, input.produced!);
    const targets = await resolveFormTargets(db, outcomes.map((word) => word.normalized));
    const words = outcomes.map((word, index) => ({ ...word, key: String(index) }));
    const format: WordActivityFormat = input.source === "diagnostic" ? "diagnostic_item" : input.source === "story" ? "gap_fill_typed" : "practice_item";
    return recordWordEvidence(db, input.studentId, producedEvidence(words, targets, { format, source: input.source, at: input.at, occurrence: input.occurrenceKey, responseMs: input.responseMs }));
  });
}

/**
 * The student's own writing: correct uses of words they track are spelling
 * evidence; near-misses of those words (not themselves valid French forms)
 * are misspellings.
 */
export async function captureFreeWritingEvidence(db: Db, input: { studentId: string; text: string; source: "writing" | "story"; occurrenceKey: string; at: string }) {
  return safely("free_writing", async () => {
    const tokens = [...new Set(wordTokens(input.text))];
    if (!tokens.length) return [];
    const { data: tracked, error } = await db.from("student_word_mastery").select("vocabulary_item_id").eq("student_id", input.studentId).neq("word_status", "decouvert").limit(2000);
    if (error) throw new Error(error.message);
    const trackedTargets = await resolveItemTargets(db, (tracked ?? []).map((row) => row.vocabulary_item_id as string));
    const formsResult = trackedTargets.size
      ? await db.from("lexical_forms").select("normalized_form,lemma_id").in("lemma_id", [...trackedTargets.values()].map((target) => target.lemmaId))
      : { data: [], error: null };
    if (formsResult.error) throw new Error(formsResult.error.message);
    const formTarget = new Map<string, WordTarget>();
    const lemmaTarget = new Map([...trackedTargets.values()].map((target) => [target.lemmaId, target]));
    for (const target of trackedTargets.values()) formTarget.set(normalizeWord(target.displayWord), target);
    for (const row of formsResult.data ?? []) {
      const target = lemmaTarget.get(row.lemma_id as string);
      if (target) formTarget.set(normalizeWord(row.normalized_form as string), target);
    }
    if (!formTarget.size) return [];
    const known = await resolveFormTargets(db, tokens);
    const uses = freeWritingUses(input.text, new Set(formTarget.keys()), new Set(known.keys()));
    const seen = new Set<string>();
    const inputs: WordEvidenceInput[] = [];
    for (const use of uses) {
      const target = formTarget.get(use.form);
      if (!target || seen.has(target.vocabularyItemId)) continue; // one piece of evidence per word per text
      seen.add(target.vocabularyItemId);
      inputs.push({
        target, format: "free_writing", source: input.source, correct: use.outcome === "exact", accentOnly: use.outcome === "accent",
        occurrenceKey: `${input.occurrenceKey}:${target.vocabularyItemId}`, at: input.at,
        payload: use.outcome === "exact" ? {} : { written: use.token.slice(0, 60) },
      });
    }
    return recordWordEvidence(db, input.studentId, inputs);
  });
}
