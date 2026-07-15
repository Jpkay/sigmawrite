import { readFileSync } from "node:fs";
import type { FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";
import {
  validateCanonicalDiagnosticBank,
  type CanonicalDiagnosticBankArtifact,
} from "../src/lib/diagnostic/item-bank";

const taxonomy = JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")) as FrenchTaxonomyV2Artifact;
const bank = JSON.parse(readFileSync("generated/diagnostic-bank-v2.json", "utf8")) as CanonicalDiagnosticBankArtifact;
if (bank.taxonomy.releaseKey !== taxonomy.release.key || bank.taxonomy.checksum !== taxonomy.manifest.contentChecksum) {
  throw new Error("Diagnostic bank is pinned to a different taxonomy artifact.");
}
const result = validateCanonicalDiagnosticBank(bank, taxonomy.taxonomy);
if (!result.valid) {
  throw new Error(`Diagnostic bank is not publishable: ${[...result.issues, ...result.sections.filter((section) => !section.ready).map((section) => `${section.key} is not ready`)].join("; ")}`);
}
if (bank.manifest?.checksum !== result.manifest.checksum) throw new Error("Diagnostic bank manifest is stale.");
process.stdout.write(`${JSON.stringify({ ok: true, manifest: result.manifest })}\n`);
