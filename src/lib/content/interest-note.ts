import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeedText } from "./types";
import { interestPickReasonFr, interestPreparingFr, interestsWithoutContent, matchInterest } from "./interest-matching";
import { PUBLISHED_TEXT_STATUSES } from "./interest-coverage-load";

/** Adds the interest reason to each recommended text (null when unrelated). */
export function withInterestReasons<T extends SeedText>(texts: readonly T[], interests: readonly string[]): Array<T & { pickReasonFr: string | null }> {
  return texts.map((text) => ({ ...text, pickReasonFr: interestPickReasonFr(matchInterest(text.primaryInterest, interests)) }));
}

/**
 * Roadmap E.5: "On prépare des textes sur les mangas." for the student's
 * interests that have no published passage yet. Null when every interest has
 * at least one text.
 */
export async function loadInterestPreparingNote(supabase: SupabaseClient, studentId: string): Promise<string | null> {
  const [{ data: declared, error: declaredError }, { data: published, error: publishedError }] = await Promise.all([
    supabase.from("student_interests").select("interest_key").eq("student_id", studentId),
    supabase.from("text_versions").select("texts!inner(primary_interest,status)")
      .in("review_status", [...PUBLISHED_TEXT_STATUSES]).eq("texts.status", "active"),
  ]);
  if (declaredError || publishedError) throw new Error(declaredError?.message ?? publishedError?.message);
  const interests = (declared ?? []).map((row) => row.interest_key as string);
  const available = (published ?? []).map((row) => (row.texts as unknown as { primary_interest: string | null } | null)?.primary_interest ?? null);
  return interestPreparingFr(interestsWithoutContent(interests, available));
}
