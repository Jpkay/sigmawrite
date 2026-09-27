import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { resolve } from "node:path";
import { buildCauseRelationExpansion } from "../src/lib/diagnostic/granular/cause-relation-expansion";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const outputArg = process.argv.find(argument => argument.startsWith("--output="));
const outputPath = outputArg?.slice("--output=".length) ?? "tmp/coverage-cause-relation-family.json";
const normalizedOutput = resolve(outputPath);
const allowedRoot = `${resolve("tmp")}/coverage-`;
if (!normalizedOutput.startsWith(allowedRoot)) {
  throw new Error("Coverage drafts may only be written under tmp/coverage-*");
}

const artifact = await buildCauseRelationExpansion(
  read("generated/french-taxonomy-v3.json"),
  read("generated/diagnostic-bank-v3-draft.json"),
);
const output = `${JSON.stringify(artifact, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if (readFileSync(normalizedOutput, "utf8") !== output) throw new Error("Stale cause-relation coverage draft");
} else {
  mkdirSync(dirname(normalizedOutput), { recursive: true });
  writeFileSync(normalizedOutput, output);
}
console.log(JSON.stringify({
  output: normalizedOutput,
  questions: artifact.items.length,
  initial: artifact.poolIntents.initial.length,
  learning: artifact.poolIntents.learning.length,
  status: artifact.status,
}));
