"use server";
import {vocabularyDisplay} from "@/lib/diagnostic/granular/vocabulary-display";
import {journalStudentPayload} from "@/lib/diagnostic/granular/server-delivery-journal";
import { XP_AWARDS } from "@/lib/motivation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireStudentLearningUnlocked } from "@/lib/diagnostic/access";
import type { RetrievalResult } from "@/lib/scoring/retrieval";
import { gradeSpelling } from "@/lib/vocabulary/grading";
import { introduceWord, loadWordCards, recordWordEvidence, resolveItemTargets } from "@/lib/vocabulary/server";
import type { WordStatus } from "@/lib/vocabulary/types";

const reviewSchema = z.object({ itemId: z.string().uuid(), answer: z.string().max(80), responseMs: z.number().int().min(0).max(600_000).optional() });

export type VocabularyMemory = {
  itemId: string; word: string; definition: string | null; example: string | null; mastery: number; exposures: number;
  dueAt: string | null; lastResult: RetrievalResult | null; status: WordStatus; toConfirm: boolean;
};

async function studentId(profileId: string) {
  const db = await createClient();
  const { data, error } = await db.from("students").select("id").eq("profile_id", profileId).single();
  if (error || !data) throw new Error("Profil élève introuvable.");
  return data.id as string;
}

export async function loadVocabularyMemories(): Promise<VocabularyMemory[]> {
  const session = await requireRole(["student"]);
  const id = await studentId(session.id);
  const db = await createClient();
  const { data, error } = await db.from("student_word_mastery")
    .select("mastery,exposures,next_review_at,last_result,word_status,status_note,vocabulary_items!inner(id,display_word,definition_fr,example_fr)")
    .eq("student_id", id).not("vocabulary_items.definition_fr", "is", null).order("next_review_at", { ascending: true, nullsFirst: true });
  if (error) throw new Error(error.message);
  const result: VocabularyMemory[] = (data ?? []).map((row) => {
    const item = row.vocabulary_items as unknown as { id: string; display_word: string; definition_fr: string | null; example_fr: string | null };
    const extra = row as { word_status?: string | null; status_note?: string | null };
    return {
      itemId: item.id, word: item.display_word, definition: item.definition_fr, example: item.example_fr,
      mastery: Number(row.mastery), exposures: Number(row.exposures), dueAt: row.next_review_at as string | null,
      lastResult: row.last_result as RetrievalResult | null,
      status: (extra.word_status ?? "decouvert") as WordStatus,
      toConfirm: extra.status_note === "a_confirmer",
    };
  });
  await journalStudentPayload(id, "legacy:vocabulary", { rows: result, display: vocabularyDisplay(result) });
  return result;
}

/**
 * "Type the word from its definition" on the Vocabulaire page. The answer is
 * graded on the server (never trusted from the client) and goes through the
 * word memory pipeline, where it proves both traces (roadmap 2026-10 B).
 */
export async function reviewVocabulary(input: unknown) {
  const parsed = reviewSchema.parse(input);
  const session = await requireRole(["student"]);
  const id = await studentId(session.id);
  await requireStudentLearningUnlocked(await createClient(), id);
  const service = createServiceClient();
  const { data: item, error } = await service.from("vocabulary_items").select("id,display_word").eq("id", parsed.itemId).single();
  if (error || !item) throw new Error("Mot introuvable.");
  const { data: memory } = await service.from("student_word_mastery").select("mastery").eq("student_id", id).eq("vocabulary_item_id", parsed.itemId).maybeSingle();
  if (!memory) throw new Error("Mot introuvable.");
  const outcome = gradeSpelling(parsed.answer, item.display_word as string);
  const result: RetrievalResult = outcome === "exact" ? "good" : outcome === "wrong" ? "forgot" : "hard";
  const at = new Date().toISOString();
  const target = (await resolveItemTargets(service, [parsed.itemId])).get(parsed.itemId);
  if (target) {
    // This optional page doubles as an introduction until Phase D's guided one lands (C.2).
    if (target.senseId && !(await loadWordCards(service, id, [target.senseId])).length) {
      await introduceWord(service, { studentId: id, senseId: target.senseId, at, occurrenceKey: `introduction:vocabulary_page:${target.senseId}` });
    }
    await recordWordEvidence(service, id, [{
      target, format: "type_from_definition", source: "review", correct: outcome === "exact", accentOnly: outcome === "accent",
      responseMs: parsed.responseMs ?? null, occurrenceKey: `vocabulary_page:${parsed.itemId}:${at}`, at,
    }]);
  }
  const { data: refreshed } = await service.from("student_word_mastery").select("mastery,word_status").eq("student_id", id).eq("vocabulary_item_id", parsed.itemId).single();
  const mastery = Number(refreshed?.mastery ?? memory.mastery);
  const cards = target?.senseId
    ? (await service.from("learning_retrieval_schedules").select("due_at").eq("student_id", id).eq("target_type", "lexical_sense").eq("target_id", target.senseId).order("due_at", { ascending: true }).limit(1)).data
    : null;
  const dueAt = (cards?.[0]?.due_at as string | undefined) ?? new Date(Date.now() + 86_400_000).toISOString();
  // Typed history stays in vocabulary_review_attempts (A.2 recompute, data export).
  const { error: attemptError } = await service.from("vocabulary_review_attempts").insert({ student_id: id, vocabulary_item_id: parsed.itemId, result, previous_mastery: Number(memory.mastery), next_mastery: mastery, reviewed_at: at });
  if (attemptError) throw new Error(attemptError.message);
  const { error: memoryError } = await service.from("student_word_mastery").update({ next_review_at: dueAt, last_reviewed_at: at, last_result: result }).eq("student_id", id).eq("vocabulary_item_id", parsed.itemId);
  if (memoryError) throw new Error(memoryError.message);
  const { data: xp } = await service.rpc("award_student_xp", { p_student_id: id, p_event_key: `vocabulary_review:${parsed.itemId}:${at.slice(0, 10)}`, p_source_type: "vocabulary_review", p_source_id: parsed.itemId, p_base_xp: XP_AWARDS.vocabularyReview, p_bonus_xp: 0, p_awarded_at: at });
  return { ok: true, dueAt, mastery, result, status: (refreshed?.word_status as WordStatus | undefined) ?? null, xp: xp ?? null };
}
