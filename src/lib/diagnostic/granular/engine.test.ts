import { describe, expect, it } from "vitest";
import { assessSkills, DEFAULT_POLICY, selectProbe, type Observation, type Probe, type Skill } from "./engine";
const skill = (id: string, branch: string, level: number, prerequisites: string[] = []): Skill => ({ id, branch, level, prerequisites, modes: ["production"] });
const skills = [skill("etre-present", "etre", 0), skill("etre-imparfait", "etre", 1, ["etre-present"]), skill("etre-pqp", "etre", 2, ["etre-imparfait"]), skill("avoir-present", "avoir", 0), skill("avoir-imparfait", "avoir", 1, ["avoir-present"]), skill("avoir-pqp", "avoir", 2, ["avoir-imparfait"])];
function items(nodes: Skill[]): Probe[] {
 return nodes.flatMap(s => s.modes.flatMap(mode => Array.from({ length: 6 }, (_, n) => ({ id: `${s.id}-${mode}-${n}`, skillId: s.id, mode, contextId: `context-${n}`, difficulty: n / 5, expectedSeconds: 20, guessProbability: mode === "recognition" ? 1/3 : .05 }))));
}
const bank = items(skills);
function observation(item: Probe, correct: boolean): Observation { return { itemId: item.id, skillId: item.skillId, mode: item.mode, contextId: item.contextId, correct, guessProbability: item.guessProbability, activeSeconds: 20 }; }
function simulate(nodes: Skill[], correct: (item: Probe) => boolean) {
 const pool = items(nodes), history: Observation[] = [], reasons: string[] = [];
 for(let i = 0; i < 200; i++) { const next = selectProbe(nodes, pool, history); if(next.kind !== "question") return { history, reasons, ending: next, results: assessSkills(nodes, history) }; reasons.push(next.reason); history.push(observation(next.item, correct(next.item))); }
 throw new Error("Adaptive run did not terminate");
}
describe("independent skill frontiers", () => {
 it("distinguishes être from avoir despite identical tense and domain", () => {
  const run = simulate(skills, item => item.skillId.startsWith("etre"));
  expect(run.ending.kind).toBe("finished");
  for(const result of run.results) expect(result.status).toBe(result.skillId.startsWith("etre") ? "mastered" : "missing");
 });
 it("finds different tense boundaries within two verbs", () => {
  const known = new Set(["etre-present", "etre-imparfait", "avoir-present"]);
  const run = simulate(skills, item => known.has(item.skillId));
  expect(run.ending.kind).toBe("finished");
  for(const result of run.results) expect(result.status).toBe(known.has(result.skillId) ? "mastered" : "missing");
  expect(run.reasons).toContain("step_down");expect(run.reasons).toContain("recheck_boundary");
 });
 it("does not infer mastery of être or prerequisites from an avoir success", () => {
  const history = bank.filter(i => i.skillId === "avoir-pqp").slice(0,3).map(i => observation(i,true));
  const results = assessSkills(skills,history);
  expect(results.find(r=>r.skillId==="avoir-pqp")?.status).toBe("mastered");
  expect(results.filter(r=>r.skillId!=="avoir-pqp").every(r=>r.status==="unknown")).toBe(true);
 });
 it("detects an advanced skill with a missing prerequisite rather than smoothing it away", () => {
  const run = simulate(skills, item => item.skillId !== "etre-present");
  expect(run.results.find(r=>r.skillId==="etre-present")?.status).toBe("missing");
  expect(run.results.find(r=>r.skillId==="etre-pqp")?.status).toBe("mastered");
 });
 it("keeps recognition and production separate", () => {
  const nodes: Skill[] = [{...skills[0],modes:["recognition","production"]}];
  const run=simulate(nodes,item=>item.mode==="recognition");
  expect(run.ending.kind).toBe("finished");expect(run.results[0].status).toBe("fragile");
  expect(run.results[0].modes.find(m=>m.mode==="recognition")!.probability).toBeGreaterThan(.85);
  expect(run.results[0].modes.find(m=>m.mode==="production")!.probability).toBeLessThan(.2);
 });
 it("one answer, repeated submissions, or repeated context cannot certify mastery", () => {
  const response=observation(bank[0],true);
  expect(assessSkills(skills,[response,response,response])[0].status).toBe("uncertain");
  const copied=bank.slice(0,3).map(i=>({...observation(i,true),contextId:"same"}));
  expect(assessSkills(skills,copied)[0].status).toBe("uncertain");
 });
 it("returns a provisional map at the time budget with unresolved skills rather than manufacturing a level", () => {
  const response={...observation(bank[0],true),activeSeconds:40};
  expect(selectProbe(skills,bank,[response],{...DEFAULT_POLICY,activeSeconds:40})).toMatchObject({kind:"provisional",reason:"time_budget"});
 });
 it("flags unavailable coverage instead of calling an untestable student weak", () => {
  expect(selectProbe(skills,[],[])).toMatchObject({kind:"coverage_gap",unresolvedSkillIds:skills.map(s=>s.id)});
 });
 it("surveys both branches rather than spending the entire sitting on one verb", () => {
  const first=selectProbe(skills,bank,[]);if(first.kind!=="question")throw Error("No item");
  const second=selectProbe(skills,bank,[observation(first.item,false)]);if(second.kind!=="question")throw Error("No item");
  expect(skills.find(s=>s.id===first.item.skillId)!.branch).not.toBe(skills.find(s=>s.id===second.item.skillId)!.branch);
 });
});

describe("confidence and domain safeguards", () => {
 it("does not overwrite an accepted observation with a conflicting retry", () => {
  const accepted = bank.filter(i => i.skillId === "etre-present").slice(0, 3).map(i => observation(i, false));
  const retries = accepted.map(o => ({ ...o, correct: true }));
  expect(assessSkills(skills, [...accepted, ...retries])[0].status).toBe("missing");
 });
 it("does not certify a contradictory three-answer pattern", () => {
  const history = bank.filter(i => i.skillId === "etre-present").slice(0, 3).map((item, i) => observation(item, i !== 2));
  expect(assessSkills(skills, history)[0]).toMatchObject({ status: "uncertain", resolved: false });
 });
 it("balances domain time before the number of verb branches", () => {
  const nodes = [
   ...skills.map(s => ({ ...s, domain: "conjugation" })),
   { ...skill("inference", "reading", 0), domain: "reading" },
   { ...skill("agreement", "spelling", 0), domain: "spelling" },
  ];
  const pool = items(nodes), history: Observation[] = [], domains: string[] = [];
  for (let i = 0; i < 3; i++) {
   const next = selectProbe(nodes, pool, history); if (next.kind !== "question") throw Error("No item");
   domains.push(nodes.find(n => n.id === next.item.skillId)!.domain);
   history.push(observation(next.item, true));
  }
  expect(new Set(domains).size).toBe(3);
 });
});
