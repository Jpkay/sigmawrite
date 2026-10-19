import type { SupabaseClient } from "@supabase/supabase-js";
import { DICTATION_PICKER, pickDailyDictation, type PickerDictation } from "@/lib/dictation/picker";
import type { DictationStudentContext } from "@/lib/dictation/picker-data";
import { INTEREST_BY_KEY } from "@/lib/content/interests";
import type { LibraryJob, LibraryJobResult } from "./library-runner";
import { tenseRotation } from "./library-runner";
import { pickStyle } from "./styles";
import { gradeBandFor, type TargetLemma } from "./types";

/**
 * Day-before personalised dictées (roadmap H.16). A dictée needs TTS audio
 * after its text is written, so it is generated the day before: once a day,
 * for active students whose next dictée falls by tomorrow, we ask the picker
 * what it would give them tomorrow. When the library pool already fits
 * (a dictée on one of their interests, inside the 15–30% error band, nothing
 * relaxed), nothing is generated. Otherwise the editorial pipeline writes one
 * dictée on their interest, for their grade, with their due words — then the
 * dictée goes through the same automatic approval and the hourly audio job.
 *
 * Students who share an interest and a grade share one generation. A daily
 * budget and a job limit cap the spend. Nothing personal reaches a model: the
 * brief carries an interest key, a grade and due lemmas only.
 */

export const DAY_BEFORE_DEFAULTS = {
  dailyBudgetUsd: Number(process.env.EDITORIAL_DICTEE_DAILY_BUDGET_USD ?? 3),
  maxJobs: Number(process.env.EDITORIAL_DICTEE_DAILY_MAX ?? 4),
  maxStudents: 300,
  activeDays: 7,
  /** "By tomorrow": the 36 h spacing ends within this horizon. */
  horizonHours: 30,
  runTag: "day_before",
};

export type DayBeforeCandidate = { studentId: string; grade: number; interests: string[]; dueLemmas: string[] };
export type DayBeforeSkip = { studentId: string; reason: "not_due" | "pool_fits" | "no_interest" };

/** True when the student's next dictée becomes available within the horizon (36 h after the last one). */
export function dictationDueSoon(lastAttemptMs: number | null, nowMs: number, horizonHours = DAY_BEFORE_DEFAULTS.horizonHours): boolean {
  if (lastAttemptMs === null) return true;
  return lastAttemptMs + DICTATION_PICKER.spacingHours * 3_600_000 <= nowMs + horizonHours * 3_600_000;
}

export type PoolCheck = { fits: boolean; dictationId: string | null };

/**
 * What tomorrow's picker would choose. The pool fits when a dictée matches an
 * interest without relaxing the error band or the recency rule.
 */
export function libraryPoolFits(context: DictationStudentContext, pool: readonly PickerDictation[], tomorrowMs: number): PoolCheck {
  // Spacing is evaluated for tomorrow; attempts stay as they are.
  const pick = pickDailyDictation({ ...context, nowMs: tomorrowMs, dictations: pool });
  if (!pick) return { fits: false, dictationId: null };
  return { fits: pick.parts.interest > 0 && pick.relaxed.length === 0, dictationId: pick.dictation.id };
}

/** Decides, for one student, whether a personalised dictée is needed. */
export function assessStudent(studentId: string, context: DictationStudentContext, pool: readonly PickerDictation[], nowMs: number): DayBeforeCandidate | DayBeforeSkip {
  const interests = context.interests.filter((key) => key in INTEREST_BY_KEY);
  if (interests.length === 0) return { studentId, reason: "no_interest" };
  const last = context.attempts.reduce<number | null>((max, a) => { const t = Date.parse(a.submittedAt); return Number.isFinite(t) && (max === null || t > max) ? t : max; }, null);
  if (!dictationDueSoon(last, nowMs)) return { studentId, reason: "not_due" };
  if (libraryPoolFits(context, pool, nowMs + DAY_BEFORE_DEFAULTS.horizonHours * 3_600_000).fits) return { studentId, reason: "pool_fits" };
  return { studentId, grade: context.grade, interests, dueLemmas: (context.dueWords ?? []).map((w) => w.lemma) };
}

export type DayBeforeJob = { job: LibraryJob; targetWords: TargetLemma[]; studentIds: string[] };

const SIMPLE_LEMMA = /^[\p{L}][\p{L}' -]{1,38}$/u;

/**
 * Groups candidates by (interest, grade): each group gets one dictée on the
 * interest that most of its students share, with the due words they share
 * most (≤ 5). Largest groups first, at most `maxJobs`.
 */
export function planDayBeforeJobs(candidates: readonly DayBeforeCandidate[], options: { maxJobs: number; styleHistory?: string[] }): DayBeforeJob[] {
  const interestVotes = new Map<string, number>();
  for (const c of candidates) for (const interest of c.interests) interestVotes.set(interest, (interestVotes.get(interest) ?? 0) + 1);
  const groups = new Map<string, { interest: string; grade: number; students: DayBeforeCandidate[] }>();
  for (const c of candidates) {
    // The student's most shared interest (ties: the student's own order).
    const interest = [...c.interests].sort((a, b) => (interestVotes.get(b) ?? 0) - (interestVotes.get(a) ?? 0))[0];
    const key = `${interest}:${c.grade}`;
    const group = groups.get(key) ?? { interest, grade: c.grade, students: [] };
    group.students.push(c);
    groups.set(key, group);
  }
  const history = [...(options.styleHistory ?? [])];
  return [...groups.values()]
    .sort((a, b) => b.students.length - a.students.length || a.grade - b.grade || a.interest.localeCompare(b.interest))
    .slice(0, Math.max(0, options.maxJobs))
    .map((group, index) => {
      const band = gradeBandFor(group.grade);
      const style = pickStyle(band, "dictation", history);
      history.push(style.key);
      const counts = new Map<string, number>();
      for (const s of group.students) for (const lemma of new Set(s.dueLemmas)) if (SIMPLE_LEMMA.test(lemma)) counts.set(lemma, (counts.get(lemma) ?? 0) + 1);
      const lemmas = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5).map(([lemma]) => ({ lemma, kind: "due" as const }));
      return {
        job: { kind: "dictation" as const, interest: group.interest, grade: group.grade, gradeBand: band, tenses: tenseRotation(band, index + group.grade), styleKey: style.key },
        targetWords: lemmas,
        studentIds: group.students.map((s) => s.studentId),
      };
    });
}

export type DayBeforeDeps = {
  activeStudents: () => Promise<string[]>;
  loadPool: () => Promise<PickerDictation[]>;
  loadContext: (studentId: string, pool: readonly PickerDictation[]) => Promise<DictationStudentContext>;
  spentToday: () => Promise<number>;
  runJob: (job: LibraryJob, options: { targetWords: TargetLemma[]; costCapUsd: number }) => Promise<LibraryJobResult>;
  /** Cost cap of one library text. */
  perJobCapUsd: number;
  dailyBudgetUsd?: number;
  maxJobs?: number;
  now?: () => number;
};

export type DayBeforeReport = {
  students: number; due: number; poolFits: number; needed: number;
  jobs: Array<{ interest: string; grade: number; students: number; decision: string; reason?: string; costUsd: number }>;
  spentUsd: number; stoppedBecause: "done" | "budget" | "no_pool";
};

export async function runDayBeforeDictations(deps: DayBeforeDeps): Promise<DayBeforeReport> {
  const nowMs = (deps.now ?? Date.now)();
  const budget = deps.dailyBudgetUsd ?? DAY_BEFORE_DEFAULTS.dailyBudgetUsd;
  const studentIds = (await deps.activeStudents()).slice(0, DAY_BEFORE_DEFAULTS.maxStudents);
  const pool = await deps.loadPool();
  const candidates: DayBeforeCandidate[] = [];
  let due = 0; let poolFits = 0;
  for (const studentId of studentIds) {
    let verdict: DayBeforeCandidate | DayBeforeSkip;
    try { verdict = assessStudent(studentId, await deps.loadContext(studentId, pool), pool, nowMs); } catch { continue; }
    if ("reason" in verdict) {
      if (verdict.reason === "pool_fits") { due += 1; poolFits += 1; }
      continue;
    }
    due += 1;
    candidates.push(verdict);
  }
  const report: DayBeforeReport = { students: studentIds.length, due, poolFits, needed: candidates.length, jobs: [], spentUsd: 0, stoppedBecause: "done" };
  let spent = await deps.spentToday();
  for (const planned of planDayBeforeJobs(candidates, { maxJobs: deps.maxJobs ?? DAY_BEFORE_DEFAULTS.maxJobs })) {
    const remaining = budget - spent;
    if (remaining < Math.min(0.25, deps.perJobCapUsd)) { report.stoppedBecause = "budget"; break; }
    let result: LibraryJobResult;
    try { result = await deps.runJob(planned.job, { targetWords: planned.targetWords, costCapUsd: Math.min(deps.perJobCapUsd, remaining) }); } catch (error) {
      result = { job: planned.job, decision: "discard", reason: `error:${error instanceof Error ? error.message.slice(0, 120) : "unknown"}`, costUsd: 0 };
    }
    spent += result.costUsd;
    report.spentUsd = Math.round((report.spentUsd + result.costUsd) * 100_000) / 100_000;
    report.jobs.push({ interest: planned.job.interest, grade: planned.job.grade, students: planned.studentIds.length, decision: result.decision, reason: result.reason, costUsd: result.costUsd });
  }
  return report;
}

/** Service-role loaders for the job route. */
export async function loadActiveStudentIds(db: SupabaseClient, nowMs: number, days = DAY_BEFORE_DEFAULTS.activeDays): Promise<string[]> {
  const since = new Date(nowMs - days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await db.from("student_daily_activity").select("student_id").gte("activity_date", since).limit(5000);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((row) => row.student_id as string))];
}

/** Today's spend of day-before runs (UTC day), from editorial_runs. */
export async function dayBeforeSpentToday(db: SupabaseClient, nowMs: number): Promise<number> {
  const start = new Date(nowMs); start.setUTCHours(0, 0, 0, 0);
  const { data, error } = await db.from("editorial_runs").select("cost_usd").eq("mode", "library").eq("kind", "dictation")
    .eq("brief->>runTag", DAY_BEFORE_DEFAULTS.runTag).gte("created_at", start.toISOString()).limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((total, row) => total + Number(row.cost_usd ?? 0), 0);
}
