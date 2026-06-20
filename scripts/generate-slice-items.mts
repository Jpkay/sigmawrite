/**
 * Generate competency items for the past-narration slice through the 6 QC gates
 * and report the yield (Roadmap Phase 9, D7).
 *
 * Requires the LLM env (GLM 5.2 via Cloudflare):
 *   export AI_PROVIDER=glm
 *   export LLM_BASE_URL="https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1"
 *   export LLM_API_KEY="<Cloudflare API token>"
 *   export LLM_MODEL="@cf/zai-org/glm-5.2"        # optional; this is the default
 *   # optional: a different judge model for a genuine Gate-3 ensemble
 *   export JUDGE_MODEL="@cf/zai-org/glm-4.7-flash"
 *
 * Run:
 *   npx tsx --tsconfig ./tsconfig.json scripts/generate-slice-items.mts [countPerNode] [nodeKey]
 *
 * Output: a yield report to stdout + approved/needs-review items written to
 * ./generated/past-narration-items.json for review before DB seeding.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { MISCONCEPTIONS, NODES } from "@/lib/content/slices/past-narration";
import { getItemGenerator, getItemJudge } from "@/lib/ai/item-generation/generator";
import {
  runItemGenerationPipeline,
  yieldReport,
  type PipelineContext,
} from "@/lib/ai/item-generation/pipeline";
import type { ItemGenSpec } from "@/lib/ai/item-generation/schemas";
import { LanguageToolChecker } from "@/lib/linguistic/languagetool";
import type { GeneratedItem, ItemGenerationResult } from "@/lib/ai/item-generation/schemas";

const count = Number(process.argv[2] ?? 3);
const onlyNode = process.argv[3];

const knownNodeKeys = new Set(NODES.map((n) => n.key));
const knownMisconceptionKeys = new Set(MISCONCEPTIONS.map((m) => m.key));

const ctx: PipelineContext = {
  generator: getItemGenerator(),
  judge: getItemJudge(),
  knownNodeKeys,
  knownMisconceptionKeys,
  grammarChecker: new LanguageToolChecker(),
  ensembleThreshold: 0.7,
};

const modalityFor = (strand: string): ItemGenSpec["modality"] =>
  strand === "expression_ecrite" ? "writing"
  : strand === "comprehension_ecrite" ? "reading"
  : strand === "comprehension_orale" ? "listening"
  : strand === "production_orale" ? "speaking"
  : "grammar_analysis";

const nodes = NODES.filter((n) => !onlyNode || n.key === onlyNode);
const all: ItemGenerationResult[] = [];
const keep: GeneratedItem[] = [];

console.log(`Generating ${count} item(s) for ${nodes.length} node(s)…\n`);

for (const node of nodes) {
  const spec: ItemGenSpec = {
    nodeKey: node.key,
    strand: node.strand,
    labelFr: node.labelFr,
    cefrLevel: node.cefrMin,
    modality: modalityFor(node.strand),
    learnerMode: "shared",
    count,
    misconceptionKeys: MISCONCEPTIONS.filter((m) => m.primaryNodeKey === node.key).map((m) => m.key),
  };
  try {
    const results = await runItemGenerationPipeline(spec, ctx);
    all.push(...results);
    const r = yieldReport(results);
    console.log(
      `  ${node.key.padEnd(28)} auto:${r.auto_approved} review:${r.needs_human_review} rej:${r.rejected}`
    );
    for (const res of results) {
      if (res.item && res.gates.verdict !== "rejected") keep.push(res.item);
    }
  } catch (e) {
    console.log(`  ${node.key.padEnd(28)} ERROR: ${(e as Error).message}`);
  }
}

const overall = yieldReport(all);
console.log("\n── Overall yield ──");
console.log(JSON.stringify(overall, null, 2));

mkdirSync("./generated", { recursive: true });
writeFileSync("./generated/past-narration-items.json", JSON.stringify(keep, null, 2));
console.log(`\nWrote ${keep.length} usable item(s) to ./generated/past-narration-items.json`);
