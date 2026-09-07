import "dotenv/config";
import { readFileSync } from "node:fs";
import { buildLocalReadingDraftItems } from "../src/lib/diagnostic/local-reading-items";
import { assessReadingIdeas } from "../src/lib/linguistic/reading-ideas";
import { READING_GRADING_CASES } from "./fixtures/reading-grading-cases";

if (!process.argv.includes("--live")) throw new Error("Use --live to run the opt-in provider evaluation. This does not write student data.");
const bank = await buildLocalReadingDraftItems(JSON.parse(readFileSync("generated/french-taxonomy-v2.json", "utf8")).taxonomy);
const cases = process.argv.includes("--sample") ? READING_GRADING_CASES.filter(([key]) => key === "relier_preuve_interpretation:street").slice(0, 3) : READING_GRADING_CASES;
let failed = 0;
// Bounded concurrency to exercise real paraphrases, not just listed-answer shortcuts.
for (let start = 0; start < cases.length; start += 3) {
  await Promise.all(cases.slice(start, start + 3).map(async ([key, answer, expected]) => {
    const item = bank.find(({ item }) => `${item.nodeKey}:${item.validatorConfig?.sourceTextKey}` === key && item.responseType !== "mcq")!.item;
    try {
      const result = await assessReadingIdeas(answer, { validatorType: "exact", config: item.validatorConfig, assessment: { promptFr: item.promptFr, instructionsFr: item.instructionsFr } });
      const ok = result.pass === expected;
      if (!ok) failed++;
      console.log(JSON.stringify({ ok, key, answer, expected, actual: result.pass, feedback: result.reason }));
    } catch (error) { failed++; console.log(JSON.stringify({ ok: false, key, error: error instanceof Error ? error.message : "unavailable", cause: error instanceof Error && error.cause instanceof Error ? error.cause.message.slice(0,150) : undefined })); }
  }));
}
console.log(`${cases.length - failed}/${cases.length} checks passed`);
if (failed) process.exitCode = 1;
