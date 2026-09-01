import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildFrenchTaxonomyV2, type FrenchTaxonomyV2Artifact } from "../src/lib/taxonomy/french-v2";
import type { BaselineLexiconArtifact } from "../src/lib/lexicon/baseline";
import { checksum, validateTaxonomy } from "../src/lib/taxonomy/validate";

const output = resolve("generated/french-taxonomy-v2.json");
if (process.argv.includes("--check")) {
  const current = JSON.parse(readFileSync(output, "utf8")) as FrenchTaxonomyV2Artifact;
  const { manifest, ...content } = current;
  if (checksum(content) !== manifest.contentChecksum) throw new Error("generated/french-taxonomy-v2.json content checksum is invalid");
  if (!validateTaxonomy(current.taxonomy).valid) throw new Error("generated/french-taxonomy-v2.json contains an invalid frozen taxonomy");
  process.stdout.write(`${JSON.stringify({ output, checksum: manifest.contentChecksum, coverage: current.coverage, frozen: true })}\n`);
  process.exit(0);
}
const artifact = buildFrenchTaxonomyV2({
  ontologyText: readFileSync("docs/french-ontology-v1.md", "utf8"),
  sourceRegisterText: readFileSync("docs/french-source-register.md", "utf8"),
  lexical: JSON.parse(readFileSync("generated/french-baseline-lexicon.json", "utf8")) as BaselineLexiconArtifact,
});
const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
writeFileSync(output, serialized, "utf8");
process.stdout.write(`${JSON.stringify({ output, checksum: artifact.manifest.contentChecksum, coverage: artifact.coverage, warnings: artifact.validation.issues.length })}\n`);
