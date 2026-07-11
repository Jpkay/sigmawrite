import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildBaselineLexicon, verifyBaselineArtifact } from "../src/lib/lexicon/baseline";

const inputPath = resolve(process.argv[2] ?? "taxonomy/lexicon/sigma-pilot-corpus.json");
const outputPath = resolve(process.argv[3] ?? "generated/french-baseline-lexicon.json");
const artifact = buildBaselineLexicon(JSON.parse(readFileSync(inputPath, "utf8")) as unknown);
if (!verifyBaselineArtifact(artifact)) throw new Error("Generated lexical manifest failed its checksum verification.");
writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ outputPath, ...artifact.report, checksum: artifact.manifest.contentChecksum })}\n`);

