import { describe, expect, it, vi } from "vitest";
import type { PickerDictation } from "@/lib/dictation/picker";
import type { DictationStudentContext } from "@/lib/dictation/picker-data";
import { assessStudent, dictationDueSoon, libraryPoolFits, planDayBeforeJobs, runDayBeforeDictations, type DayBeforeCandidate } from "./day-before";
import type { LibraryJob, LibraryJobResult } from "./library-runner";

const NOW = Date.parse("2026-10-18T15:00:00Z");
const HOUR = 3_600_000;

const dictation = (id: string, interests: string[], grade = 6): PickerDictation => ({
  id, kind: "flash", title: id, wordCount: 40, gradeMin: grade, gradeMax: grade + 1,
  targetNodeKeys: [], grammarNodeKeys: [], themes: [], interests, targetLemmas: [],
});
const context = (overrides: Partial<DictationStudentContext> = {}): DictationStudentContext => ({
  nowMs: NOW, grade: 6, interests: ["manga"], masteryByNodeKey: new Map(), knownLemmas: null, dueWords: [{ lemmaId: "l1", lemma: "encre" }], attempts: [], ...overrides,
});

describe("day-before personalised dictées (H.16)", () => {
  it("a dictée is due when the 36 h spacing ends by tomorrow", () => {
    expect(dictationDueSoon(null, NOW)).toBe(true);
    expect(dictationDueSoon(NOW - 10 * HOUR, NOW)).toBe(true); // available in 26 h
    expect(dictationDueSoon(NOW, NOW)).toBe(false); // just done: available in 36 h
  });

  it("skips generation when the library pool already has a dictée on the student's interest", () => {
    expect(libraryPoolFits(context(), [dictation("d-manga", ["manga"])], NOW + 24 * HOUR).fits).toBe(true);
    expect(libraryPoolFits(context(), [dictation("d-foot", ["football"])], NOW + 24 * HOUR)).toEqual({ fits: false, dictationId: "d-foot" });
    expect(libraryPoolFits(context(), [], NOW + 24 * HOUR).fits).toBe(false);
  });

  it("assesses each student: no interest, not due, pool fits, or needs a dictée with their due words", () => {
    const pool = [dictation("d-foot", ["football"])];
    expect(assessStudent("s0", context({ interests: ["unknown_key"] }), pool, NOW)).toEqual({ studentId: "s0", reason: "no_interest" });
    expect(assessStudent("s1", context({ attempts: [{ dictationId: "x", mode: "flash", submittedAt: new Date(NOW - HOUR).toISOString() }] }), pool, NOW)).toEqual({ studentId: "s1", reason: "not_due" });
    expect(assessStudent("s2", context({ interests: ["football"] }), pool, NOW)).toEqual({ studentId: "s2", reason: "pool_fits" });
    expect(assessStudent("s3", context(), pool, NOW)).toEqual({ studentId: "s3", grade: 6, interests: ["manga"], dueLemmas: ["encre"] });
  });

  it("groups students by shared interest and grade, keeps their most shared due words, largest groups first", () => {
    const candidates: DayBeforeCandidate[] = [
      { studentId: "a", grade: 6, interests: ["manga", "football"], dueLemmas: ["encre", "ombre"] },
      { studentId: "b", grade: 6, interests: ["manga"], dueLemmas: ["encre", "x1"] },
      { studentId: "c", grade: 8, interests: ["animals"], dueLemmas: ["lisière"] },
      { studentId: "d", grade: 6, interests: ["football", "manga"], dueLemmas: [] },
    ];
    const jobs = planDayBeforeJobs(candidates, { maxJobs: 5 });
    expect(jobs.map((j) => `${j.job.interest}:${j.job.grade}:${j.studentIds.join("")}`)).toEqual(["manga:6:abd", "animals:8:c"]);
    expect(jobs[0].targetWords[0]).toEqual({ lemma: "encre", kind: "due" });
    expect(jobs[0].job).toMatchObject({ kind: "dictation", gradeBand: "6e-5e" });
    expect(planDayBeforeJobs(candidates, { maxJobs: 1 })).toHaveLength(1);
  });

  it("runs at most the daily budget, counting what was already spent today", async () => {
    const runJob = vi.fn(async (job: LibraryJob, options: { costCapUsd: number }): Promise<LibraryJobResult> => ({ job, decision: "publish", costUsd: Math.min(1.2, options.costCapUsd) }));
    const report = await runDayBeforeDictations({
      activeStudents: async () => ["a", "b", "c"],
      loadPool: async () => [],
      loadContext: async (id) => context({ interests: [id === "a" ? "manga" : id === "b" ? "football" : "animals"], grade: 6 }),
      spentToday: async () => 1,
      runJob, perJobCapUsd: 3, dailyBudgetUsd: 3, maxJobs: 5, now: () => NOW,
    });
    expect(report).toMatchObject({ students: 3, due: 3, poolFits: 0, needed: 3, stoppedBecause: "budget" });
    expect(runJob.mock.calls.map((c) => c[1].costCapUsd)).toEqual([2, expect.closeTo(0.8, 5)]);
    expect(report.spentUsd).toBeCloseTo(2, 5);
  });

  it("generates nothing when every due student already has a fitting dictée, and survives loader errors", async () => {
    const runJob = vi.fn();
    const report = await runDayBeforeDictations({
      activeStudents: async () => ["a", "broken"],
      loadPool: async () => [dictation("d-manga", ["manga"])],
      loadContext: async (id) => { if (id === "broken") throw new Error("db"); return context(); },
      spentToday: async () => 0, runJob, perJobCapUsd: 3, now: () => NOW,
    });
    expect(report).toMatchObject({ due: 1, poolFits: 1, needed: 0, jobs: [] });
    expect(runJob).not.toHaveBeenCalled();
  });
});
