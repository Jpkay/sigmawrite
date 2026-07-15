import { readFileSync } from "node:fs";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";
import {
  validateCanonicalDiagnosticBank,
  type CanonicalDiagnosticBankArtifact,
} from "../src/lib/diagnostic/item-bank";
import { DIAGNOSTIC_DIFFICULTY_TIERS } from "../src/lib/diagnostic/item-authoring";
import { sectionForStrand } from "../src/lib/diagnostic/protocol";

const taxonomy = JSON.parse(
  readFileSync("generated/french-taxonomy-v2.json", "utf8"),
) as FrenchTaxonomyV2Artifact;
const bankPath = process.argv[2] ?? "generated/diagnostic-bank-v2.json";
const bank = JSON.parse(readFileSync(bankPath, "utf8")) as CanonicalDiagnosticBankArtifact;
const releaseValidation = validateCanonicalDiagnosticBank(bank, taxonomy.taxonomy);
const hardIssues = releaseValidation.issues.filter((issue) =>
  !issue.endsWith("item is not release-approved")
);
const projected = {
  ...bank,
  items: bank.items.map((entry) => entry.reviewStatus === "needs_human_review"
    ? {
        ...entry,
        reviewStatus: "human_approved" as const,
        review: {
          // Audit-only projection. This never mutates the canonical artifact or
          // database and is deliberately not a real reviewer identity.
          reviewerProfileId: "draft-structure-audit-only",
          reviewedAt: "2026-07-12T00:00:00.000Z",
        },
      }
    : entry),
};
const projectedValidation = validateCanonicalDiagnosticBank(
  projected,
  taxonomy.taxonomy,
);
const slotIssues: string[] = [];
for (const node of taxonomy.taxonomy.nodes) {
  const sectionKey = sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0]);
  if (!sectionKey) continue;
  for (const evidence of node.evidence) {
    if (evidence.expectation === "independent_production") continue;
    const entries = bank.items.filter((entry) =>
      entry.item.nodeKey === node.key
      && entry.evidenceKey === evidence.key
      && entry.reviewStatus !== "rejected"
      && entry.qcGates.verdict !== "rejected"
    );
    if (entries.length !== DIAGNOSTIC_DIFFICULTY_TIERS.length) {
      slotIssues.push(`${node.key}:${evidence.key} has ${entries.length}/3 items`);
    }
    for (let index = 0; index < DIAGNOSTIC_DIFFICULTY_TIERS.length; index += 1) {
      if (!entries.some((entry) => entry.difficultyTier === DIAGNOSTIC_DIFFICULTY_TIERS[index])) {
        slotIssues.push(`${node.key}:${evidence.key} lacks ${DIAGNOSTIC_DIFFICULTY_TIERS[index]}`);
      }
    }
    if (node.strand === "comprehension_ecrite") {
      const textKeys = new Set(entries.map((entry) =>
        String(entry.item.validatorConfig?.sourceTextKey ?? "")
      ).filter(Boolean));
      const requiredTexts = Number(evidence.successCriteria.minimumDistinctTexts ?? 1);
      if (textKeys.size < requiredTexts) {
        slotIssues.push(`${node.key}:${evidence.key} has ${textKeys.size}/${requiredTexts} text sources`);
      }
      const requiredTypes = Number(evidence.successCriteria.minimumTextTypes ?? 1);
      const textTypes = new Set(entries.map((entry) =>
        String(entry.item.validatorConfig?.sourceTextType ?? "")
      ).filter(Boolean));
      if (textTypes.size < requiredTypes) {
        slotIssues.push(`${node.key}:${evidence.key} has ${textTypes.size}/${requiredTypes} text types`);
      }
    }
  }
}

const reviewCounts = bank.items.reduce<Record<string, number>>((counts, entry) => {
  counts[entry.reviewStatus] = (counts[entry.reviewStatus] ?? 0) + 1;
  return counts;
}, {});
const structurallyReady = hardIssues.length === 0
  && slotIssues.length === 0
  && projectedValidation.valid;
const report = {
  bankPath,
  checksum: releaseValidation.manifest.checksum,
  itemCount: bank.items.length,
  reviewCounts,
  structurallyReady,
  publishReady: releaseValidation.valid,
  hardIssues,
  slotIssues,
  projectedIssues: projectedValidation.issues,
  sectionsAfterRequiredReviews: projectedValidation.sections,
  note: "The approval projection verifies structure only; it does not replace human review.",
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!structurallyReady) process.exitCode = 1;
