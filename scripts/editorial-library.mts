/**
 * Library mode production (roadmap E.3, G.3, H.14, H.16, H.17), driven by the
 * interest coverage gaps (src/lib/content/interest-coverage.ts).
 *
 *   node --env-file=<private env> --import tsx scripts/editorial-library.mts [--limit 5] [--fallbacks 3] [--dry-run]
 *
 * Writes with the service role: passages → ai_generated_candidates (auto_approved,
 * editorial_reading_text) + editorial_library_items; dictées → dictations
 * through autoApproveDictation; fallback chapters → editorial_library_items.
 * Run against staging first. Texts below the 4.3 bar are discarded, never fixed by hand.
 */
import { createClient } from "@supabase/supabase-js";
import { getAIProvider } from "../src/lib/ai";
import { missingInterestCoverage } from "../src/lib/content/interest-coverage";
import { loadInterestCoverageCounts, loadInterestDemand } from "../src/lib/content/interest-coverage-load";
import { speechToTextFromEnv } from "../src/lib/content/editorial/audio-check";
import { planFallbackJobs, planLibraryJobs, runLibraryJob } from "../src/lib/content/editorial/library-runner";
import { OpenAICompatibleEditorialLLM } from "../src/lib/content/editorial/llm";
import { LanguageToolChecker } from "../src/lib/linguistic/languagetool";

const arg = (name: string, fallback: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const db = createClient(url, key, { auth: { persistSession: false } });
const counts = await loadInterestCoverageCounts(db);
const demand = await loadInterestDemand(db);
const gaps = missingInterestCoverage(counts, { demand });
const jobs = planLibraryJobs(gaps, { limit: Number(arg("limit", "5")) });
const popular = Object.entries(demand).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);
const { data: existing } = await db.from("editorial_library_items").select("interest,grade_band").eq("kind", "fallback_chapter").eq("status", "published");
jobs.push(...planFallbackJobs(popular, (existing ?? []).map((e) => ({ interest: e.interest as string, gradeBand: e.grade_band as string })), 3, Number(arg("fallbacks", "3"))));
console.log(`${gaps.length} coverage gaps; ${jobs.length} jobs`);
for (const job of jobs) console.log(`  ${job.kind} ${job.interest} ${job.gradeBand} grade ${job.grade} ${job.styleKey} ${job.tenses.join(",")}`);
if (process.argv.includes("--dry-run")) process.exit(0);

const provider = getAIProvider();
const llm = new OpenAICompatibleEditorialLLM();
const gates = {
  moderate: async (text: string) => { const r = await provider.moderate({ content: text, context: "generated_content" }); return { allowed: r.passed && r.flaggedCategories.length === 0, categories: r.flaggedCategories }; },
  grammar: process.env.LANGUAGETOOL_URL ? new LanguageToolChecker() : null,
};
let spent = 0;
for (const job of jobs) {
  const result = await runLibraryJob(db, job, { llm, gates, speech: provider, stt: speechToTextFromEnv() });
  spent += result.costUsd;
  console.log(`${result.decision}\t${job.kind}\t${job.interest}\t${job.gradeBand}\trubric ${result.rubricMean ?? "—"}\t$${result.costUsd.toFixed(3)}\t${result.reason ?? JSON.stringify(result.ref ?? "")}`);
}
console.log(`total $${spent.toFixed(2)}`);
