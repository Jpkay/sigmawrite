import { existsSync, readFileSync } from "node:fs";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";
import type { CanonicalDiagnosticBankArtifact } from "../src/lib/diagnostic/item-bank";
import {
  DIAGNOSTIC_DIFFICULTY_TIERS,
  diagnosticPromptFamilies,
} from "../src/lib/diagnostic/item-authoring";
import { DIAGNOSTIC_SECTIONS, sectionForStrand } from "../src/lib/diagnostic/protocol";

const taxonomy = JSON.parse(
  readFileSync("generated/french-taxonomy-v2.json", "utf8"),
) as FrenchTaxonomyV2Artifact;
const bankPath = process.argv[2] ?? "generated/diagnostic-bank-v2.json";
const bank = existsSync(bankPath)
  ? JSON.parse(readFileSync(bankPath, "utf8")) as CanonicalDiagnosticBankArtifact
  : null;
const usable = bank?.items.filter((entry) =>
  entry.reviewStatus !== "rejected" && entry.qcGates.verdict !== "rejected"
) ?? [];

const sections = Object.fromEntries(DIAGNOSTIC_SECTIONS.map((section) => [section.key, {
  evidenceDefinitions: 0,
  plannedItems: 0,
  existingItems: 0,
  remainingItems: 0,
}])) as Record<(typeof DIAGNOSTIC_SECTIONS)[number]["key"], {
  evidenceDefinitions: number;
  plannedItems: number;
  existingItems: number;
  remainingItems: number;
}>;

let liveEvidenceDefinitions = 0;
let deferredEvidenceDefinitions = 0;
let generationBatchesRemaining = 0;
let plannedItems = 0;
let existingItems = 0;

for (const node of taxonomy.taxonomy.nodes) {
  const section = sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0]);
  if (!section) continue;
  for (const evidence of node.evidence) {
    if (evidence.expectation === "independent_production") {
      deferredEvidenceDefinitions += 1;
      continue;
    }
    liveEvidenceDefinitions += 1;
    sections[section].evidenceDefinitions += 1;
    const requiredItems = Math.max(
      1,
      Number(
        evidence.successCriteria.minimumDistinctItems
        ?? evidence.successCriteria.minimumDistinctTexts
        ?? 1,
      ),
      Number(evidence.successCriteria.minimumOccasions ?? 1),
    );
    if (requiredItems > DIAGNOSTIC_DIFFICULTY_TIERS.length) {
      throw new Error(
        `${node.key}:${evidence.key} requires ${requiredItems} items; extend the prompt-family/tier planner before generation.`,
      );
    }
    const families = diagnosticPromptFamilies(section, evidence.expectation);
    let missingForEvidence = 0;
    for (let index = 0; index < requiredItems; index += 1) {
      const promptFamily = families[index];
      const difficultyTier = DIAGNOSTIC_DIFFICULTY_TIERS[index];
      plannedItems += 1;
      sections[section].plannedItems += 1;
      const present = usable.some((entry) =>
        entry.item.nodeKey === node.key
        && entry.evidenceKey === evidence.key
        && entry.promptFamily === promptFamily
        && entry.difficultyTier === difficultyTier
      );
      if (present) {
        existingItems += 1;
        sections[section].existingItems += 1;
      } else {
        missingForEvidence += 1;
        sections[section].remainingItems += 1;
      }
    }
    if (missingForEvidence) generationBatchesRemaining += 1;
  }
}

process.stdout.write(`${JSON.stringify({
  taxonomy: {
    key: taxonomy.release.key,
    version: taxonomy.release.version,
    checksum: taxonomy.manifest.contentChecksum,
  },
  bankPath,
  bankExists: Boolean(bank),
  liveEvidenceDefinitions,
  deferredEvidenceDefinitions,
  plannedItems,
  existingItems,
  remainingItems: plannedItems - existingItems,
  generationBatchesRemaining,
  estimatedModelRequests: {
    generation: generationBatchesRemaining,
    judgesAtMost: plannedItems - existingItems,
  },
  sections,
  note: plannedItems === existingItems
    ? "The complete bank is authored locally; no model-generation calls remain. Human review is still required for every non-computed item."
    : "Remaining items may be authored locally or generated with the configured provider. Human review is required for every non-computed item.",
}, null, 2)}\n`);
