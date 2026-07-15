import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { getItemGenerator, getItemJudge } from "../src/lib/ai/item-generation/generator";
import { runItemGenerationPipeline, yieldReport } from "../src/lib/ai/item-generation/pipeline";
import type { GeneratedItem } from "../src/lib/ai/item-generation/schemas";
import { LanguageToolChecker } from "../src/lib/linguistic/languagetool";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";
import {
  validateCanonicalDiagnosticBank,
  type CanonicalDiagnosticBankArtifact,
  type CanonicalDiagnosticBankItem,
  type DiagnosticDifficultyTier,
} from "../src/lib/diagnostic/item-bank";
import {
  DIAGNOSTIC_DIFFICULTY_TIERS,
  diagnosticDifficultyForTier,
  diagnosticItemModality,
  diagnosticPromptFamilies,
} from "../src/lib/diagnostic/item-authoring";
import { sectionForStrand } from "../src/lib/diagnostic/protocol";

loadEnv({ path: ".env.local", quiet: true });
if (process.env.OPENROUTER_API_KEY) {
  if (!process.env.AI_PROVIDER || process.env.AI_PROVIDER === "mock") process.env.AI_PROVIDER = "glm";
  process.env.LLM_BASE_URL = "https://openrouter.ai/api/v1";
  process.env.LLM_API_KEY = process.env.OPENROUTER_API_KEY;
  process.env.LLM_MODEL = process.env.OPENROUTER_MODEL ?? process.env.LLM_MODEL ?? "z-ai/glm-5.2";
}
if (!process.env.LLM_MIN_INTERVAL_MS) process.env.LLM_MIN_INTERVAL_MS = "3500";
if (!["glm", "cloudflare"].includes(process.env.AI_PROVIDER ?? "")) {
  throw new Error("Canonical diagnostic generation requires a configured real AI provider; mock output is forbidden.");
}
if (!process.env.LLM_API_KEY) throw new Error("Canonical diagnostic generation requires LLM_API_KEY or OPENROUTER_API_KEY.");

const artifact = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")) as FrenchTaxonomyV2Artifact;
const output = "generated/diagnostic-bank-v2.json";
const countPerEvidence = Math.min(3, Math.max(1, Number(process.argv[2] ?? 3)));
const onlyNode = process.argv[3];
const knownNodeKeys = new Set(artifact.taxonomy.nodes.map((node) => node.key));
const ctx = {
  generator: getItemGenerator(),
  judge: process.env.DIAGNOSTIC_SKIP_JUDGE === "true" ? undefined : getItemJudge(),
  grammarChecker: new LanguageToolChecker(),
  knownNodeKeys,
  knownMisconceptionKeys: new Set<string>(),
  ensembleThreshold: .75,
};

const tiers: DiagnosticDifficultyTier[] = [...DIAGNOSTIC_DIFFICULTY_TIERS];
const existing = existsSync(output)
  ? JSON.parse(readFileSync(output, "utf8")) as CanonicalDiagnosticBankArtifact
  : null;
const entries: CanonicalDiagnosticBankItem[] = existing?.items ?? [];
const seen = new Set(entries.map((entry) => `${entry.item.nodeKey}\u0000${entry.item.promptFr}`));
const reports: ReturnType<typeof yieldReport>[] = [];

for (const node of artifact.taxonomy.nodes.filter((candidate) => !onlyNode || candidate.key === onlyNode)) {
  const sectionKey = sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0]);
  if (!sectionKey) continue;
  for (const evidence of node.evidence) {
    // Connected writing requires rubric/LLM scoring, which the live diagnostic
    // intentionally does not trust yet. It remains an explicit verification
    // step in the generated learning path instead of being misgraded as wrong.
    if (evidence.expectation === "independent_production") continue;
    const modality = diagnosticItemModality(node, evidence);
    const promptFamilies = diagnosticPromptFamilies(sectionKey, evidence.expectation);
    const plans = tiers.slice(0, countPerEvidence).map((difficultyTier, index) => ({
      difficultyTier,
      promptFamily: promptFamilies[index],
    }));
    const pendingPlans = plans.filter((plan) => !entries.some((entry) =>
      entry.reviewStatus !== "rejected"
      && entry.qcGates.verdict !== "rejected"
      && entry.item.nodeKey === node.key
      && entry.evidenceKey === evidence.key
      && entry.promptFamily === plan.promptFamily
      && entry.difficultyTier === plan.difficultyTier
    ));
    if (!pendingPlans.length) continue;
    const results = await runItemGenerationPipeline({
      nodeKey: node.key,
      strand: node.strand,
      labelFr: node.labelFr,
      cefrLevel: node.mappings.find((mapping) => mapping.framework === "cefr")?.levelMin,
      modality,
      learnerMode: "shared",
      count: pendingPlans.length,
      hint: {
        evidenceKey: evidence.key,
        observableAction: evidence.actionFr,
        expectation: evidence.expectation,
        successCriteria: evidence.successCriteria,
        requestedDifficultyTiers: pendingPlans.map((plan) => plan.difficultyTier),
        requestedPromptFamilies: pendingPlans.map((plan) => plan.promptFamily),
        preserveRequestedOrder: true,
        selfContainedPromptRequired: true,
        requireNovelContext: true,
      },
    }, ctx);
    reports.push(yieldReport(results));
    results.forEach((result, index) => {
      const plan = pendingPlans[index];
      if (!plan) return;
      if (!result.item || result.gates.verdict === "rejected") return;
      const identity = `${result.item.nodeKey}\u0000${result.item.promptFr}`;
      if (seen.has(identity)) return;
      const deterministic = result.item.validatorType === "conjugator" && result.gates.gate0_computed.applied;
      entries.push({
        itemKey: randomUUID(),
        item: {
          ...result.item,
          difficulty: diagnosticDifficultyForTier(plan.difficultyTier),
        } as GeneratedItem,
        evidenceKey: evidence.key,
        evidenceExpectation: evidence.expectation,
        sectionKey,
        promptFamily: plan.promptFamily,
        difficultyTier: plan.difficultyTier,
        qcGates: result.gates,
        reviewStatus: deterministic && result.gates.verdict === "auto_approved"
          ? "auto_approved"
          : "needs_human_review",
      });
      seen.add(identity);
    });
  }
}

const bank: Omit<CanonicalDiagnosticBankArtifact, "manifest"> = {
  schemaVersion: 1,
  bank: { key: "french-diagnostic-bank-v2", version: "2.0.0" },
  taxonomy: {
    releaseKey: artifact.release.key,
    releaseVersion: artifact.release.version,
    checksum: artifact.manifest.contentChecksum,
  },
  generatedAt: new Date().toISOString(),
  items: entries,
};
const validation = validateCanonicalDiagnosticBank(bank, artifact.taxonomy);
mkdirSync("generated", { recursive: true });
writeFileSync(output, `${JSON.stringify({ ...bank, manifest: validation.manifest }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  output,
  items: entries.length,
  valid: validation.valid,
  issues: validation.issues,
  sections: validation.sections,
  generation: {
    total: reports.reduce((sum, report) => sum + report.total, 0),
    autoApproved: reports.reduce((sum, report) => sum + report.auto_approved, 0),
    needsReview: reports.reduce((sum, report) => sum + report.needs_human_review, 0),
    rejected: reports.reduce((sum, report) => sum + report.rejected, 0),
  },
}, null, 2)}\n`);
