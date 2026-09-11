import { readFileSync, writeFileSync } from "node:fs";
import { prepareV3Bank } from "../src/lib/diagnostic/granular/v3-bank";
const read = (path: string) => JSON.parse(readFileSync(path,"utf8"));
const previous = read("generated/french-taxonomy-v2.json"), target = read("generated/french-taxonomy-v3.json");
const result = prepareV3Bank({ previous: previous.taxonomy, target: target.taxonomy,
  targetRelease: { key: target.release.key, version: target.release.version, checksum: target.manifest.contentChecksum },
  source: read("generated/diagnostic-bank-v2.json") });
for (const [path, value] of [
  ["generated/diagnostic-bank-v3-candidate.json", result.bank],
  ["docs/diagnostic/v3-bank-reconciliation.json", result.reconciliation],
] as const) {
  const serialized = JSON.stringify(value,null,2)+"\n";
  if (process.argv.includes("--check")) { if(readFileSync(path,"utf8")!==serialized) throw Error(`Stale candidate: ${path}`); }
  else writeFileSync(path, serialized);
}
console.log(JSON.stringify({ reusedItems: result.bank.items.length, excludedItems: result.reconciliation.excluded.length,
  missingEvidenceDefinitions: result.reconciliation.missingSlots.length,
  additionalMinimumItems: result.reconciliation.missingSlots.reduce((s,r)=>s+r.additionalItems,0),
  independentProductionDefinitions: result.reconciliation.independentProduction.length }));
