import { expect, it } from "vitest";
import { assessSkills, selectProbe, type Observation, type Probe, type Skill } from "./engine";

const skills: Skill[] = [
  ...Array.from({ length: 20 }, (_, i) => ({ id: `concept-${i}`, branch: `conjugation:concept-${i}` })),
  { id: "regular-er", branch: "conjugation:pattern:regular_er" },
  { id: "aller", branch: "conjugation:verb:aller" },
  { id: "avoir", branch: "conjugation:verb:avoir" },
].map(skill => ({ ...skill, domain: "conjugation", samplingGroup: "conjugaison", level: 0, modes: ["production"], prerequisites: [] }));
const probes: Probe[] = skills.flatMap(skill => Array.from({ length: 12 }, (_, i) => ({
  id: `${skill.id}:${i}`, skillId: skill.id, mode: "production", contextId: `${skill.id}:context:${i}`,
  difficulty: .25, guessProbability: .05, expectedSeconds: 30,
})));
function run(count: number, pool = probes, skip = false) {
  const history: Observation[] = [];
  for (let i = 0; i < count; i++) {
    const next = selectProbe(skills, pool, history);
    if (next.kind !== "question") throw Error("Expected a question");
    history.push({ ...next.item, itemId: next.item.id, correct: next.item.skillId !== "aller",
      activeSeconds: skip ? 0 : 30, skipped: skip ? true : undefined });
  }
  return { history, results: assessSkills(skills, history) };
}
it("samples concepts, regular patterns and individual verbs despite many concept branches", () => {
  const { history, results } = run(9);
  expect(history.filter(o => o.skillId.startsWith("concept-"))).toHaveLength(3);
  expect(history.filter(o => o.skillId === "regular-er")).toHaveLength(3);
  expect(history.filter(o => o.skillId === "aller")).toHaveLength(3);
  expect(results.find(r => r.skillId === "regular-er")?.status).toBe("mastered");
  expect(results.find(r => r.skillId === "aller")?.status).toBe("missing");
  expect(results.find(r => r.skillId === "avoir")?.status).toBe("unknown");
});
it("balances families on zero-time skips without recording weakness", () => {
  const { history, results } = run(9, probes, true);
  expect(history.filter(o => o.skillId.startsWith("concept-"))).toHaveLength(3);
  expect(history.filter(o => o.skillId === "regular-er")).toHaveLength(3);
  expect(history.filter(o => o.skillId === "aller")).toHaveLength(3);
  expect(results.every(r => r.status === "unknown")).toBe(true);
});
it("uses available families when no regular-pattern questions remain", () => {
  const { history } = run(6, probes.filter(probe => probe.skillId !== "regular-er"));
  expect(history.filter(o => o.skillId.startsWith("concept-"))).toHaveLength(3);
  expect(history.filter(o => o.skillId === "aller")).toHaveLength(3);
});
