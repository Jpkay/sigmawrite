/**
 * Library-mode bulk production driver (roadmap E.3, G.3, H.14): generates
 * reading passages, dictées and fallback story chapters cell by cell from the
 * interest coverage gaps, under a TOTAL budget, resumable.
 *
 *   # plan only (default; reads the database, writes nothing, no model call)
 *   node --env-file=<private env> --import tsx scripts/editorial-bulk.mts --budget 50
 *   # produce
 *   node --env-file=<private env> --import tsx scripts/editorial-bulk.mts --budget 50 --execute \
 *     [--state editorial-bulk-state.json] [--kinds passage,dictation,fallback_chapter] [--max-jobs 20] \
 *     [--max-attempts 3] [--per-job-cap 3] [--fallback-per-cell 3] [--level interest|group] [--interests football,manga] [--grades 10,11,12]
 *
 * - Coverage is re-read at every start, so a stopped run resumes where it
 *   stopped; the state file keeps the total spend across runs (the budget is a
 *   ceiling for all runs together) and the attempts per cell.
 * - Every text goes through the full library pipeline (best of 4, ≤ 3 rounds,
 *   ≥ 4.3, every gate) and is published automatically: passages become reading
 *   passages (H.16), dictées are auto-approved (G.2) and get audio from the
 *   dictation-audio job, fallback chapters join the story pool.
 * - Run it against staging first. Requires NEXT_PUBLIC_SUPABASE_URL,
 *   SUPABASE_SERVICE_ROLE_KEY and the AI provider keys.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { getAIEmbeddingInfo, getAIProvider } from "../src/lib/ai";
import { missingInterestCoverage } from "../src/lib/content/interest-coverage";
import { loadInterestCoverageCounts, loadInterestDemand } from "../src/lib/content/interest-coverage-load";
import { speechToTextFromEnv } from "../src/lib/content/editorial/audio-check";
import { newBulkState, planBulkCells, resumeBulkState, runBulk, type BulkCellKind, type BulkState } from "../src/lib/content/editorial/bulk";
import { LIBRARY_DEFAULTS } from "../src/lib/content/editorial/library";
import { runLibraryJob } from "../src/lib/content/editorial/library-runner";
import { OpenAICompatibleEditorialLLM } from "../src/lib/content/editorial/llm";
import { LanguageToolChecker } from "../src/lib/linguistic/languagetool";

const arg = (name: string, fallback: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const budget = Number(arg("budget", "NaN"));
if (!Number.isFinite(budget) || budget <= 0) throw new Error("--budget <USD> is required (total for all runs)");
const execute = process.argv.includes("--execute");
const statePath = arg("state", "editorial-bulk-state.json");
const kinds = arg("kinds", "passage,dictation,fallback_chapter").split(",") as BulkCellKind[];
const level = arg("level", "interest") === "group" ? "group" : "interest";
const onlyInterests = arg("interests", "").split(",").map((s) => s.trim()).filter(Boolean);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
console.log(`database: ${new URL(url).host}${execute ? "" : " (plan only — add --execute to produce)"}`);
const db = createClient(url, key, { auth: { persistSession: false } });

const counts = await loadInterestCoverageCounts(db);
const demand = await loadInterestDemand(db);
const gaps = missingInterestCoverage(counts, { demand, level, ...(onlyInterests.length ? { targets: onlyInterests } : {}) });
const popular = onlyInterests.length ? onlyInterests : Object.entries(demand).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k]) => k);
const { data: existing } = await db.from("editorial_library_items").select("interest,grade_band").eq("kind", "fallback_chapter").eq("status", "published");
const onlyGrades = new Set(arg("grades", "").split(",").filter((s) => s.trim()).map((s) => Number(s.trim())).filter((n) => Number.isInteger(n)));
const cells = planBulkCells(gaps, { kinds, fallback: { interests: popular, existing: (existing ?? []).map((e) => ({ interest: e.interest as string, gradeBand: e.grade_band as string })), perCell: Number(arg("fallback-per-cell", "3")) } })
  .filter((cell) => onlyGrades.size === 0 || onlyGrades.has(cell.grade));
const state: BulkState = existsSync(statePath) ? resumeBulkState(JSON.parse(readFileSync(statePath, "utf8")), budget) : newBulkState(budget);
const texts = cells.reduce((n, c) => n + c.missing, 0);
console.log(`${cells.length} cells, ${texts} texts missing; spent so far $${state.spentUsd.toFixed(2)} of $${budget}`);
for (const cell of cells.slice(0, 40)) console.log(`  ${cell.key}\tmissing ${cell.missing}\tattempts ${state.cells[cell.key]?.attempts ?? 0}`);
if (cells.length > 40) console.log(`  … ${cells.length - 40} more`);
if (!execute) process.exit(0);

const provider = getAIProvider();
const llm = new OpenAICompatibleEditorialLLM();
const gates = {
  moderate: async (text: string) => { const r = await provider.moderate({ content: text, context: "generated_content" }); return { allowed: r.passed && !r.needsHumanReview && r.flaggedCategories.length === 0, categories: r.flaggedCategories }; },
  grammar: process.env.LANGUAGETOOL_URL ? new LanguageToolChecker() : null,
};
const embedder = { embed: (text: string) => provider.embed({ text }), model: getAIEmbeddingInfo().model };
const summary = await runBulk(cells, state, {
  runJob: (job, costCapUsd) => runLibraryJob(db, job, { llm, gates, speech: provider, stt: speechToTextFromEnv(), embedder, costCapUsd, runTag: "bulk" }),
  save: (s) => writeFileSync(statePath, JSON.stringify(s, null, 1)),
  log: (line) => console.log(line),
  perJobCapUsd: Number(arg("per-job-cap", String(LIBRARY_DEFAULTS.costCapUsd))),
  maxAttemptsPerCell: Number(arg("max-attempts", "3")),
  maxJobs: process.argv.includes("--max-jobs") ? Number(arg("max-jobs", "0")) : undefined,
});
console.log(`stopped: ${summary.stoppedBecause}; ${summary.jobs} texts tried, ${summary.published} published, ${summary.discarded} discarded; $${summary.spentThisRun.toFixed(2)} this run, $${summary.state.spentUsd.toFixed(2)} total`);
