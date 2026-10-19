/**
 * Cost / latency / quality benchmark of live chapter configurations (roadmap
 * H.10). Never touches a database.
 *
 *   node --env-file=<AI keys only> --import tsx scripts/editorial-live-bench.mts \
 *     --configs baseline,sonnet-opus --samples 4 --budget 3 --out /tmp/bench.json [--outlines /tmp/outlines.json]
 *
 * Each sample is a real chapter brief with a saga outline (generated once and
 * cached with --outlines, so every configuration writes the same chapter). The
 * final text of each run is re-scored by one fixed judge (H.19 rubric, same
 * prompt as the style reviewer, model EDITORIAL_BENCH_JUDGE, default
 * google/gemini-3.8-flash) so configurations are compared on the same scale.
 * Prints one line per run and a summary table (mean/p95 latency, mean cost,
 * judge rubric, AI-tells pass rate, publish rate). Stops at --budget USD.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

process.env.EDITORIAL_LIVE_TIMEOUT_MS ??= "300000"; // measure the natural latency, not the production timeout
const { getAIProvider } = await import("../src/lib/ai");
const { buildEditorialBrief } = await import("../src/lib/content/editorial/brief");
const { runLiveChapter } = await import("../src/lib/content/editorial/live");
const { OpenAICompatibleEditorialLLM, completeJson } = await import("../src/lib/content/editorial/llm");
const { architectSaga, allowedCastNames, tensesForChapter } = await import("../src/lib/content/editorial/saga");
const { getStyleCard } = await import("../src/lib/content/editorial/styles");
const { MemoryLogger } = await import("../src/lib/content/editorial/team");
const { styleReviewerPrompt, styleReviewSchema } = await import("../src/lib/content/editorial/prompts");
const { rubricMean } = await import("../src/lib/content/editorial/rubric");
const { BENCH_CONFIGS } = await import("../src/lib/content/editorial/bench-configs");
type Outline = Awaited<ReturnType<typeof architectSaga>>;

const arg = (name: string, fallback: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const configs = arg("configs", "baseline").split(",");
const sampleCount = Number(arg("samples", "3"));
const budget = Number(arg("budget", "3"));
const outPath = arg("out", "");
const outlinesPath = arg("outlines", "");

const SAMPLES = [
  { key: "foot-6e-verne", interest: "football", grade: 6, style: "verne", chapter: 1, tenses: ["passe_simple", "imparfait"], newLemmas: [["intrépide", "qui n'a peur de rien"]], due: [["vestiaire", "pièce où l'on se change"], ["rivalité", "fait d'être en compétition"], ["acharné", "qui fait preuve d'une grande ténacité"]] },
  { key: "manga-cm-renard", interest: "manga", grade: 5, style: "renard", chapter: 2, tenses: ["imparfait", "passe_compose"], newLemmas: [["encre", "liquide coloré pour écrire ou dessiner"]], due: [["silencieux", "qui ne fait pas de bruit"], ["ombre", "zone sombre"]] },
  { key: "animals-4e-maupassant", interest: "animals", grade: 8, style: "maupassant", chapter: 3, tenses: ["passe_simple", "plus_que_parfait"], newLemmas: [["farouche", "qui fuit le contact, sauvage"]], due: [["lisière", "bord d'un bois"], ["haleter", "respirer vite et fort"]] },
  { key: "gaming-5e-leblanc", interest: "gaming", grade: 7, style: "leblanc", chapter: 2, tenses: ["passe_simple", "conditionnel_present"], newLemmas: [["stratagème", "ruse habile"]], due: [["manette", "boîtier pour jouer"], ["énigme", "question difficile à résoudre"]] },
] as const;

const provider = getAIProvider();
const gates = {
  moderate: async (text: string) => { const r = await provider.moderate({ content: text, context: "generated_content" }); return { allowed: r.passed && r.flaggedCategories.length === 0, categories: r.flaggedCategories }; },
};

function briefFor(sample: (typeof SAMPLES)[number]) {
  const band = sample.grade <= 5 ? "cm" as const : sample.grade <= 7 ? "6e-5e" as const : sample.grade <= 9 ? "4e-3e" as const : "lycee" as const;
  return buildEditorialBrief({
    kind: "chapter", mode: "live", interests: [sample.interest], grade: sample.grade, gradeBand: band, styleKey: sample.style, narration: "tu", heroGender: "f",
    newLemmas: sample.newLemmas.map(([lemma, definition]) => ({ lemma, kind: "new" as const, definition })),
    dueLemmas: sample.due.map(([lemma, definition]) => ({ lemma, kind: "due" as const, definition })),
    targetTenses: [...sample.tenses],
  });
}

// Outlines: one per sample, shared by every configuration (architect cost is per saga, not per branch).
const outlines: Record<string, Outline> = outlinesPath && existsSync(outlinesPath) ? JSON.parse(readFileSync(outlinesPath, "utf8")) : {};
const outlineLLM = new OpenAICompatibleEditorialLLM({ ...process.env, EDITORIAL_MODEL_ARCHITECT: process.env.EDITORIAL_BENCH_ARCHITECT ?? "anthropic/claude-sonnet-5.5" });
for (const sample of SAMPLES.slice(0, sampleCount)) {
  if (outlines[sample.key]) continue;
  outlines[sample.key] = await architectSaga(briefFor(sample), getStyleCard(sample.style), outlineLLM, new MemoryLogger());
  if (outlinesPath) writeFileSync(outlinesPath, JSON.stringify(outlines, null, 1));
}

const judgeLLM = new OpenAICompatibleEditorialLLM({ ...process.env, EDITORIAL_MODEL_REVIEWER: process.env.EDITORIAL_BENCH_JUDGE ?? "google/gemini-3.8-flash", EDITORIAL_REASONING_REVIEWER: "default" });
let spent = 0;
const runs: Array<Record<string, unknown>> = [];
for (const name of configs) {
  const config = BENCH_CONFIGS[name];
  if (!config) throw new Error(`unknown config ${name}; known: ${Object.keys(BENCH_CONFIGS).join(", ")}`);
  const llm = new OpenAICompatibleEditorialLLM({ ...process.env, ...config.env });
  for (const sample of SAMPLES.slice(0, sampleCount)) {
    if (spent >= budget) { console.log(`budget reached ($${spent.toFixed(3)})`); break; }
    const outline = outlines[sample.key];
    const base = briefFor(sample);
    const brief = { ...base, targetTenses: tensesForChapter(outline, sample.chapter, base.targetTenses) };
    const logger = new MemoryLogger();
    const storySoFar = sample.chapter > 1 ? outline.stages.filter((s) => s.chapter < sample.chapter).map((s) => `Chapitre ${s.chapter} : ${s.beat}`).join("\n") : "";
    const outcome = await runLiveChapter({
      brief, style: getStyleCard(sample.style), lineEdit: config.lineEdit,
      context: { outline, chapterIndex: sample.chapter, chapterCount: outline.stages.length, storySoFar, previousChoice: sample.chapter > 1 ? "Suivre la piste jusqu'au bout" : null },
      gates: { ...gates, forbiddenNames: ["Inès"], allowedNames: allowedCastNames(outline) },
    }, llm, logger);
    spent += outcome.costUsd;
    let judgeMean: number | null = null;
    let aiTellsPass: boolean | null = null;
    if (outcome.decision === "publish") {
      aiTellsPass = outcome.gates.results.find((r) => r.gate === "ai_tells")?.passed ?? null;
      try {
        const prompt = styleReviewerPrompt(brief, getStyleCard(sample.style), outcome.text.body);
        const judged = await completeJson(judgeLLM, { role: "reviewer_style", system: prompt.system, user: prompt.user, temperature: 0.2 }, styleReviewSchema);
        judgeMean = rubricMean(judged.value.rubric);
        spent += judged.result.usage.costUsd;
      } catch (error) { console.log("judge failed", error instanceof Error ? error.message : error); }
    }
    const steps = logger.steps.filter((s) => s.model).map((s) => ({ role: s.role, model: s.model, ms: s.latencyMs, usd: Number(s.costUsd.toFixed(4)), out: s.outputTokens, reasoning: s.reasoningTokens ?? null }));
    const run = { config: name, sample: sample.key, decision: outcome.decision, reason: outcome.decision === "fallback" ? outcome.reason : null, rewrites: outcome.rewrites, latencyMs: outcome.latencyMs, costUsd: Number(outcome.costUsd.toFixed(4)), pipelineRubric: outcome.decision === "publish" ? outcome.reviews.rubricMean : null, judgeMean, aiTellsPass, steps, text: outcome.decision === "publish" ? outcome.text.body : null };
    runs.push(run);
    console.log(`${name}\t${sample.key}\t${outcome.decision}${run.reason ? `(${run.reason})` : ""}\t${(outcome.latencyMs / 1000).toFixed(1)}s\t$${outcome.costUsd.toFixed(3)}\trewrites ${outcome.rewrites}\tpipeline ${run.pipelineRubric ?? "—"}\tjudge ${judgeMean ?? "—"}\tai-tells ${aiTellsPass ?? "—"}`);
    console.log(`    ${steps.map((s) => `${s.role}:${s.model?.split("/")[1]} ${(s.ms / 1000).toFixed(1)}s $${s.usd} out=${s.out}${s.reasoning ? ` (think ${s.reasoning})` : ""}`).join(" | ")}`);
    if (outPath) writeFileSync(outPath, JSON.stringify({ spent, runs }, null, 1));
  }
}

const p95 = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] ?? 0; };
const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
console.log("\n| Config | Runs | Published | Mean cost / branch | Mean latency | p95 latency | Judge rubric (mean) | AI-tells pass |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const name of configs) {
  const rows = runs.filter((r) => r.config === name);
  if (!rows.length) continue;
  const published = rows.filter((r) => r.decision === "publish");
  const judged = published.map((r) => r.judgeMean as number | null).filter((v): v is number => v !== null);
  console.log(`| ${name} | ${rows.length} | ${published.length} | $${mean(rows.map((r) => r.costUsd as number)).toFixed(3)} | ${(mean(rows.map((r) => r.latencyMs as number)) / 1000).toFixed(0)} s | ${(p95(rows.map((r) => r.latencyMs as number)) / 1000).toFixed(0)} s | ${judged.length ? mean(judged).toFixed(2) : "—"} | ${published.filter((r) => r.aiTellsPass).length}/${published.length} |`);
}
console.log(`total spent $${spent.toFixed(3)}`);
