import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildPasseRecentModalExpansion } from "../src/lib/diagnostic/granular/passe-recent-modal-expansion";
import type { CanonicalDiagnosticBankArtifact } from "../src/lib/diagnostic/item-bank";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const taxonomyArtifact = read("generated/french-taxonomy-v3.json");
const base = read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
const artifact = await buildPasseRecentModalExpansion(taxonomyArtifact, base);
const outputPath = process.argv.find(argument => argument.startsWith("--output="))?.slice("--output=".length)
  ?? "tmp/coverage-passe-recent-modal-family.json";
if (!outputPath.startsWith("tmp/coverage-")) throw new Error("Experimental output must stay under tmp/coverage-*");
const output = JSON.stringify(artifact, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(outputPath, "utf8") !== output) throw new Error(`Stale experimental artifact: ${outputPath}`);
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, "utf8");
}
console.log(JSON.stringify({
  outputPath,
  questions: artifact.items.length,
  initial: artifact.poolIntents.initial.length,
  learning: artifact.poolIntents.learning.length,
}));
