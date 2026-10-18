import type { SupabaseClient } from "@supabase/supabase-js";
import { cardRetrievability } from "@/lib/vocabulary/card-scheduler";
import type { DueWordInput } from "./picker";

export type { DueWordInput } from "./picker";

/**
 * Words due for review that the dictée picker should favour (roadmap 2026-10,
 * G.5 `due_word_overlap`): lemmas whose spelling or meaning card is due by
 * tomorrow, lowest retrievability first. Must never throw on a student page:
 * returns [] on any failure.
 */
export type LoadDueWords = (service: SupabaseClient, studentId: string, nowMs: number) => Promise<DueWordInput[]>;

const HORIZON_MS = 86_400_000;
const LIMIT = 30;

export const loadDueWordsForDictation: LoadDueWords = async (service, studentId, nowMs) => {
  try {
    const { data: cards, error } = await service.from("learning_retrieval_schedules")
      .select("target_id,fsrs_state,last_reviewed_at,due_at")
      .eq("student_id", studentId).eq("target_type", "lexical_sense").neq("status", "retired")
      .lte("due_at", new Date(nowMs + HORIZON_MS).toISOString()).limit(500);
    if (error || !cards?.length) return [];
    const senseIds = [...new Set(cards.map((card) => card.target_id as string))];
    const { data: senses, error: senseError } = await service.from("lexical_senses").select("id,lemma_id,lexical_lemmas!inner(normalized_lemma)").in("id", senseIds);
    if (senseError || !senses) return [];
    const lemmaOf = new Map(senses.map((sense) => [sense.id as string, { lemmaId: sense.lemma_id as string, lemma: (sense.lexical_lemmas as unknown as { normalized_lemma: string }).normalized_lemma }]));
    const byLemma = new Map<string, DueWordInput>();
    for (const card of cards) {
      const lemma = lemmaOf.get(card.target_id as string);
      if (!lemma) continue;
      const state = (card.fsrs_state ?? {}) as { stability?: number; difficulty?: number };
      const retrievability = cardRetrievability({ stability: state.stability ?? null, difficulty: state.difficulty ?? null, lastReviewedAt: (card.last_reviewed_at as string | null) ?? null }, new Date(nowMs));
      const existing = byLemma.get(lemma.lemmaId);
      if (!existing || retrievability < (existing.retrievability ?? 1)) byLemma.set(lemma.lemmaId, { ...lemma, retrievability });
    }
    return [...byLemma.values()].sort((a, b) => (a.retrievability ?? 0) - (b.retrievability ?? 0)).slice(0, LIMIT);
  } catch {
    return [];
  }
};
