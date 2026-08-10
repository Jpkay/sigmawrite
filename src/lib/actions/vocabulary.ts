"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { scheduleFsrs } from "@/lib/scoring/fsrs";
import { gradeTypedVocabularyRecall } from "@/lib/scoring/vocabulary-recall";
import type { RetrievalResult } from "@/lib/scoring/retrieval";
import {
  EMPTY_VOCABULARY_EVIDENCE,
  recordVocabularyEvidence,
  vocabularyLearningState,
  type VocabularyEvidence,
  type VocabularyStatus,
} from "@/lib/vocabulary/learning";

const reviewSchema = z.object({
  itemId: z.string().uuid(),
  answerText: z.string().trim().min(1).max(200),
});

export type VocabularyMemory = {
  itemId: string;
  word: string;
  definition: string | null;
  examples: string[];
  mastery: number;
  exposures: number;
  dueAt: string | null;
  lastResult: RetrievalResult | null;
  status: VocabularyStatus;
  evidence: VocabularyEvidence;
};

async function studentId(profileId: string) {
  const db = await createClient();
  const { data, error } = await db
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .single();
  if (error || !data) throw new Error("Profil élève introuvable.");
  return data.id as string;
}

export async function loadVocabularyMemories(): Promise<VocabularyMemory[]> {
  const session = await requireRole(["student"]);
  const id = await studentId(session.id);
  const db = await createClient();
  const { data, error } = await db
    .from("student_word_mastery")
    .select("mastery,exposures,next_review_at,last_result,learning_status,evidence_counts,vocabulary_items!inner(id,display_word,definition_fr,example_fr,examples_fr)")
    .eq("student_id", id)
    .not("vocabulary_items.definition_fr", "is", null)
    .order("next_review_at", { ascending: true, nullsFirst: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const item = row.vocabulary_items as unknown as {
      id: string;
      display_word: string;
      definition_fr: string | null;
      example_fr: string | null;
      examples_fr: unknown;
    };
    const evidence = row.evidence_counts && typeof row.evidence_counts === "object"
      ? row.evidence_counts as VocabularyEvidence
      : { ...EMPTY_VOCABULARY_EVIDENCE, exposure: Number(row.exposures) };
    const examples = Array.isArray(item.examples_fr)
      ? item.examples_fr.filter((value): value is string => typeof value === "string")
      : [];
    if (item.example_fr && !examples.includes(item.example_fr)) examples.unshift(item.example_fr);
    return {
      itemId: item.id,
      word: item.display_word,
      definition: item.definition_fr,
      examples,
      mastery: Number(row.mastery),
      exposures: Number(row.exposures),
      dueAt: row.next_review_at as string | null,
      lastResult: row.last_result as RetrievalResult | null,
      status: (row.learning_status ?? "new") as VocabularyStatus,
      evidence,
    };
  });
}

export async function reviewVocabulary(input: unknown) {
  const parsed = reviewSchema.parse(input);
  const session = await requireRole(["student"]);
  const id = await studentId(session.id);
  const service = createServiceClient();
  const { data: memory, error } = await service
    .from("student_word_mastery")
    .select("stability,difficulty,last_reviewed_at,desired_retention,evidence_counts,vocabulary_items!inner(display_word)")
    .eq("student_id", id)
    .eq("vocabulary_item_id", parsed.itemId)
    .single();
  if (error || !memory) throw new Error("Mot introuvable.");
  const item = memory.vocabulary_items as unknown as { display_word: string };
  const result = gradeTypedVocabularyRecall(parsed.answerText, item.display_word);
  const now = new Date();
  const attemptedAt = now.toISOString();
  const elapsed = memory.last_reviewed_at
    ? Math.max(0, (now.getTime() - Date.parse(memory.last_reviewed_at as string)) / 86_400_000)
    : 1;
  const previous = memory.stability && memory.difficulty
    ? { stability: Number(memory.stability), difficulty: Number(memory.difficulty) }
    : null;
  const next = scheduleFsrs(previous, result, elapsed, Number(memory.desired_retention ?? 0.9));
  const successful = result === "good" || result === "easy";
  let evidence = memory.evidence_counts && typeof memory.evidence_counts === "object"
    ? memory.evidence_counts as VocabularyEvidence
    : { ...EMPTY_VOCABULARY_EVIDENCE };
  evidence = recordVocabularyEvidence(evidence, "meaning_recall", { successful, occurredAt: attemptedAt });
  evidence = recordVocabularyEvidence(evidence, "correct_spelling", { successful, occurredAt: attemptedAt });
  const learning = vocabularyLearningState(evidence);
  const dueAt = new Date(now.getTime() + next.intervalDays * 86_400_000).toISOString();
  const { error: recordError } = await service.rpc("record_vocabulary_review", {
    p_student_id: id,
    p_item_id: parsed.itemId,
    p_result: result,
    p_stability: next.stability,
    p_difficulty: next.difficulty,
    p_next_review_at: dueAt,
    p_next_mastery: learning.mastery,
  });
  if (recordError) throw new Error(recordError.message);
  const evidenceRows = ["meaning_recall", "correct_spelling"].map((evidenceKind) => ({
    student_id: id,
    vocabulary_item_id: parsed.itemId,
    evidence_kind: evidenceKind,
    successful,
    typed_production: true,
    evidence_payload: { result },
    occurred_at: attemptedAt,
  }));
  const { error: evidenceError } = await service
    .from("vocabulary_learning_evidence")
    .insert(evidenceRows);
  if (evidenceError) throw new Error(evidenceError.message);
  const { error: updateError } = await service
    .from("student_word_mastery")
    .update({ evidence_counts: evidence, learning_status: learning.status })
    .eq("student_id", id)
    .eq("vocabulary_item_id", parsed.itemId);
  if (updateError) throw new Error(updateError.message);
  return { ok: true, dueAt, mastery: learning.mastery, status: learning.status, evidence, result };
}
