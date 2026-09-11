import { expect, it } from "vitest";
import { assessSkills, selectProbe, type Observation, type Probe, type Skill } from "./engine";

function fixture() {
  const skills: Skill[] = ["reading", "conjugation", "spelling"].flatMap(domain =>
    Array.from({ length: 8 }, (_, branch) => ({
      id: `${domain}-${branch}`, branch: `${domain}-${branch}`, domain,
      level: 0, modes: ["production" as const], prerequisites: [],
    })));
  const bank: Probe[] = skills.flatMap(skill => Array.from({ length: 12 }, (_, index) => ({
    id: `${skill.id}:${index}`, skillId: skill.id, mode: "production" as const,
    contextId: `${skill.id}:context:${index}`, difficulty: .25,
    expectedSeconds: 30, guessProbability: .05,
  })));
  return { skills, bank };
}
function sample(count: number, response: (index: number) => boolean | "skip") {
  const { skills, bank } = fixture(), observations: Observation[] = [];
  for (let index = 0; index < count; index++) {
    const next = selectProbe(skills, bank, observations);
    if (next.kind !== "question") throw Error("Expected a question");
    const answer = response(index);
    observations.push({ ...next.item, itemId: next.item.id,
      correct: answer === true, skipped: answer === "skip" ? true : undefined, activeSeconds: 30 });
  }
  return { skills, bank, observations, results: assessSkills(skills, observations) };
}
it.each([true, false])("collects direct evidence in every domain for consistent outcome %s", correct => {
  const run = sample(12, () => correct);
  const domain = (id: string) => run.skills.find(skill => skill.id === id)!.domain;
  expect(new Set(run.observations.slice(0, 3).map(o => domain(o.skillId))).size).toBe(3);
  for (const name of ["reading", "conjugation", "spelling"]) {
    expect(run.results.some(result => domain(result.skillId) === name && result.status === (correct ? "mastered" : "missing"))).toBe(true);
  }
  expect(run.results.filter(result => !run.observations.some(o => o.skillId === result.skillId)).every(result => result.status === "unknown")).toBe(true);
});
it("rotates away from contradictory evidence after a bounded branch visit", () => {
  // Each domain sees alternating outcomes, so the first target stays unresolved.
  const run = sample(21, index => Math.floor(index / 3) % 2 === 0);
  for (const name of ["reading", "conjugation", "spelling"]) {
    const asked = run.observations.filter(o => run.skills.find(s => s.id === o.skillId)!.domain === name);
    expect(new Set(asked.slice(0, 6).map(o => o.skillId)).size).toBe(1);
    expect(asked[6].skillId).not.toBe(asked[0].skillId);
  }
});
it("counts skipped questions toward the visit limit without treating them as failure", () => {
  const run = sample(21, () => "skip");
  expect(new Set(run.observations.map(o => o.skillId)).size).toBe(6);
  expect(run.results.every(result => result.status === "unknown")).toBe(true);
});
it("checks the same target again at the difficulty floor before classifying a weakness", () => {
  const { skills, bank } = fixture();
  const target = skills[0], pool = bank.filter(probe => probe.skillId.startsWith("reading"));
  const first = pool.find(probe => probe.skillId === target.id)!;
  const observation: Observation = { ...first, itemId: first.id, correct: false, activeSeconds: 30 };
  const next = selectProbe(skills.filter(skill => skill.domain === "reading"), pool, [observation]);
  expect(next.kind).toBe("question");
  if (next.kind !== "question") throw Error("Expected a question");
  expect(next.item.skillId).toBe(target.id);
  expect(next.item.id).not.toBe(first.id);
  expect(next.reason).toBe("confirmation");
  expect(assessSkills([target], [observation])[0].status).toBe("uncertain");
});
