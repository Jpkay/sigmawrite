import { describe, expect, it } from "vitest";
import type { InterestCoverageGap } from "@/lib/content/interest-coverage";
import { newBulkState, planBulkCells, resumeBulkState, runBulk, type BulkState } from "./bulk";
import type { LibraryJob, LibraryJobResult } from "./library-runner";

const gaps: InterestCoverageGap[] = [
  { interest: "manga", type: "passage", cell: "cm", have: 4, need: 6, missing: 2 },
  { interest: "manga", type: "practice", cell: "conjugaison", have: 0, need: 20, missing: 20 },
  { interest: "manga", type: "dictation", cell: "7", have: 2, need: 3, missing: 1 },
  { interest: "manga", type: "dictation", cell: "13", have: 0, need: 3, missing: 3 },
];

function results(script: Array<"publish" | "discard" | Error>, cost = 1) {
  const calls: Array<{ job: LibraryJob; cap: number }> = [];
  let i = 0;
  const runJob = async (job: LibraryJob, cap: number): Promise<LibraryJobResult> => {
    calls.push({ job, cap });
    const step = script[Math.min(i++, script.length - 1)];
    if (step instanceof Error) throw step;
    const spent = Math.min(cost, cap); // the job's meter stops at its cap
    return step === "publish" ? { job, decision: "publish", libraryItemId: `item-${i}`, costUsd: spent } : { job, decision: "discard", reason: "rubric_below_4.3", costUsd: spent };
  };
  return { calls, runJob };
}

describe("bulk library production (E.3)", () => {
  it("turns coverage gaps into cells in order, skipping practice and invalid grades, then adds fallback chapters", () => {
    const cells = planBulkCells(gaps, { fallback: { interests: ["manga"], existing: [{ interest: "manga", gradeBand: "cm" }], perCell: 2 } });
    expect(cells.map((c) => `${c.key}:${c.missing}`)).toEqual([
      "passage:manga:cm:2", "dictation:manga:7:1",
      "fallback_chapter:manga:cm:1", "fallback_chapter:manga:6e-5e:2", "fallback_chapter:manga:4e-3e:2", "fallback_chapter:manga:lycee:2",
    ]);
    expect(cells[1]).toMatchObject({ grade: 7, gradeBand: "6e-5e" });
    expect(planBulkCells(gaps, { kinds: ["dictation"] }).map((c) => c.kind)).toEqual(["dictation"]);
  });

  it("stops before the budget is exceeded and never gives a job more than what is left", async () => {
    const state = newBulkState(2.5);
    const { calls, runJob } = results(["publish"]);
    const saved: BulkState[] = [];
    const summary = await runBulk(planBulkCells(gaps), state, { runJob, save: (s) => { saved.push(structuredClone(s)); }, perJobCapUsd: 3, minJobBudgetUsd: 0.6 });
    expect(summary.stoppedBecause).toBe("budget");
    expect(calls.map((c) => c.cap)).toEqual([2.5, 1.5]);
    expect(state.spentUsd).toBe(2);
    expect(saved.length).toBeGreaterThanOrEqual(2);
  });

  it("resumes from a saved state: spend carries over and published cells are not redone", async () => {
    const first = newBulkState(10);
    const run1 = results(["publish"]);
    await runBulk(planBulkCells(gaps), first, { runJob: run1.runJob, save: () => {}, perJobCapUsd: 3, maxJobs: 1 });
    const resumed = resumeBulkState(JSON.parse(JSON.stringify(first)), 10);
    expect(resumed.spentUsd).toBe(1);
    // The database now counts one more manga passage: the cell asks for 1, not 2.
    const fresh = planBulkCells([{ ...gaps[0], have: 5, missing: 1 }, gaps[2]]);
    const run2 = results(["publish"]);
    const summary = await runBulk(fresh, resumed, { runJob: run2.runJob, save: () => {}, perJobCapUsd: 3 });
    expect(run2.calls.map((c) => c.job.kind)).toEqual(["passage", "dictation"]);
    expect(summary.state.spentUsd).toBe(3);
    expect(summary.state.cells["passage:manga:cm"].published).toBe(2);
    expect(resumeBulkState({ garbage: true }, 5).spentUsd).toBe(0);
  });

  it("leaves a cell alone after repeated failures, including infrastructure errors", async () => {
    const state = newBulkState(100);
    const { calls, runJob } = results(["discard", new Error("network down"), "discard", "publish"]);
    const summary = await runBulk(planBulkCells([gaps[2]]), state, { runJob, save: () => {}, perJobCapUsd: 3, maxAttemptsPerCell: 3 });
    expect(calls).toHaveLength(3);
    expect(summary).toMatchObject({ published: 0, discarded: 3, stoppedBecause: "plan_complete" });
    expect(state.cells["dictation:manga:7"].lastReason).toBe("rubric_below_4.3");
  });

  it("rotates styles and tenses inside the band's curriculum", async () => {
    const state = newBulkState(100);
    const { calls, runJob } = results(["publish"], 0.5);
    await runBulk(planBulkCells([{ ...gaps[0], missing: 3 }]), state, { runJob, save: () => {}, perJobCapUsd: 3 });
    expect(new Set(calls.map((c) => c.job.styleKey)).size).toBeGreaterThan(1);
    expect(calls.every((c) => ["present", "passe_compose", "imparfait", "futur_simple"].includes(c.job.tenses[0]))).toBe(true);
  });
});
