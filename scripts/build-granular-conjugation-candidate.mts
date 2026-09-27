import { writeFileSync } from "node:fs";
import { buildGranularConjugationBank } from "../src/lib/diagnostic/granular/conjugation";
const bank=buildGranularConjugationBank();
const output="docs/diagnostic/granular-conjugation-candidate.json";
writeFileSync(output,JSON.stringify(bank,null,2)+"\n");
console.log(JSON.stringify({output,status:bank.status,skills:bank.skills.length,questions:bank.items.length}));
