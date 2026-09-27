import "dotenv/config";
import { coachReadingLanguage } from "../src/lib/linguistic/language-coach";
if (!process.argv.includes("--live")) throw new Error("Pass --live for the opt-in language coaching check.");
const cases = [
  { answer: "Les joueur communiquent mieux et perdent moins souvent le ballon.", requested: false, needsTip: true },
  { answer: "Les joueurs communiquent mieux et perdent moins souvent le ballon.", requested: true, needsTip: false },
  { answer: "Les joueurs parlent davantage pendant les passes, ce qui les aide à garder le ballon", requested: false, needsTip: false },
  { answer: "Les joueurs ont progresser grâce à leurs échanges.", requested: true, needsTip: true },
];
let failures = 0;
for (const example of cases) {
  const result = await coachReadingLanguage({ ...example, prompt: "Lis le texte. Des joueurs apprennent à communiquer pendant les passes et perdent moins souvent le ballon.", previousAnswers: [] });
  const ok = result.available && Boolean(result.tip) === example.needsTip;
  if (!ok) failures++;
  console.log(JSON.stringify({ ok, ...example, result }));
}
console.log(`${cases.length-failures}/${cases.length} coaching checks passed`);
if (failures) process.exitCode = 1;
