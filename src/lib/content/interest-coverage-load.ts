import type { SupabaseClient } from "@supabase/supabase-js";
import { coverageCountsFromRows, type InterestCoverageCounts, type InterestCoverageRows } from "./interest-coverage";

/**
 * Reads the content rows that E.2 counts. Read-only; takes any client so the
 * launch audit (service key) and server pages share it. Deliberately not
 * `server-only` so `tsx scripts/*.mts` can import it.
 *
 * Dictée interest tags arrive with roadmap G.1 (`dictations.interests`). Until
 * that column exists the dictée counts are empty and `dictationTagsAvailable`
 * is false, which keeps every interest "uncovered" for dictées.
 */
export const PUBLISHED_TEXT_STATUSES = ["human_approved", "benchmark_locked", "auto_approved"] as const;
export const APPROVED_ITEM_STATUSES = ["human_approved", "auto_approved"] as const;
export const APPROVED_DICTATION_STATUSES = ["human_approved", "auto_approved"] as const;

const PAGE = 1000;

async function paged<T>(fetch: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await fetch(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function loadInterestCoverageRows(db: SupabaseClient): Promise<InterestCoverageRows & { dictationTagsAvailable: boolean }> {
  const passages = await paged<{ difficulty_band: string | null; texts: { primary_interest: string | null } | null }>((from, to) =>
    db.from("text_versions")
      .select("difficulty_band,texts!inner(primary_interest,status)")
      .in("review_status", [...PUBLISHED_TEXT_STATUSES])
      .eq("texts.status", "active")
      .order("id")
      .range(from, to) as never);
  const practice = await paged<{ strand: string | null; validator_config: Record<string, unknown> | null }>((from, to) =>
    db.from("competency_items")
      .select("strand,validator_config")
      .in("review_status", [...APPROVED_ITEM_STATUSES])
      .not("validator_config->interestKeys", "is", null)
      .order("id")
      .range(from, to) as never);
  let dictationTagsAvailable = true;
  let dictations: Array<{ interests: unknown; grade_min: number; grade_max: number }> = [];
  try {
    dictations = await paged((from, to) =>
      db.from("dictations")
        .select("interests,grade_min,grade_max")
        .in("review_status", [...APPROVED_DICTATION_STATUSES])
        .order("id")
        .range(from, to) as never);
  } catch {
    // Column added by roadmap G.1; absent until that migration lands.
    dictationTagsAvailable = false;
  }
  return {
    passages: passages.map((row) => ({ interest: row.texts?.primary_interest ?? null, difficultyBand: row.difficulty_band })),
    practice: practice.map((row) => ({ interestKeys: stringList(row.validator_config?.interestKeys), strand: row.strand })),
    dictations: dictations.map((row) => ({ interests: stringList(row.interests), gradeMin: Number(row.grade_min), gradeMax: Number(row.grade_max) })),
    dictationTagsAvailable,
  };
}

export async function loadInterestCoverageCounts(db: SupabaseClient): Promise<InterestCoverageCounts & { dictationTagsAvailable: boolean }> {
  const rows = await loadInterestCoverageRows(db);
  return { ...coverageCountsFromRows(rows), dictationTagsAvailable: rows.dictationTagsAvailable };
}

/** student_interests counts per interest key (E.1 demand). Service key only: RLS hides other students. */
export async function loadInterestDemand(db: SupabaseClient): Promise<Record<string, number>> {
  const rows = await paged<{ interest_key: string }>((from, to) =>
    db.from("student_interests").select("interest_key").order("student_id").order("interest_key").range(from, to) as never);
  const demand: Record<string, number> = {};
  for (const row of rows) demand[row.interest_key] = (demand[row.interest_key] ?? 0) + 1;
  return demand;
}
