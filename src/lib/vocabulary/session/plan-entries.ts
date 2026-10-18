/**
 * Daily session glue (roadmap 2026-10 D.2): due word cards in, "Rappel
 * éclair" plan entries out. The entry never shows how many words are due
 * (rule 4); the burst page pulls the next due words itself.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DueWordReview, SessionActivity } from "@/lib/learning/session-plan";

export const WORD_PLAN_ENABLED = () => process.env.WORD_SESSION_ENABLED !== "false";

export type WordPlanInput = { dueWords: DueWordReview[]; newWords: number };

/** Best effort: a failure means no words today, never a broken home page. */
export async function loadDueWordsForPlan(db: SupabaseClient, studentId: string, now?: string): Promise<WordPlanInput> {
  if (!WORD_PLAN_ENABLED()) return { dueWords: [], newWords: 0 };
  try {
    const { getDueWordCards } = await import("../server");
    const plan = await getDueWordCards(db, studentId, now ? { now } : {});
    if (plan.paused) return { dueWords: [], newWords: 0 };
    return {
      dueWords: plan.reviews.filter((review) => review.word && review.definition).map((review) => ({ cardId: review.id, senseId: review.senseId, facet: review.facet, retrievability: review.retrievability })),
      newWords: plan.toIntroduce.filter((word) => word.definition).length,
    };
  } catch (error) {
    const { captureError } = await import("@/lib/observability");
    captureError(error, { area: "word_memory", label: "session_plan" });
    return { dueWords: [], newWords: 0 };
  }
}

export const WORD_PLAN_LABEL = "Tes mots, en un éclair";

export function wordBurstHref(activity: Extract<SessionActivity, { type: "review_word" }>, index: number): string {
  return `/student/vocabulary/rappel?n=${activity.senses}&nouveaux=${activity.newWords}&etape=${index}`;
}

/**
 * Same weaving for already-built entries (the granular path): each word
 * entry goes after an entry, spread evenly, never first and never two side
 * by side. Extra word entries (more than gaps) are left for later.
 */
export function weaveWordEntries<T>(entries: T[], words: T[]): T[] {
  if (!words.length) return entries;
  if (!entries.length) return words.slice(0, 1);
  const slots = Math.min(words.length, entries.length);
  const after = new Map<number, T>();
  for (let index = 0; index < slots; index++) after.set(Math.floor((index * entries.length) / slots), words[index]);
  return entries.flatMap((entry, index) => (after.has(index) ? [entry, after.get(index)!] : [entry]));
}
