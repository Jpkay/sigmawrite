import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  buildDeterministicDiagnosticItems,
  DETERMINISTIC_DIAGNOSTIC_ITEM_PREFIX,
} from "../src/lib/diagnostic/deterministic-items";
import {
  buildReusedDiagnosticDraftItems,
  REUSED_DIAGNOSTIC_ITEM_PREFIX,
} from "../src/lib/diagnostic/reused-draft-items";
import type { GeneratedItem } from "../src/lib/ai/item-generation/schemas";
import {
  buildLocalSpellingDraftItems,
  LOCAL_SPELLING_ITEM_PREFIX,
} from "../src/lib/diagnostic/local-spelling-items";
import {
  buildLocalGrammarDraftItems,
  LOCAL_GRAMMAR_ITEM_PREFIX,
} from "../src/lib/diagnostic/local-grammar-items";
import {
  buildLocalSpellingGapDraftItems,
  LOCAL_SPELLING_GAP_ITEM_PREFIX,
} from "../src/lib/diagnostic/local-spelling-gap-items";
import {
  buildLocalConjugationGapDraftItems,
  LOCAL_CONJUGATION_GAP_ITEM_PREFIX,
} from "../src/lib/diagnostic/local-conjugation-gap-items";
import {
  buildLocalReadingDraftItems,
  LOCAL_READING_ITEM_PREFIX,
} from "../src/lib/diagnostic/local-reading-items";
import {
  validateCanonicalDiagnosticBank,
  type CanonicalDiagnosticBankArtifact,
} from "../src/lib/diagnostic/item-bank";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";

const taxonomyPath = "generated/french-taxonomy-v2.json";
const outputPath = process.argv[2] ?? "generated/diagnostic-bank-v2.json";
const taxonomy = JSON.parse(
  readFileSync(taxonomyPath, "utf8"),
) as FrenchTaxonomyV2Artifact;
const existing = existsSync(outputPath)
  ? JSON.parse(readFileSync(outputPath, "utf8")) as CanonicalDiagnosticBankArtifact
  : null;

if (existing && (
  existing.bank.key !== "french-diagnostic-bank-v2"
  || existing.taxonomy.releaseKey !== taxonomy.release.key
  || existing.taxonomy.checksum !== taxonomy.manifest.contentChecksum
)) {
  throw new Error("Existing bank is pinned to a different release contract.");
}

const computed = await buildDeterministicDiagnosticItems(taxonomy.taxonomy);
const reusableSources = [
  ...JSON.parse(readFileSync("generated/past-narration-items.json", "utf8")),
  ...JSON.parse(readFileSync("generated/present-agreement-items.json", "utf8")),
] as GeneratedItem[];
const reusedDrafts = await buildReusedDiagnosticDraftItems(
  taxonomy.taxonomy,
  reusableSources,
);
const localSpellingDrafts = await buildLocalSpellingDraftItems(taxonomy.taxonomy);
const localGrammarDrafts = await buildLocalGrammarDraftItems(taxonomy.taxonomy);
const localSpellingGapDrafts = await buildLocalSpellingGapDraftItems(taxonomy.taxonomy);
const localConjugationGapDrafts = await buildLocalConjugationGapDraftItems(taxonomy.taxonomy);
const localReadingDrafts = await buildLocalReadingDraftItems(taxonomy.taxonomy);
const retained = (existing?.items ?? []).filter((entry) =>
  !entry.itemKey.startsWith(`${DETERMINISTIC_DIAGNOSTIC_ITEM_PREFIX}:`)
  && !entry.itemKey.startsWith(`${REUSED_DIAGNOSTIC_ITEM_PREFIX}:`)
  && !entry.itemKey.startsWith(`${LOCAL_SPELLING_ITEM_PREFIX}:`)
  && !entry.itemKey.startsWith(`${LOCAL_GRAMMAR_ITEM_PREFIX}:`)
  && !entry.itemKey.startsWith(`${LOCAL_SPELLING_GAP_ITEM_PREFIX}:`)
  && !entry.itemKey.startsWith(`${LOCAL_CONJUGATION_GAP_ITEM_PREFIX}:`)
  && !entry.itemKey.startsWith(`${LOCAL_READING_ITEM_PREFIX}:`)
);
const draft: Omit<CanonicalDiagnosticBankArtifact, "manifest"> = {
  schemaVersion: 1,
  bank: { key: "french-diagnostic-bank-v2", version: "2.0.0" },
  taxonomy: {
    releaseKey: taxonomy.release.key,
    releaseVersion: taxonomy.release.version,
    checksum: taxonomy.manifest.contentChecksum,
  },
  generatedAt: new Date().toISOString(),
  items: [
    ...retained,
    ...computed,
    ...reusedDrafts,
    ...localSpellingDrafts,
    ...localGrammarDrafts,
    ...localSpellingGapDrafts,
    ...localConjugationGapDrafts,
    ...localReadingDrafts,
  ],
};
const validation = validateCanonicalDiagnosticBank(draft, taxonomy.taxonomy);

mkdirSync("generated", { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify({ ...draft, manifest: validation.manifest }, null, 2)}\n`,
);
process.stdout.write(`${JSON.stringify({
  output: outputPath,
  retainedItems: retained.length,
  computedItems: computed.length,
  reusedDraftItems: reusedDrafts.length,
  localSpellingDraftItems: localSpellingDrafts.length,
  localGrammarDraftItems: localGrammarDrafts.length,
  localSpellingGapDraftItems: localSpellingGapDrafts.length,
  localConjugationGapDraftItems: localConjugationGapDrafts.length,
  localReadingDraftItems: localReadingDrafts.length,
  totalItems: draft.items.length,
  eligibleItems: validation.manifest.eligibleItemCount,
  releaseReady: validation.valid,
  remainingIssues: validation.issues.length,
}, null, 2)}\n`);
