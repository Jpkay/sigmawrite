/**
 * Real end-to-end check of the editorial pipeline, without any database:
 * one saga outline + chapter 1 (live mode) and one dictée (library mode).
 *
 *   node --env-file=<private env> --import tsx scripts/editorial-smoke.mts [--chapter-only|--dictation-only] [--style verne] [--interest football] [--grade 6]
 *
 * Prints the texts, gate results, rubric scores and cost. Never writes anywhere.
 */
import { writeFileSync } from "node:fs";
import { getAIProvider } from "../src/lib/ai";
import { buildEditorialBrief } from "../src/lib/content/editorial/brief";
import { runLiveChapter } from "../src/lib/content/editorial/live";
import { runLibraryText } from "../src/lib/content/editorial/library";
import { OpenAICompatibleEditorialLLM, resolveRoleModels } from "../src/lib/content/editorial/llm";
import { architectSaga, allowedCastNames, tensesForChapter } from "../src/lib/content/editorial/saga";
import { getStyleCard } from "../src/lib/content/editorial/styles";
import { MemoryLogger } from "../src/lib/content/editorial/team";
import { renderHero } from "../src/lib/content/editorial/hero";
import { gradeBandFor } from "../src/lib/content/editorial/types";
import { LanguageToolChecker } from "../src/lib/linguistic/languagetool";

const arg = (name: string, fallback: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const grade = Number(arg("grade", "6"));
const band = gradeBandFor(grade);
const interest = arg("interest", "football");
const styleKey = arg("style", "verne");
const out = arg("out", "");
const llm = new OpenAICompatibleEditorialLLM();
console.log("models", resolveRoleModels());
const provider = getAIProvider();
const gates = {
  moderate: async (text: string) => { const r = await provider.moderate({ content: text, context: "generated_content" }); return { allowed: r.passed && r.flaggedCategories.length === 0, categories: r.flaggedCategories }; },
  grammar: process.env.LANGUAGETOOL_URL ? new LanguageToolChecker() : null,
};
const report: Record<string, unknown> = {};
const summarize = (logger: MemoryLogger) => logger.steps.map((s) => `${s.role}${s.model ? `(${s.model})` : ""} ${s.latencyMs}ms $${s.costUsd.toFixed(4)}${s.score !== null ? ` score=${s.score}` : ""}`).join("\n  ");

if (!process.argv.includes("--dictation-only")) {
  const brief = buildEditorialBrief({
    kind: "chapter", mode: "live", interests: [interest], grade, gradeBand: band, styleKey, narration: "tu", heroGender: "f",
    newLemmas: [{ lemma: "intrépide", kind: "new", definition: "qui n'a peur de rien, qui ose affronter le danger" }],
    dueLemmas: [{ lemma: "vestiaire", kind: "due", definition: "pièce où l'on se change avant et après le sport" }, { lemma: "rivalité", kind: "due", definition: "le fait d'être en compétition avec quelqu'un" }, { lemma: "acharné", kind: "due", definition: "qui fait quelque chose avec une grande ténacité" }],
    targetTenses: ["passe_simple", "imparfait"],
  });
  const style = getStyleCard(styleKey);
  const outlineLogger = new MemoryLogger();
  const t0 = Date.now();
  const outline = await architectSaga(brief, style, llm, outlineLogger);
  console.log(`\n=== OUTLINE (${Date.now() - t0} ms) ===\n${outline.title} — ${outline.logline}\nCast: ${outline.cast.map((c) => `${c.name} (${c.role})`).join(", ")}\nEndings: ${outline.endings.map((e) => e.summary).join(" | ")}`);
  const logger = new MemoryLogger();
  const outcome = await runLiveChapter({
    brief: { ...brief, targetTenses: tensesForChapter(outline, 1, brief.targetTenses) }, style,
    context: { outline, chapterIndex: 1, chapterCount: outline.stages.length, storySoFar: "", previousChoice: null },
    gates: { ...gates, forbiddenNames: ["Inès"], allowedNames: allowedCastNames(outline) },
  }, llm, logger);
  console.log(`\n=== CHAPTER 1 — decision ${outcome.decision} in ${outcome.latencyMs} ms, cost $${outcome.costUsd.toFixed(4)} ===`);
  console.log(`  ${summarize(logger)}`);
  if (outcome.decision === "publish") {
    console.log(`\n${outcome.text.title}\n\n${renderHero(outcome.text.body, { name: "Inès", gender: "f" })}\n\nChoix : ${outcome.text.choices.map((c) => c.label).join(" / ")}`);
    console.log("\nRubric", outcome.reviews.rubric, "mean", outcome.reviews.rubricMean);
    console.log("Gates", outcome.gates.results.map((r) => `${r.gate}:${r.passed ? "ok" : "FAIL"} ${r.passed ? "" : r.detail}`).join("\n  "));
    console.log("Verdict", outcome.verdict.reasons);
  } else console.log("Fallback reason", outcome.reason, outcome.verdict?.reasons, outcome.verdict?.notes.slice(0, 8));
  report.chapter = { outline, outcome, steps: logger.steps.map((s) => ({ role: s.role, model: s.model, latencyMs: s.latencyMs, costUsd: s.costUsd, output: s.output })) };
}

if (!process.argv.includes("--chapter-only")) {
  const dictationGrade = Number(arg("dictation-grade", "5"));
  const dBand = gradeBandFor(dictationGrade);
  const brief = buildEditorialBrief({
    kind: "dictation", mode: "library", interests: [arg("dictation-interest", "manga")], grade: dictationGrade, gradeBand: dBand, styleKey: arg("dictation-style", "renard"),
    newLemmas: [{ lemma: "encre", kind: "new", definition: "liquide coloré pour écrire ou dessiner" }], dueLemmas: [{ lemma: "silencieux", kind: "due" }],
    targetTenses: ["imparfait"],
  });
  const logger = new MemoryLogger();
  const t0 = Date.now();
  const outcome = await runLibraryText({ brief, style: getStyleCard(brief.styleKey), gates, drafts: Number(arg("drafts", "4")), maxRounds: Number(arg("rounds", "3")) }, llm, logger);
  console.log(`\n=== DICTÉE — decision ${outcome.decision} in ${Date.now() - t0} ms, cost $${outcome.costUsd.toFixed(4)}, rounds ${outcome.rounds} ===`);
  console.log(`  ${summarize(logger)}`);
  if (outcome.decision === "publish") {
    console.log(`\n${outcome.text.title}\n${outcome.segments.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);
    console.log("\nRubric", outcome.reviews.rubric, "mean", outcome.reviews.rubricMean, "dictation review", outcome.reviews.dictation);
  } else {
    console.log("Discarded:", outcome.reason, outcome.verdict?.notes.slice(0, 8));
    if (outcome.best) console.log(`Best attempt:\n${outcome.best.body}`);
  }
  report.dictation = { outcome, steps: logger.steps.map((s) => ({ role: s.role, model: s.model, latencyMs: s.latencyMs, costUsd: s.costUsd, output: s.output })) };
}
if (out) writeFileSync(out, JSON.stringify(report, null, 1));
