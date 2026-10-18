import type { SupabaseClient } from "@supabase/supabase-js";
import type { DueWordInput } from "./picker";

export type { DueWordInput } from "./picker";

/**
 * Source of the words due for review that the dictée picker should favour
 * (roadmap 2026-10, G.5 `due_word_overlap`). The vocabulary memory stream
 * (Phases B–D) owns the schedule and replaces this body; until then no word
 * is due and the term contributes nothing. Must never throw on a student page:
 * return [] on any failure.
 */
export type LoadDueWords = (service: SupabaseClient, studentId: string, nowMs: number) => Promise<DueWordInput[]>;

export const loadDueWordsForDictation: LoadDueWords = async () => [];
