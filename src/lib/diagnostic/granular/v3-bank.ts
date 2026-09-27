import { checksum, type TaxonomyCandidate } from "@/lib/taxonomy/validate";
import type { CanonicalDiagnosticBankArtifact } from "../item-bank";
import { buildV3Coverage } from "./v3-coverage";

/** Migrate unchanged content only. New/changed mappings remain explicit authoring work. */
export function prepareV3Bank(input: {
  previous: TaxonomyCandidate; target: TaxonomyCandidate;
  targetRelease: { key: string; version: string; checksum: string };
  source: CanonicalDiagnosticBankArtifact;
}) {
  const coverage = buildV3Coverage({ previous: input.previous, target: input.target, bank: input.source, independentProductionKeys: new Set() });
  const compatible = new Set(coverage.flatMap(node => node.evidence.filter(e => e.compatibility === "unchanged_contract").map(e => `${node.key}:${e.key}`)));
  const targetKeys = new Set(input.target.nodes.map(n => n.key));
  const included = input.source.items.filter(i => compatible.has(`${i.item.nodeKey}:${i.evidenceKey}`));
  const excluded = input.source.items.filter(i => !compatible.has(`${i.item.nodeKey}:${i.evidenceKey}`)).map(i => ({
    itemKey: i.itemKey, previousNodeKey: i.item.nodeKey, evidenceKey: i.evidenceKey,
    reason: targetKeys.has(i.item.nodeKey) ? "changed_evidence_contract" : "removed_node",
    action: "Review the exact target; never fan one broad-node approval out to multiple finer skills",
  }));
  const bank: CanonicalDiagnosticBankArtifact = {
    schemaVersion: 1, bank: { key: "french-diagnostic-bank-v3", version: "3.0.0" },
    taxonomy: { releaseKey: input.targetRelease.key, releaseVersion: input.targetRelease.version, checksum: input.targetRelease.checksum },
    generatedAt: input.source.generatedAt,
    items: structuredClone(included),
  };
  const missingSlots = coverage.flatMap(node => node.evidence.filter(e => e.assessmentStage === "initial_diagnostic").flatMap(e => {
    const count = included.filter(i => i.item.nodeKey === node.key && i.evidenceKey === e.key).length;
    return count >= e.requiredDistinct ? [] : [{ nodeKey: node.key, evidenceKey: e.key, expectation: e.expectation,
      actionFr: e.actionFr, requiredItems: e.requiredDistinct, existingItems: count, additionalItems: e.requiredDistinct - count }];
  }));
  return { bank, reconciliation: {
    status: "draft_requires_release_validation", sourceBank: input.source.bank.key,
    sourceChecksum: checksum(input.source), targetTaxonomyChecksum: input.targetRelease.checksum,
    reused: included.map(i => ({ itemKey: i.itemKey, sourceItemChecksum: checksum(i), unchangedContentAndEvidence: true,
      reviewStatus: i.reviewStatus, reviewProvenanceRetained: Boolean(i.review) })),
    excluded, missingSlots,
    independentProduction: coverage.flatMap(node => node.evidence.filter(e => e.assessmentStage === "learning_verification").map(e => ({ nodeKey: node.key, evidenceKey: e.key, successCriteria: e.successCriteria }))),
  } };
}
