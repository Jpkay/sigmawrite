import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateTaxonomy } from "../src/lib/taxonomy/validate";

const candidatePath = resolve(process.argv[2] ?? "taxonomy/french-v1-candidate.json");
const outputFlag = process.argv.indexOf("--output");
const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;
const input = JSON.parse(readFileSync(candidatePath, "utf8")) as unknown;
const result = validateTaxonomy(input);
const report = `${JSON.stringify(result, null, 2)}\n`;

if (outputPath) writeFileSync(resolve(outputPath), report, "utf8");
process.stdout.write(report);
if (!result.valid) process.exitCode = 1;

