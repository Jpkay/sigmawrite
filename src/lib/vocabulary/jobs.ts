import "server-only";
/**
 * Background jobs for word memory:
 *  - weekly memory-quality report + PostHog events (C.6);
 *  - offline FSRS parameter fitting with calibration report (C.3).
 * Run through withJobRun (src/lib/jobs.ts) from /api/jobs/* cron routes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { trackServer } from "@/lib/analytics-server";
import { addDays, localDay } from "./days";
import {
  calibration,
  cohortForGrade,
  DEFAULT_PARAMS_VERSION,
  FSRS_FIT_RULES,
  holdoutCalibration,
  holdoutSplit,
  predictHistory,
  shouldAdopt,
  UNAVAILABLE_OPTIMIZER,
  type CohortKey,
  type FsrsOptimizer,
  type ReviewEvent,
} from "./fsrs-params";
import { buildMemoryReport, reportEvents, type ReportLogRow } from "./memory-report";
import type { WordFacet } from "./types";
import { default_w } from "ts-fsrs";
import type { FsrsGrade } from "@/lib/scoring/fsrs";

type Db = SupabaseClient;
const PAGE = 1000;

async function pagedLog(db: Db, since: string, until: string, columns: string) {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("word_review_log").select(columns).gte("reviewed_at", since).lt("reviewed_at", until).order("reviewed_at", { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/** C.6: report for the week ending at `now` (Monday 00:00 Paris → Monday). */
export async function runWordMemoryReport(db: Db, now = new Date()) {
  const weekEnd = localDay(now);
  const weekStart = addDays(weekEnd, -7);
  const rows = await pagedLog(db, `${weekStart}T00:00:00Z`, `${weekEnd}T00:00:00Z`, "student_id,lexical_sense_id,facet,reviewed_at,rating,counts_for_fsrs,elapsed_days,retrievability_before,response_ms");
  const weekRows: ReportLogRow[] = rows.map((row) => ({
    studentId: row.student_id as string, senseId: row.lexical_sense_id as string, facet: row.facet as WordFacet,
    reviewedAt: row.reviewed_at as string, rating: Number(row.rating), countsForFsrs: !!row.counts_for_fsrs,
    elapsedDays: row.elapsed_days == null ? null : Number(row.elapsed_days),
    retrievabilityBefore: row.retrievability_before == null ? null : Number(row.retrievability_before),
    responseMs: row.response_ms == null ? null : Number(row.response_ms),
  }));
  // Reviews needed per word that reached Maîtrisé/Ancré during the week.
  const { data: mastered, error } = await db.from("student_word_mastery").select("student_id,vocabulary_item_id").in("word_status", ["maitrise", "ancre"]).gte("status_updated_at", `${weekStart}T00:00:00Z`).limit(5000);
  if (error) throw new Error(error.message);
  const masteredSenseReviews: number[] = [];
  for (const row of mastered ?? []) {
    const { count } = await db.from("vocabulary_learning_evidence").select("id", { count: "exact", head: true })
      .eq("student_id", row.student_id as string).eq("vocabulary_item_id", row.vocabulary_item_id as string).not("review_log_id", "is", null);
    masteredSenseReviews.push(count ?? 0);
  }
  const report = buildMemoryReport({ weekStart, weekEnd, weekRows, masteredSenseReviews });
  const { error: upsertError } = await db.from("word_memory_reports").upsert({ week_start: weekStart, report, generated_at: new Date().toISOString() }, { onConflict: "week_start" });
  if (upsertError) throw new Error(upsertError.message);
  for (const properties of reportEvents(report)) await trackServer("system:word-memory", "word_memory_weekly_report", properties);
  return { report, processed: weekRows.length };
}

type FitGroup = { key: string; scope: "cohort" | "student"; cohortKey: CohortKey | null; studentId: string | null; facet: WordFacet; events: ReviewEvent[] };

/**
 * C.3: fits per age group × trace (≥ 5,000 reviews) and per student
 * (≥ 1,000 reviews), compares default / current / fitted on held-out
 * reviews, stores fitted sets as candidates, activates them only if they
 * predict better, and always writes a calibration report.
 */
export async function runFsrsCalibration(db: Db, optimizer: FsrsOptimizer = UNAVAILABLE_OPTIMIZER, now = new Date()) {
  const since = new Date(now.getTime() - 730 * 86_400_000).toISOString();
  const rows = await pagedLog(db, since, now.toISOString(), "student_id,schedule_id,facet,reviewed_at,rating,counts_for_fsrs");
  const events: ReviewEvent[] = rows.filter((row) => row.counts_for_fsrs).map((row) => ({
    cardId: row.schedule_id as string, studentId: row.student_id as string, facet: row.facet as WordFacet, at: row.reviewed_at as string, rating: Number(row.rating) as FsrsGrade,
  }));
  const studentIds = [...new Set(events.map((event) => event.studentId))];
  const grades = new Map<string, number | null>();
  for (let index = 0; index < studentIds.length; index += 500) {
    const { data, error } = await db.from("students").select("id,current_grade").in("id", studentIds.slice(index, index + 500));
    if (error) throw new Error(error.message);
    for (const row of data ?? []) grades.set(row.id as string, row.current_grade == null ? null : Number(row.current_grade));
  }
  const { data: activeSets, error: setsError } = await db.from("fsrs_parameter_sets").select("version,scope,cohort_key,facet,student_id,weights").eq("status", "active");
  if (setsError) throw new Error(setsError.message);

  const groups = new Map<string, FitGroup>();
  const add = (group: Omit<FitGroup, "events">, event: ReviewEvent) => {
    const existing = groups.get(group.key) ?? { ...group, events: [] };
    existing.events.push(event);
    groups.set(group.key, existing);
  };
  for (const event of events) {
    const cohortKey = cohortForGrade(grades.get(event.studentId));
    add({ key: `cohort:${cohortKey}:${event.facet}`, scope: "cohort", cohortKey, studentId: null, facet: event.facet }, event);
    add({ key: `student:${event.studentId}:${event.facet}`, scope: "student", cohortKey: null, studentId: event.studentId, facet: event.facet }, event);
  }

  const results: Record<string, unknown>[] = [];
  for (const group of groups.values()) {
    const minimum = group.scope === "cohort" ? FSRS_FIT_RULES.cohortMinReviews : FSRS_FIT_RULES.studentMinReviews;
    if (group.scope === "student" && group.events.length < minimum) continue;
    const current = (activeSets ?? []).find((set) => set.facet === group.facet && set.scope === group.scope
      && (group.scope === "cohort" ? set.cohort_key === group.cohortKey : set.student_id === group.studentId));
    const currentWeights = current && Array.isArray(current.weights) ? (current.weights as unknown[]).map(Number) : null;
    const entry: Record<string, unknown> = {
      group: group.scope === "student" ? `student:${group.facet}` : group.key, reviews: group.events.length,
      default: summary(calibration(predictHistory(group.events, default_w))),
      ...(currentWeights ? { current: { version: current!.version, ...summary(calibration(predictHistory(group.events, currentWeights))) } } : {}),
    };
    if (group.events.length >= minimum && optimizer.available) {
      const split = holdoutSplit(group.events);
      const fitted = await optimizer.fit(split.train);
      if (fitted && fitted.length === 21) {
        const baseline = holdoutCalibration(group.events, currentWeights ?? default_w, split.boundary);
        const candidate = holdoutCalibration(group.events, fitted, split.boundary);
        const adopt = shouldAdopt(baseline, candidate);
        const version = `fsrs6-${group.scope}-${group.cohortKey ?? group.studentId}-${group.facet}-${now.toISOString().slice(0, 10)}`;
        if (adopt) {
          const retire = db.from("fsrs_parameter_sets").update({ status: "retired" }).eq("status", "active").eq("scope", group.scope).eq("facet", group.facet);
          const { error } = await (group.scope === "cohort" ? retire.eq("cohort_key", group.cohortKey!) : retire.eq("student_id", group.studentId!));
          if (error) throw new Error(error.message);
        }
        const { error } = await db.from("fsrs_parameter_sets").upsert({
          version, scope: group.scope, cohort_key: group.cohortKey, facet: group.facet, student_id: group.studentId, weights: fitted,
          optimizer: optimizer.name, review_count: group.events.length, holdout_log_loss_default: baseline.logLoss, holdout_log_loss_fitted: candidate.logLoss,
          calibration: { holdoutCurrent: summary(baseline), holdoutFitted: summary(candidate) },
          status: adopt ? "active" : "rejected", activated_at: adopt ? now.toISOString() : null,
        }, { onConflict: "version" });
        if (error) throw new Error(error.message);
        entry.fitted = { version, adopted: adopt, holdoutCurrent: summary(baseline), holdoutFitted: summary(candidate) };
      }
    } else {
      entry.fit = group.events.length < minimum ? "not_enough_reviews" : "optimizer_unavailable";
    }
    results.push(entry);
  }
  const optimizerStatus = optimizer.available ? optimizer.name : "optimizer_unavailable";
  const report = { generatedAt: now.toISOString(), defaultVersion: DEFAULT_PARAMS_VERSION, totalReviews: events.length, students: studentIds.length, groups: results };
  const { error } = await db.from("fsrs_calibration_reports").insert({ optimizer_status: optimizerStatus, report });
  if (error) throw new Error(error.message);
  return { report, processed: events.length };
}

function summary(value: ReturnType<typeof calibration>) {
  return { count: value.count, logLoss: value.logLoss, rmseBins: value.rmseBins, bins: value.bins };
}
