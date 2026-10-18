import type { SupabaseClient } from "@supabase/supabase-js";
import { loadDueWordsForDictation } from "./due-words";
import type { DictationMode } from "./modes";
import { DICTATION_PICKER, dictationNodes, type PickerAttempt, type PickerDictation, type PickerInput } from "./picker";
import { normalizeLemma, STUDENT_VISIBLE_DICTATION_STATUSES } from "./tags";

/**
 * Loads what the pure picker needs (roadmap 2026-10, G.5). Auxiliary reads
 * (interests, estimates, known words, due words) degrade to "unknown" on
 * failure so a student page never breaks because of the picker.
 */

export const PICKER_DICTATION_COLUMNS = "id,title_fr,kind,word_count,grade_min,grade_max,target_node_keys,grammar_node_keys,themes,interests,target_lemmas";

type PickerRow = {
  id: string; title_fr: string; kind: DictationMode; word_count: number; grade_min: number; grade_max: number;
  target_node_keys: string[] | null; grammar_node_keys?: string[] | null; themes?: string[] | null; interests?: string[] | null; target_lemmas?: string[] | null;
};

export function pickerDictationFromRow(row: PickerRow): PickerDictation {
  return {
    id: row.id, kind: row.kind, title: row.title_fr, wordCount: Number(row.word_count), gradeMin: Number(row.grade_min), gradeMax: Number(row.grade_max),
    targetNodeKeys: row.target_node_keys ?? [], grammarNodeKeys: row.grammar_node_keys ?? [], themes: row.themes ?? [], interests: row.interests ?? [], targetLemmas: row.target_lemmas ?? [],
  };
}

const MIN_TRACKED_WORDS = 20;

async function safe<T>(work: () => PromiseLike<T> | T, fallback: T): Promise<T> {
  try { return await work(); } catch { return fallback; }
}

export type DictationStudentContext = Omit<PickerInput, "dictations">;

/** Everything about the student the picker uses, for the given dictées. */
export async function loadDictationStudentContext(service: SupabaseClient, studentId: string, nowMs: number, dictations: readonly PickerDictation[]): Promise<DictationStudentContext> {
  const nodeKeys = [...new Set(dictations.flatMap(dictationNodes))];
  const [student, attempts, interests, mastery, knownLemmas, dueWords] = await Promise.all([
    service.from("students").select("current_grade").eq("id", studentId).single(),
    service.from("dictation_attempts").select("dictation_id,mode,submitted_at").eq("student_id", studentId).not("submitted_at", "is", null)
      .gte("submitted_at", new Date(nowMs - DICTATION_PICKER.recencyDays * 86_400_000).toISOString()).order("submitted_at", { ascending: false }),
    safe(async () => {
      const { data, error } = await service.from("student_interests").select("interest_key").eq("student_id", studentId);
      if (error) throw error;
      return (data ?? []).map((row) => row.interest_key as string);
    }, [] as string[]),
    safe(async () => {
      if (nodeKeys.length === 0) return new Map<string, number>();
      const { data: nodes, error: nodeError } = await service.from("competency_nodes").select("id,key").in("key", nodeKeys);
      if (nodeError) throw nodeError;
      const keyById = new Map((nodes ?? []).map((node) => [node.id as string, node.key as string]));
      if (keyById.size === 0) return new Map<string, number>();
      const { data: estimates, error } = await service.from("student_competency_estimates").select("node_id,mastery_probability").eq("student_id", studentId).in("node_id", [...keyById.keys()]);
      if (error) throw error;
      return new Map((estimates ?? []).flatMap((row) => {
        const key = keyById.get(row.node_id as string); const value = Number(row.mastery_probability);
        return key && Number.isFinite(value) ? [[key, value] as const] : [];
      }));
    }, new Map<string, number>()),
    safe(async () => {
      const { data, error } = await service.from("student_word_mastery").select("vocabulary_items(lemma)").eq("student_id", studentId).limit(5000);
      if (error) throw error;
      const lemmas = (data ?? []).flatMap((row) => {
        const item = row.vocabulary_items as unknown as { lemma: string } | { lemma: string }[] | null;
        return (Array.isArray(item) ? item : item ? [item] : []).map((entry) => normalizeLemma(entry.lemma));
      });
      // Too few tracked words says nothing about which words are new.
      return lemmas.length >= MIN_TRACKED_WORDS ? new Set(lemmas) : null;
    }, null as Set<string> | null),
    safe(() => loadDueWordsForDictation(service, studentId, nowMs), []),
  ]);
  if (attempts.error) throw new Error(attempts.error.message);
  const grade = Math.max(4, Math.min(12, Number(student.data?.current_grade ?? 7)));
  return {
    nowMs, grade, interests, masteryByNodeKey: mastery, knownLemmas, dueWords,
    attempts: (attempts.data ?? []).map((row): PickerAttempt => ({ dictationId: row.dictation_id as string, mode: row.mode as string, submittedAt: row.submitted_at as string })),
  };
}

/** Published dictées as picker rows (the picker applies the grade filter). */
export async function loadPickerDictations(service: SupabaseClient, requireReadyAudio: boolean): Promise<PickerDictation[]> {
  let query = service.from("dictations").select(PICKER_DICTATION_COLUMNS).in("review_status", [...STUDENT_VISIBLE_DICTATION_STATUSES]);
  if (requireReadyAudio) query = query.eq("audio_status", "ready");
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as PickerRow[]).map(pickerDictationFromRow);
}
