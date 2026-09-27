import "dotenv/config";
import { buildInterestReadingItems } from "../src/lib/diagnostic/interest-reading-items";
import { assessReadingIdeas } from "../src/lib/linguistic/reading-ideas";
if (!process.argv.includes("--live")) throw new Error("Pass --live to check the proposed reading content against the evaluator.");
const keyFilter = process.argv.find((arg) => arg.startsWith("--key="))?.slice(6);
const items = buildInterestReadingItems().filter((entry) => !keyFilter || entry.key === keyFilter);
if (!items.length) throw new Error("No matching authored item");
let failures = 0;
for (let i=0;i<items.length;i+=3) await Promise.all(items.slice(i,i+3).map(async ({key,item}) => {
  try {
    const result = await assessReadingIdeas(item.correctAnswer!, { validatorType: "exact", config: item.validatorConfig, assessment: { promptFr: item.promptFr, instructionsFr: item.instructionsFr } });
    if (!result.pass) failures++;
    console.log(JSON.stringify({ key, ok: result.pass, feedback: result.reason }));
  } catch (error) { failures++; console.log(JSON.stringify({key,ok:false,error: error instanceof Error ? error.message : "unavailable", cause: error instanceof Error && error.cause instanceof Error ? error.cause.message.slice(0,200) : undefined})); }
}));
console.log(`${items.length-failures}/${items.length} authored answer checks passed`);
if (failures) process.exitCode=1;
