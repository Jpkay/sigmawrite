import { writeFileSync } from "node:fs";
import { assessSkills, selectProbe, type Observation, type Probe, type Skill } from "../src/lib/diagnostic/granular/engine";
import { buildGranularPriorities } from "../src/lib/diagnostic/granular/pathway";
const skills: Skill[] = ["etre", "avoir"].flatMap(verb => ["present", "imparfait", "pqp"].map((tense, level) => ({
  id: `${verb}-${tense}`, domain: "conjugation", branch: verb, level, prerequisites: [], modes: ["production"],
})));
const bank = (nodes: Skill[]): Probe[] => nodes.flatMap(s => s.modes.flatMap(mode => Array.from({ length: 12 }, (_, i) => ({
  id: `${s.id}-${mode}-${i}`, skillId: s.id, mode, contextId: `context-${i}`, difficulty: i / 12,
  expectedSeconds: 20, guessProbability: mode === "recognition" ? .25 : .05,
}))));
function run(nodes: Skill[], response: (item: Probe) => boolean) {
  const pool = bank(nodes), history: Observation[] = [];
  for (let i = 0; i < 200; i++) {
    const selection = selectProbe(nodes, pool, history);
    if (selection.kind !== "question") return { end: selection.kind, questions: history.length,
      results: assessSkills(nodes, history), priorities: buildGranularPriorities(nodes, assessSkills(nodes, history)) };
    const item = selection.item;
    history.push({ itemId: item.id, skillId: item.skillId, mode: item.mode, contextId: item.contextId,
      correct: response(item), guessProbability: item.guessProbability, activeSeconds: 20 });
  }
  throw Error("Run did not terminate");
}
function random(seed: number) { let value = seed >>> 0; return () => { value = (Math.imul(1664525, value) + 1013904223) >>> 0; return value / 2 ** 32; }; }
const deterministic = Array.from({ length: 64 }, (_, mask) => {
  const known = new Set(skills.filter((_, i) => mask & (1 << i)).map(s => s.id));
  const result = run(skills, item => known.has(item.skillId));
  const incorrect = result.results.filter(r => r.status !== (known.has(r.skillId) ? "mastered" : "missing"));
  const inappropriatePriorities = result.priorities.filter(p => known.has(p.skillId) || p.action !== "learn");
  return { profile: mask, known: [...known], questions: result.questions, ending: result.end, classificationErrors: incorrect.length, inappropriatePriorities: inappropriatePriorities.length };
});
const stochastic = ["all_known", "all_unknown", "mixed", "guessing_only"].map(profile => {
  let falseMastery = 0, falseMissing = 0, unresolved = 0, questions = 0, classifications = 0;
  for (let seed = 1; seed <= 256; seed++) {
    const rng = random(seed), nodes: Skill[] = skills.map(s => ({ ...s, modes: [profile === "all_unknown" ? "production" : "recognition"] }));
    const known = (id: string) => profile === "all_known" || (profile === "mixed" && id.startsWith("etre"));
    const result = run(nodes, item => rng() < (known(item.skillId) ? .9 : item.guessProbability));
    questions += result.questions;
    for (const r of result.results) {
      classifications++;
      if (!known(r.skillId) && r.status === "mastered") falseMastery++;
      if (known(r.skillId) && r.status === "missing") falseMissing++;
      if (!r.resolved) unresolved++;
    }
  }
  return { profile, runs: 256, classifications, falseMastery, falseMissing, unresolved, averageQuestions: questions / 256 };
});
const report = { scope: "Synthetic routing regression; not student calibration or production validation", deterministic, stochastic };
writeFileSync("docs/diagnostic/granular-simulation-report.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ deterministicProfiles: deterministic.length,
  deterministicErrors: deterministic.reduce((sum, r) => sum + r.classificationErrors + r.inappropriatePriorities, 0), stochastic }, null, 2));
if (deterministic.some(r => r.classificationErrors || r.inappropriatePriorities)) process.exitCode = 1;
