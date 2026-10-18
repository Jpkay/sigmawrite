import type { InterestCoverageGap } from "@/lib/content/interest-coverage";
import type { LibraryJob, LibraryJobResult } from "./library-runner";
import { tenseRotation } from "./library-runner";
import { pickStyle } from "./styles";
import { gradeBandFor, type GradeBand } from "./types";

/**
 * Library-mode bulk production (roadmap E.3, G.3, H.14): fills the interest
 * coverage gaps (missingInterestCoverage, src/lib/content/interest-coverage.ts)
 * cell by cell — passages per interest × age band, dictées per interest ×
 * grade, fallback chapters per interest × band — under one total budget.
 *
 * Resumable: coverage is re-read from the database at every start, and a
 * small state (spend, attempts and results per cell) is saved after every
 * text, so a stopped run continues where it stopped, the budget counts every
 * run, and a cell that keeps failing is left alone after `maxAttemptsPerCell`.
 * Driven by scripts/editorial-bulk.mts.
 */

export type BulkCellKind = "passage" | "dictation" | "fallback_chapter";
export type BulkCell = { key: string; kind: BulkCellKind; interest: string; grade: number; gradeBand: GradeBand; missing: number };

export type BulkCellState = { attempts: number; published: number; discarded: number; spentUsd: number; lastReason?: string; refs: unknown[] };
export type BulkState = { version: 1; budgetUsd: number; spentUsd: number; startedAt: string; updatedAt: string; cells: Record<string, BulkCellState>; stoppedBecause?: string };

const PASSAGE_CELL: Record<string, { band: GradeBand; grade: number }> = { cm: { band: "cm", grade: 5 }, "6e_5e": { band: "6e-5e", grade: 6 }, "4e_3e": { band: "4e-3e", grade: 8 }, lycee: { band: "lycee", grade: 10 } };
const FALLBACK_GRADE: Record<GradeBand, number> = { cm: 5, "6e-5e": 6, "4e-3e": 8, lycee: 10 };

/**
 * Cells in production order: the coverage order (most-demanded interest first,
 * passages before dictées, youngest first), then fallback chapters. Themed
 * practice gaps are produced by the practice generator, not here.
 */
export function planBulkCells(gaps: readonly InterestCoverageGap[], options: { fallback?: { interests: readonly string[]; existing: ReadonlyArray<{ interest: string; gradeBand: string }>; perCell: number }; kinds?: readonly BulkCellKind[] } = {}): BulkCell[] {
  const kinds = new Set(options.kinds ?? ["passage", "dictation", "fallback_chapter"]);
  const cells: BulkCell[] = [];
  for (const gap of gaps) {
    if (gap.type === "passage" && kinds.has("passage")) {
      const target = PASSAGE_CELL[gap.cell];
      if (target) cells.push({ key: `passage:${gap.interest}:${gap.cell}`, kind: "passage", interest: gap.interest, grade: target.grade, gradeBand: target.band, missing: gap.missing });
    } else if (gap.type === "dictation" && kinds.has("dictation")) {
      const grade = Number(gap.cell);
      if (Number.isInteger(grade) && grade >= 4 && grade <= 12) cells.push({ key: `dictation:${gap.interest}:${grade}`, kind: "dictation", interest: gap.interest, grade, gradeBand: gradeBandFor(grade), missing: gap.missing });
    }
  }
  if (options.fallback && kinds.has("fallback_chapter")) {
    for (const band of ["cm", "6e-5e", "4e-3e", "lycee"] as GradeBand[]) {
      for (const interest of options.fallback.interests) {
        const have = options.fallback.existing.filter((e) => e.interest === interest && e.gradeBand === band).length;
        if (have < options.fallback.perCell) cells.push({ key: `fallback_chapter:${interest}:${band}`, kind: "fallback_chapter", interest, grade: FALLBACK_GRADE[band], gradeBand: band, missing: options.fallback.perCell - have });
      }
    }
  }
  return cells;
}

export function newBulkState(budgetUsd: number, now = new Date()): BulkState {
  return { version: 1, budgetUsd, spentUsd: 0, startedAt: now.toISOString(), updatedAt: now.toISOString(), cells: {} };
}

/** A saved state keeps its spend; a new --budget only raises or lowers the ceiling. */
export function resumeBulkState(saved: unknown, budgetUsd: number, now = new Date()): BulkState {
  const state = saved as Partial<BulkState> | null;
  if (!state || state.version !== 1 || typeof state.spentUsd !== "number" || typeof state.cells !== "object" || !state.cells) return newBulkState(budgetUsd, now);
  return { ...(state as BulkState), budgetUsd, stoppedBecause: undefined };
}

export type BulkDeps = {
  /** Runs one library job with a cost cap (runLibraryJob in production). */
  runJob: (job: LibraryJob, costCapUsd: number) => Promise<LibraryJobResult>;
  save: (state: BulkState) => Promise<void> | void;
  log?: (line: string) => void;
  /** Cost cap of one text (library default $3); the job never gets more than what is left of the budget. */
  perJobCapUsd: number;
  /** Below this remaining budget no new text is started (a text needs several model calls). */
  minJobBudgetUsd?: number;
  maxAttemptsPerCell?: number;
  /** Stops after this many texts (published or not) in this run. */
  maxJobs?: number;
  now?: () => Date;
};

export type BulkSummary = { jobs: number; published: number; discarded: number; spentThisRun: number; state: BulkState; stoppedBecause: string };

/** Runs cells in order until the budget, the job limit or the plan is exhausted. Never throws for a failed text. */
export async function runBulk(cells: readonly BulkCell[], state: BulkState, deps: BulkDeps): Promise<BulkSummary> {
  const maxAttempts = deps.maxAttemptsPerCell ?? 3;
  const minJob = deps.minJobBudgetUsd ?? 0.25;
  const now = deps.now ?? (() => new Date());
  const styleHistory: string[] = [];
  let jobs = 0; let published = 0; let discarded = 0; let spentThisRun = 0;
  let stoppedBecause = "plan_complete";
  outer: for (const cell of cells) {
    const cellState = (state.cells[cell.key] ??= { attempts: 0, published: 0, discarded: 0, spentUsd: 0, refs: [] });
    // `missing` is re-read from the database at each start: texts published by earlier runs are already counted there.
    let publishedHere = 0;
    while (publishedHere < cell.missing) {
      if (cellState.attempts >= maxAttempts * Math.max(1, cell.missing) || (cellState.published === 0 && cellState.attempts >= maxAttempts)) {
        deps.log?.(`skip ${cell.key}: ${cellState.attempts} attempts (${cellState.lastReason ?? "?"})`);
        break;
      }
      const remaining = state.budgetUsd - state.spentUsd;
      if (remaining < minJob) { stoppedBecause = "budget"; break outer; }
      if (deps.maxJobs !== undefined && jobs >= deps.maxJobs) { stoppedBecause = "max_jobs"; break outer; }
      const style = pickStyle(cell.gradeBand, cell.kind === "fallback_chapter" ? "chapter" : cell.kind, styleHistory);
      styleHistory.push(style.key);
      const job: LibraryJob = { kind: cell.kind, interest: cell.interest, grade: cell.grade, gradeBand: cell.gradeBand, tenses: tenseRotation(cell.gradeBand, cellState.attempts + cell.grade), styleKey: style.key };
      let result: LibraryJobResult;
      try {
        result = await deps.runJob(job, Math.min(deps.perJobCapUsd, remaining));
      } catch (error) {
        // Infrastructure errors (database, network) still count as an attempt so a broken cell cannot loop forever.
        result = { job, decision: "discard", reason: `error:${error instanceof Error ? error.message.slice(0, 160) : "unknown"}`, costUsd: 0 };
      }
      jobs += 1;
      cellState.attempts += 1;
      cellState.spentUsd = round(cellState.spentUsd + result.costUsd);
      state.spentUsd = round(state.spentUsd + result.costUsd);
      spentThisRun = round(spentThisRun + result.costUsd);
      if (result.decision === "publish") { cellState.published += 1; publishedHere += 1; published += 1; cellState.refs.push(result.ref ?? result.libraryItemId ?? null); }
      else { cellState.discarded += 1; discarded += 1; cellState.lastReason = result.reason; }
      state.updatedAt = now().toISOString();
      await deps.save(state);
      deps.log?.(`${result.decision}\t${cell.key}\t${job.styleKey}\t$${result.costUsd.toFixed(3)}\ttotal $${state.spentUsd.toFixed(2)}/${state.budgetUsd}${result.reason ? `\t${result.reason}` : ""}`);
    }
  }
  state.stoppedBecause = stoppedBecause;
  await deps.save(state);
  return { jobs, published, discarded, spentThisRun, state, stoppedBecause };
}

const round = (value: number) => Math.round(value * 100_000) / 100_000;
