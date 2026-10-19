/**
 * Automatic, quality-gated word definitions for every lemma of the licensed
 * lexical release (roadmap 2026-10, word memory content).
 *
 *   npm run lexicon:generate-definitions -- [--release generated/french-lexique4-release.json]
 *     [--lexique /path/Lexique400.tsv] [--cache .cache/lexicon-definitions] [--only mot1,mot2]
 *     [--limit N] [--concurrency 4] [--batch 8] [--max-cost 40] [--assemble-only]
 *
 * Generator (strong model) → deterministic gates → independent verifier (a
 * different model) → up to 2 regenerations with feedback → accepted or
 * discarded. Each lemma's final record is cached, so a run can stop and resume.
 * The committed output is generated/lexicon-definitions-v1.json (manifest) and
 * generated/lexicon-definitions-v1/shard-NN.json. No database is touched.
 *
 * Models: LEXICON_GENERATOR_MODEL / LEXICON_VERIFIER_MODEL (OpenRouter ids, or
 * "@cf/…" Cloudflare Workers AI ids), keys from the app's AI runtime config.
 * Each entry records the models that produced it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join, dirname, relative } from "node:path";
import { parseArgs } from "node:util";
import { config as loadEnv } from "dotenv";
import { resolveAIRuntimeConfig } from "../src/lib/ai/runtime-config";
import { chatComplete, extractJson, type ChatUsage } from "../src/lib/ai/item-generation/openai-compatible";
import { verifyBaselineArtifact, type BaselineLexiconArtifact } from "../src/lib/lexicon/baseline";
import { checksum } from "../src/lib/taxonomy/validate";
import {
  displaySpelling,
  gradeFromFrequency,
  lemmaEligibility,
  normalizeForMatch,
  orthographicNeighbors,
  runDeterministicGates,
  vetCloseWords,
} from "../src/lib/lexicon/definitions/gates";
import {
  GENERATOR_SYSTEM_PROMPT,
  VERIFIER_SYSTEM_PROMPT,
  generatorUserPrompt,
  regenerationFeedback,
  verifierUserPrompt,
} from "../src/lib/lexicon/definitions/prompts";
import {
  LEXICON_DEFINITIONS_PIPELINE_VERSION,
  LEXICON_DEFINITIONS_SENSE_KEY,
  generatedDefinitionSchema,
  verifierVerdictSchema,
  type GateResult,
  type GeneratedDefinition,
  type LexiconDefinitionEntry,
  type LexiconDefinitionsManifest,
  type ReleaseLemma,
  type VerifierVerdict,
} from "../src/lib/lexicon/definitions/types";

const { values: args } = parseArgs({
  options: {
    release: { type: "string", default: "generated/french-lexique4-release.json" },
    reference: { type: "string", default: "generated/french-lexique4-release-reference.json" },
    lexique: { type: "string", default: process.env.LEXIQUE4_TSV ?? "" },
    cache: { type: "string", default: ".cache/lexicon-definitions" },
    out: { type: "string", default: "generated/lexicon-definitions-v1.json" },
    only: { type: "string", default: "" },
    limit: { type: "string", default: "0" },
    concurrency: { type: "string", default: "4" },
    batch: { type: "string", default: "8" },
    "max-cost": { type: "string", default: "40" },
    "shard-size": { type: "string", default: "500" },
    "assemble-only": { type: "boolean", default: false },
  },
});

loadEnv({ path: ".env.local", quiet: true });
const MAX_REGENERATIONS = 2;
const GENERATOR_MODEL = process.env.LEXICON_GENERATOR_MODEL ?? "anthropic/claude-sonnet-5.5";
const VERIFIER_MODEL = process.env.LEXICON_VERIFIER_MODEL ?? "openai/gpt-5.6-terra";
if (GENERATOR_MODEL === VERIFIER_MODEL) throw new Error("The verifier must be a different model from the generator.");

// ---------------------------------------------------------------- inputs
const release = JSON.parse(readFileSync(resolve(args.release!), "utf8")) as BaselineLexiconArtifact;
if (!verifyBaselineArtifact(release)) throw new Error("Lexical release checksum mismatch.");
if (existsSync(resolve(args.reference!))) {
  const reference = JSON.parse(readFileSync(resolve(args.reference!), "utf8")) as { manifest: { contentChecksum: string } };
  if (reference.manifest.contentChecksum !== release.manifest.contentChecksum) throw new Error("Release does not match the committed release reference.");
}

/** Full-lexicon forms and spellings (vets close words and inflected forms). */
const lexiconForms = new Map<string, Set<string>>();
const knownLemmas = new Map<string, string>();
if (args.lexique) {
  const raw = readFileSync(resolve(args.lexique), "utf8");
  const sha = createHash("sha256").update(raw).digest("hex");
  if (sha !== release.source.checksum) throw new Error("Lexique TSV checksum differs from the release source checksum.");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split("\t");
  const col = (name: string) => headers.indexOf(name);
  const [wordI, lemmaI, freqI] = [col("1_Mot"), col("4_Lemme"), col("12_FreqLemme")];
  const freqByLemma = new Map<string, number>();
  for (const line of lines.slice(1)) {
    const cells = line.split("\t");
    const lemma = cells[lemmaI]?.trim();
    const word = cells[wordI]?.trim();
    if (!lemma || !word) continue;
    const key = normalizeForMatch(lemma);
    const forms = lexiconForms.get(key) ?? new Set<string>();
    forms.add(normalizeForMatch(word));
    lexiconForms.set(key, forms);
    const frequency = Number(cells[freqI]?.replace(",", ".")) || 0;
    // Close words must be words children meet: at least 1 occurrence per million.
    if (frequency >= 1 && frequency > (freqByLemma.get(key) ?? -1)) {
      freqByLemma.set(key, frequency);
      knownLemmas.set(key, lemma);
    }
  }
}

const lemmas: ReleaseLemma[] = release.entries.map((entry) => ({
  id: entry.id,
  lemma: entry.lemma,
  normalizedLemma: entry.normalizedLemma,
  partOfSpeech: entry.partOfSpeech,
  frequencyPerMillion: entry.frequencyPerMillion,
  forms: [...new Set([...entry.forms.map((form) => normalizeForMatch(form.normalized)), ...(lexiconForms.get(normalizeForMatch(entry.normalizedLemma)) ?? [])])],
}));
for (const lemma of lemmas) if (!knownLemmas.has(normalizeForMatch(lemma.normalizedLemma))) knownLemmas.set(normalizeForMatch(lemma.normalizedLemma), lemma.lemma);

const cacheDir = resolve(args.cache!);
mkdirSync(cacheDir, { recursive: true });
const usageLog = join(cacheDir, "_usage.jsonl");
const cachePath = (lemma: ReleaseLemma) => join(cacheDir, `${createHash("sha1").update(lemma.normalizedLemma).digest("hex").slice(0, 16)}.json`);
function readCached(lemma: ReleaseLemma): LexiconDefinitionEntry | null {
  const path = cachePath(lemma);
  if (!existsSync(path)) return null;
  const entry = JSON.parse(readFileSync(path, "utf8")) as LexiconDefinitionEntry;
  return entry.pipelineVersion === LEXICON_DEFINITIONS_PIPELINE_VERSION && entry.normalizedLemma === lemma.normalizedLemma ? entry : null;
}
const writeCached = (lemma: ReleaseLemma, entry: LexiconDefinitionEntry) => writeFileSync(cachePath(lemma), `${JSON.stringify(entry, null, 1)}\n`);

// ---------------------------------------------------------------- models
// Both endpoints come from the app's AI runtime config: OpenRouter ids go to
// OpenRouter, "@cf/…" ids to Cloudflare Workers AI (LLM_API_KEY + CLOUDFLARE_ACCOUNT_ID).
const runtime = resolveAIRuntimeConfig(process.env);
const cloudflare = (() => {
  try { return resolveAIRuntimeConfig({ ...process.env, AI_PROVIDER: "glm", OPENROUTER_API_KEY: "" }); } catch { return null; }
})();
function endpointFor(model: string) {
  if (!model.startsWith("@cf/")) return runtime;
  if (!cloudflare) throw new Error(`${model} needs LLM_API_KEY and CLOUDFLARE_ACCOUNT_ID (or LLM_BASE_URL).`);
  return cloudflare;
}
/** USD per million tokens, used only when the provider does not report cost (Workers AI). */
const PRICE_ESTIMATES: Record<string, [number, number]> = {
  "@cf/zai-org/glm-5.3": [0.6, 2.2],
  "@cf/zai-org/glm-5.2": [0.6, 2.2],
  "@cf/moonshotai/kimi-k2.6": [0.6, 2.5],
  "@cf/deepseek-ai/deepseek-v4-pro-0813": [0.66, 1.98],
  "@cf/openai/gpt-oss-120b": [0.35, 0.75],
};
let runCost = 0;
let fatal: string | null = null;
const maxCost = Number(args["max-cost"]);
async function callModel(model: string, system: string, user: string, json: boolean): Promise<unknown> {
  const endpoint = endpointFor(model);
  const openRouter = endpoint.baseUrl.includes("openrouter.ai");
  for (let attempt = 0; ; attempt++) {
    try {
      const content = await chatComplete(
        [{ role: "system", content: system }, { role: "user", content: user }],
        {
          baseUrl: endpoint.baseUrl,
          apiKey: endpoint.apiKey,
          model,
          temperature: model === VERIFIER_MODEL ? 0 : 0.5,
          timeoutMs: 300_000,
          jsonMode: json,
          // Low effort keeps cost modest; the independent verifier and the gates carry quality.
          extraBody: openRouter ? { usage: { include: true }, reasoning: { effort: "low" } } : { reasoning_effort: "low" },
          onUsage: (usage: ChatUsage) => {
            const price = PRICE_ESTIMATES[model];
            const cost = usage.cost ?? (price ? ((usage.prompt_tokens ?? 0) * price[0] + (usage.completion_tokens ?? 0) * price[1]) / 1e6 : 0);
            runCost += cost;
            appendFileSync(usageLog, `${JSON.stringify({ model, promptTokens: usage.prompt_tokens ?? 0, completionTokens: usage.completion_tokens ?? 0, costUsd: cost, estimated: usage.cost == null })}\n`);
          },
        },
      );
      return extractJson(content);
    } catch (error) {
      const message = (error as Error).message;
      // Billing or auth failures must stop the run, never turn into discarded words.
      if (/LLM (401|402|403)\b/.test(message)) { fatal = message; throw error; }
      if (attempt >= 2) throw error;
    }
  }
}

const errorLog = join(cacheDir, "_errors.jsonl");
function asItems<T>(raw: unknown, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: { message: string } } }, stage: string): Map<string, T> {
  const items = (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)) ? (raw as { items: unknown[] }).items : Array.isArray(raw) ? raw : [];
  const out = new Map<string, T>();
  for (const item of items) {
    const parsed = schema.safeParse(item);
    if (parsed.success) out.set(normalizeForMatch((parsed.data as { lemma: string }).lemma), parsed.data);
    else appendFileSync(errorLog, `${JSON.stringify({ stage, lemma: (item as { lemma?: unknown })?.lemma ?? null, error: parsed.error.message.slice(0, 800) })}\n`);
  }
  return out;
}

// ---------------------------------------------------------------- pipeline
const releaseByKey = lemmas;
function baseEntry(lemma: ReleaseLemma): Omit<LexiconDefinitionEntry, "status" | "gateResults"> {
  return {
    lemmaId: lemma.id,
    lemma: lemma.lemma,
    displayLemma: displaySpelling(lemma.lemma),
    normalizedLemma: lemma.normalizedLemma,
    partOfSpeech: lemma.partOfSpeech ?? null,
    frequencyPerMillion: lemma.frequencyPerMillion,
    gradeLevel: gradeFromFrequency(lemma.frequencyPerMillion),
    senseKey: LEXICON_DEFINITIONS_SENSE_KEY,
    pipelineVersion: LEXICON_DEFINITIONS_PIPELINE_VERSION,
  };
}

async function processBatch(batch: ReleaseLemma[]) {
  const feedback = new Map<string, string[]>();
  const history = new Map<string, Array<{ attempt: number; failures: string[] }>>();
  const lastGates = new Map<string, GateResult[]>();
  let pending = batch;
  for (let attempt = 1; attempt <= MAX_REGENERATIONS + 1 && pending.length > 0; attempt++) {
    if (runCost > maxCost || fatal) break;
    const promptLemmas = pending.map((lemma) => ({ ...lemma, gradeLevel: gradeFromFrequency(lemma.frequencyPerMillion), sampleForms: lemma.forms.slice(0, 8) }));
    let generated = new Map<string, GeneratedDefinition>();
    try {
      generated = asItems(await callModel(GENERATOR_MODEL, GENERATOR_SYSTEM_PROMPT, generatorUserPrompt(promptLemmas, feedback), false), generatedDefinitionSchema, "generator");
    } catch (error) {
      appendFileSync(errorLog, `${JSON.stringify({ stage: "generator_call", error: (error as Error).message.slice(0, 500) })}\n`);
    }
    if (fatal) return;
    const toVerify: Array<{ lemma: ReleaseLemma; item: GeneratedDefinition; gated: ReturnType<typeof runDeterministicGates> }> = [];
    const failed: Array<{ lemma: ReleaseLemma; failures: string[]; item?: GeneratedDefinition }> = [];
    for (const lemma of pending) {
      const item = generated.get(normalizeForMatch(lemma.lemma));
      if (!item) { failed.push({ lemma, failures: ["missing or malformed in the generator response"] }); continue; }
      if (!item.teachable) {
        writeCached(lemma, { ...baseEntry(lemma), status: "skipped", skipReason: item.skipReason ?? "too_vague", gateResults: { passed: false, attempts: attempt, gates: [{ gate: "generator_teachable", status: "fail", details: item.skipReason ?? "not teachable" }] } });
        continue;
      }
      const gated = runDeterministicGates(item, { lemma, knownLemmas, orthographic: orthographicNeighbors(lemma, releaseByKey) });
      lastGates.set(lemma.normalizedLemma, gated.gates);
      if (!gated.passed) {
        failed.push({ lemma, item, failures: gated.gates.filter((gate) => gate.status === "fail").map((gate) => `${gate.gate}: ${gate.details}`) });
        continue;
      }
      toVerify.push({ lemma, item, gated });
    }
    let verdicts = new Map<string, VerifierVerdict>();
    if (toVerify.length > 0) {
      try {
        verdicts = asItems(await callModel(VERIFIER_MODEL, VERIFIER_SYSTEM_PROMPT, verifierUserPrompt(toVerify.map(({ lemma, item, gated }) => ({
          lemma: lemma.lemma,
          partOfSpeech: lemma.partOfSpeech,
          gradeLevel: gradeFromFrequency(lemma.frequencyPerMillion),
          definition: gated.definition,
          examples: gated.examples.map((example) => example.text),
          keyIdeas: gated.validation.flatMap((criterion) => criterion.kind === "key_idea" ? [{ idea: criterion.idea, keywords: criterion.keywords }] : []),
          acceptedParaphrases: gated.validation.flatMap((criterion) => criterion.kind === "accepted_paraphrase" ? [criterion.text] : []),
          synonyms: item.synonyms,
          antonyms: item.antonyms,
          semanticNeighbors: item.semanticNeighbors,
        }))), true), verifierVerdictSchema, "verifier");
      } catch (error) {
        appendFileSync(errorLog, `${JSON.stringify({ stage: "verifier_call", error: (error as Error).message.slice(0, 500) })}\n`);
      }
    }
    if (fatal) return;
    for (const { lemma, item, gated } of toVerify) {
      const verdict = verdicts.get(normalizeForMatch(lemma.lemma));
      const examplesOk = verdict ? verdict.examplesCorrect.length === gated.examples.length && verdict.examplesCorrect.every(Boolean) : false;
      const pass = Boolean(verdict && verdict.verdict === "pass" && verdict.senseAccurate && verdict.ageAppropriate && verdict.nonCircular && verdict.validationSound && examplesOk);
      if (!pass) {
        failed.push({ lemma, item, failures: verdict ? [`verifier: ${verdict.issues.join(" / ") || "fail"}`] : ["verifier gave no verdict"] });
        lastGates.set(lemma.normalizedLemma, [...gated.gates, { gate: "independent_verification", status: "fail", details: verdict?.issues.join(" / ") || "no verdict" }]);
        continue;
      }
      const isFamily = gated.isFamily;
      const rejected = verdict!.badCloseWords;
      const closeWords = {
        synonyms: vetCloseWords(gated.closeWords.synonyms, { knownLemmas, isFamily, rejected }),
        antonyms: vetCloseWords(gated.closeWords.antonyms, { knownLemmas, isFamily, rejected }),
        semantic: vetCloseWords(gated.closeWords.semantic, { knownLemmas, isFamily, rejected }).filter((word) => !gated.closeWords.synonyms.includes(word)),
        orthographic: gated.closeWords.orthographic,
      };
      writeCached(lemma, {
        ...baseEntry(lemma),
        status: "accepted",
        senseGloss: item.senseGloss ?? undefined,
        definitionFr: gated.definition,
        examplesFr: gated.examples.map((example) => ({ text: example.text, interest: example.interest })),
        definitionValidation: gated.validation,
        relatedTopics: gated.relatedTopics,
        closeWords,
        gateResults: {
          passed: true,
          attempts: attempt,
          gates: [...gated.gates, { gate: "independent_verification", status: "pass" }],
          verifier: { model: VERIFIER_MODEL, verdict: "pass", issues: verdict!.issues },
          models: { generator: GENERATOR_MODEL, verifier: VERIFIER_MODEL },
          ...(history.get(lemma.normalizedLemma)?.length ? { history: history.get(lemma.normalizedLemma) } : {}),
        },
      });
    }
    for (const { lemma, failures, item } of failed) {
      history.set(lemma.normalizedLemma, [...(history.get(lemma.normalizedLemma) ?? []), { attempt, failures }]);
      feedback.set(lemma.lemma, regenerationFeedback(item, failures));
    }
    pending = failed.map(({ lemma }) => lemma);
  }
  if ((runCost > maxCost || fatal) && pending.length > 0) return; // left uncached: resumes on the next run
  for (const lemma of pending) {
    writeCached(lemma, {
      ...baseEntry(lemma),
      status: "discarded",
      gateResults: {
        passed: false,
        attempts: MAX_REGENERATIONS + 1,
        gates: lastGates.get(lemma.normalizedLemma) ?? [],
        history: history.get(lemma.normalizedLemma),
        models: { generator: GENERATOR_MODEL, verifier: VERIFIER_MODEL },
      },
    });
  }
}

if (!args["assemble-only"]) {
  if (runtime.kind === "mock") throw new Error("AI_PROVIDER is mock: configure a real provider to generate definitions.");
  const only = new Set(args.only!.split(",").map((value) => normalizeForMatch(value)).filter(Boolean));
  let todo = lemmas.filter((lemma) => (only.size === 0 || only.has(normalizeForMatch(lemma.normalizedLemma))) && !readCached(lemma));
  for (const lemma of todo) {
    const eligibility = lemmaEligibility(lemma);
    if (!eligibility.eligible) writeCached(lemma, { ...baseEntry(lemma), status: "skipped", skipReason: eligibility.reason, gateResults: { passed: false, attempts: 0, gates: [{ gate: "lemma_eligibility", status: "fail", details: eligibility.reason }] } });
  }
  todo = todo.filter((lemma) => lemmaEligibility(lemma).eligible);
  const limit = Number(args.limit);
  if (limit > 0) todo = todo.slice(0, limit);
  const batchSize = Math.max(1, Number(args.batch));
  const batches = Array.from({ length: Math.ceil(todo.length / batchSize) }, (_, index) => todo.slice(index * batchSize, (index + 1) * batchSize));
  let next = 0;
  let done = 0;
  const started = Date.now();
  const worker = async () => {
    while (next < batches.length && runCost <= maxCost && !fatal) {
      const batch = batches[next++];
      await processBatch(batch);
      done += batch.length;
      process.stdout.write(`${done}/${todo.length} lemmas · $${runCost.toFixed(2)} · ${Math.round((Date.now() - started) / 1000)}s\n`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Number(args.concurrency)) }, worker));
  if (runCost > maxCost) process.stdout.write(`Stopped at the cost cap ($${maxCost}); rerun to resume.\n`);
  if (fatal) process.stdout.write(`Stopped: provider refused the request (${fatal}); rerun to resume.\n`);
}

// ---------------------------------------------------------------- assemble
const entries: LexiconDefinitionEntry[] = [];
const missing: string[] = [];
for (const lemma of [...lemmas].sort((left, right) => left.normalizedLemma.localeCompare(right.normalizedLemma, "fr"))) {
  const cached = readCached(lemma);
  if (cached) entries.push(cached); else missing.push(lemma.lemma);
}
const unsuitable = new Set(entries.filter((entry) => entry.skipReason === "not_age_appropriate").flatMap((entry) => [normalizeForMatch(entry.lemma), normalizeForMatch(entry.displayLemma ?? entry.lemma)]));
for (const entry of entries) {
  if (!entry.closeWords) continue;
  for (const key of ["synonyms", "antonyms", "semantic", "orthographic"] as const) {
    entry.closeWords[key] = entry.closeWords[key].filter((word) => !unsuitable.has(normalizeForMatch(word)));
  }
  // A semantic distractor must not also be a listed synonym or antonym.
  const related = new Set([...entry.closeWords.synonyms, ...entry.closeWords.antonyms].map(normalizeForMatch));
  entry.closeWords.semantic = entry.closeWords.semantic.filter((word) => !related.has(normalizeForMatch(word)));
}
const usage: LexiconDefinitionsManifest["usage"] = {};
if (existsSync(usageLog)) {
  for (const line of readFileSync(usageLog, "utf8").split("\n").filter(Boolean)) {
    const row = JSON.parse(line) as { model: string; promptTokens: number; completionTokens: number; costUsd: number };
    const current = usage[row.model] ?? { calls: 0, promptTokens: 0, completionTokens: 0, costUsd: 0 };
    usage[row.model] = { calls: current.calls + 1, promptTokens: current.promptTokens + row.promptTokens, completionTokens: current.completionTokens + row.completionTokens, costUsd: Number((current.costUsd + row.costUsd).toFixed(4)) };
  }
}
const count = (predicate: (entry: LexiconDefinitionEntry) => boolean) => entries.filter(predicate).length;
const generatedEntries = entries.filter((entry) => entry.gateResults.attempts > 0 && entry.gateResults.gates[0]?.gate !== "generator_teachable");
const stats = {
  releaseLemmas: lemmas.length,
  entries: entries.length,
  missing: missing.length,
  accepted: count((entry) => entry.status === "accepted"),
  discarded: count((entry) => entry.status === "discarded"),
  skipped: count((entry) => entry.status === "skipped"),
  skippedIneligible: count((entry) => entry.status === "skipped" && entry.gateResults.attempts === 0),
  skippedByGenerator: count((entry) => entry.status === "skipped" && entry.gateResults.attempts > 0),
  acceptedFirstAttempt: count((entry) => entry.status === "accepted" && entry.gateResults.attempts === 1),
  acceptedAfterRegeneration: count((entry) => entry.status === "accepted" && entry.gateResults.attempts > 1),
  generatedForTeaching: generatedEntries.length,
};
const shardSize = Math.max(1, Number(args["shard-size"]));
const outPath = resolve(args.out!);
const shardDir = outPath.replace(/\.json$/, "");
mkdirSync(shardDir, { recursive: true });
for (const file of readdirSync(shardDir)) if (/^shard-\d+\.json$/.test(file)) unlinkSync(join(shardDir, file));
const shards: LexiconDefinitionsManifest["shards"] = [];
for (let index = 0; index * shardSize < entries.length; index++) {
  const shardEntries = entries.slice(index * shardSize, (index + 1) * shardSize);
  const path = join(shardDir, `shard-${String(index + 1).padStart(2, "0")}.json`);
  writeFileSync(path, `${JSON.stringify({ schemaVersion: 1, shard: index + 1, entries: shardEntries }, null, 1)}\n`);
  shards.push({ path: relative(dirname(outPath), path), count: shardEntries.length, checksum: checksum(shardEntries) });
}
const manifest: LexiconDefinitionsManifest = {
  schemaVersion: 1,
  pipelineVersion: LEXICON_DEFINITIONS_PIPELINE_VERSION,
  release: { key: release.release.key, version: release.release.version, contentChecksum: release.manifest.contentChecksum },
  attribution: `${release.source.attribution} Definitions, examples and validation criteria generated by the SigmaWrite ${LEXICON_DEFINITIONS_PIPELINE_VERSION} pipeline (automatic gates, no per-item human review); lexical material shared under CC BY-SA 4.0.`,
  models: {
    generator: [...new Set(entries.flatMap((entry) => entry.gateResults.models?.generator ?? []))].sort(),
    verifier: [...new Set(entries.flatMap((entry) => entry.gateResults.models?.verifier ?? []))].sort(),
  },
  stats,
  usage,
  shards,
  entriesChecksum: checksum(entries),
};
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ outPath: relative(process.cwd(), outPath), stats, usage })}\n`);
