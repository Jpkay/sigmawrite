import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";
import type { CanonicalDiagnosticBankArtifact } from "../src/lib/diagnostic/item-bank";
const taxonomy = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")) as FrenchTaxonomyV2Artifact;
const bank = JSON.parse(readFileSync("generated/diagnostic-bank-v2.json", "utf8")) as CanonicalDiagnosticBankArtifact;
const eligible = bank.items.filter(entry => entry.reviewStatus === "human_approved" || (
  entry.reviewStatus === "auto_approved" && entry.item.validatorType === "conjugator"
  && (entry.qcGates as { gate0_computed?: { applied?: boolean } }).gate0_computed?.applied
));
const nodes = taxonomy.taxonomy.nodes.map(node => {
  const items = eligible.filter(entry => entry.item.nodeKey === node.key);
  const evidence = node.evidence.map(e => ({
    key: e.key, expectation: e.expectation,
    requiredDistinctItems: e.successCriteria.minimumDistinctItems,
    availableDistinctItems: new Set(items.filter(i => i.evidenceKey === e.key).map(i => i.itemKey)).size,
  }));
  return { key: node.key, label: node.labelFr, strand: node.strand,
    eligibleItems: items.length, evidence,
    confirmable: evidence.filter(e => e.expectation !== "independent_production")
      .every(e => e.availableDistinctItems >= Math.max(2, e.requiredDistinctItems)),
  };
});
const report = {
  source: "Canonical release artifacts; not a fresh database export",
  eligibleItems: eligible.length,
  nodes: nodes.length,
  uncoveredNodes: nodes.filter(n => n.eligibleItems === 0).length,
  confirmableNodes: nodes.filter(n => n.confirmable && n.eligibleItems > 0).length,
  hasSeparateEtreAvoirProductionNodes: ["produire_etre_present", "produire_avoir_present"].every(key => nodes.some(n => n.key === key)),
  sections: Object.fromEntries([...new Set(nodes.map(n => n.strand))].map(strand => {
    const group = nodes.filter(n => n.strand === strand);
    return [strand, { nodes: group.length, uncovered: group.filter(n => !n.eligibleItems).length,
      confirmable: group.filter(n => n.confirmable && n.eligibleItems > 0).length }];
  })),
  details: nodes,
};
const output = resolve(process.argv[2] ?? "docs/diagnostic/granular-coverage-audit.json");
writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ ...report, details: undefined, output }, null, 2));
