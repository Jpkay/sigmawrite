import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { adaptV3ForAssessment } from "./v3-adapter";
import { applyFacetTargets } from "./facet-adapter";
import { buildV3Facets } from "./facets";
import { assessSkills, DEFAULT_POLICY, selectProbe, type Observation, type Probe } from "./engine";
import { inspectAssessmentGraph } from "./release-graph";
import { bindAssessmentRelease } from "./release-binding";
import { CONJUGATION_CHALLENGE_ORDER } from "./conjugation-challenge";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const artifact = read("generated/french-taxonomy-v3.json"), bank = read("generated/diagnostic-bank-v3-draft.json");
const base = adaptV3ForAssessment({ artifact, bank });
const refined = applyFacetTargets(base, buildV3Facets(artifact.taxonomy), bank).assessment;
const skills = ["produire_present_indicatif", "produire_futur_simple", "produire_conditionnel_present"].map(node =>
  refined.skills.find(skill => skill.facetKey === `${node}::verb:aller`)!);
const probes: Probe[] = skills.flatMap(skill => Array.from({ length: 8 }, (_, i) => ({
  id: `${skill.id}:${i}`, skillId: skill.id, mode: "production", contextId: `context-${i}`,
  difficulty: .5, expectedSeconds: 30, guessProbability: .05,
})));
const observation = (probe: Probe, correct: boolean): Observation => ({ ...probe, itemId: probe.id, correct,
  activeSeconds: 30, occasionId: "same-sitting", unaided: true });

it("starts with the present even though it has greater hard-prerequisite depth than conditional", () => {
  expect(skills[0].level).toBeGreaterThan(skills[2].level);
  const next = selectProbe(skills, probes, []);
  expect(next.kind === "question" && next.item.skillId).toBe(skills[0].id);
});
it("moves from confirmed present forms to a later tense without certifying that tense", () => {
  const history = probes.filter(p => p.skillId === skills[0].id).slice(0, 3).map(p => observation(p, true));
  const next = selectProbe(skills, probes, history);
  expect(next.kind === "question" && next.item.skillId).toBe(skills[1].id);
  expect(next.kind === "question" && next.reason).toBe("step_up");
  const results = assessSkills(skills, history);
  expect(results[0].resolved).toBe(false); // The approved second occasion is still required.
  expect(results[1].status).toBe("unknown");
  expect(results[2].status).toBe("unknown");
});
it("steps down from conditional to future to present and returns to the failed boundary", () => {
  const history: Observation[] = [];
  const select = () => {
    const next = selectProbe(skills, probes, history, { ...DEFAULT_POLICY, startingLevel: 4 });
    if (next.kind !== "question") throw Error("Expected question");
    return next;
  };
  const conditional = select(); expect(conditional.item.skillId).toBe(skills[2].id);
  history.push(observation(conditional.item, false));
  const future = select(); expect(future.item.skillId).toBe(skills[1].id);
  expect(future.reason).toBe("step_down"); history.push(observation(future.item, false));
  for (let i = 0; i < 3; i++) {
    const present = select(); expect(present.item.skillId).toBe(skills[0].id);
    history.push(observation(present.item, true));
  }
  const boundary = select(); expect(boundary.item.skillId).toBe(skills[1].id);
  expect(boundary.reason).toBe("recheck_boundary");
  expect(boundary.item.id).not.toBe(future.item.id);
});
it("preserves approved prerequisite depth and rejects unversioned challenge mutations", () => {
  for (const skill of refined.skills) {
    const parent = base.skills.find(parent => parent.nodeKey === skill.nodeKey && parent.evidenceKey === skill.evidenceKey)!;
    expect(skill.level).toBe(parent.level);
  }
  expect(inspectAssessmentGraph(refined.skills)).toBe(true);
  const changed = structuredClone(refined);
  changed.skills.find(skill => skill.facetKey === "produire_conditionnel_present::verb:aller")!.challengeOrder = 0;
  expect(inspectAssessmentGraph(changed.skills)).toBe(false);
  const ids = { taxonomyId: "test", bankId: "test" };
  expect(bindAssessmentRelease(changed, ids).checksum).not.toBe(bindAssessmentRelease(refined, ids).checksum);
  const unrelated = structuredClone(refined.skills);
  unrelated.find(skill => skill.domain === "reading_comprehension")!.challengeOrder = 1;
  expect(inspectAssessmentGraph(unrelated)).toBe(false);
});

it("maps recognition and interpretation to draft tense ranks while preserving separate evidence targets", () => {
  expect(refined.skills.find(skill => skill.nodeKey === "produire_contraste_pc_imparfait")?.assessmentStage).toBe("learning");
  for (const [nodeKey, rank] of Object.entries(CONJUGATION_CHALLENGE_ORDER.ranks)) {
    const parents = base.skills.filter(skill => skill.nodeKey === nodeKey);
    expect(parents.length, nodeKey).toBeGreaterThan(0);
    expect(parents.every(skill => skill.samplingGroup === "conjugaison" && skill.challengeOrder === undefined)).toBe(true);
    const targets = refined.skills.filter(skill => skill.nodeKey === nodeKey);
    expect(targets.every(skill => skill.challengeOrder === rank), nodeKey).toBe(true);
    for (const target of targets) {
      expect(target.evidenceKey).toBe(parents.find(parent => parent.evidenceKey === target.evidenceKey)!.evidenceKey);
    }
  }
});

it("begins tense interpretation with present use and probes later use after sufficient evidence", () => {
  const targets = ["interpreter_usages_present", "interpreter_futur_proche", "interpreter_conditionnel_present"].map(node =>
    refined.skills.find(skill => skill.nodeKey === node)!);
  const pool: Probe[] = targets.flatMap(skill => Array.from({ length: 6 }, (_, i) => ({
    id: `${skill.id}:interpretation:${i}`, skillId: skill.id, mode: skill.modes[0],
    contextId: `interpretation-context-${i}`, difficulty: .5, expectedSeconds: 30, guessProbability: .25,
  })));
  const history: Observation[] = [];
  for (let i = 0; i < 4; i++) {
    const next = selectProbe(targets, pool, history);
    if (next.kind !== "question") throw Error("Expected question");
    expect(next.item.skillId).toBe(targets[0].id);
    history.push(observation(next.item, true));
  }
  const next = selectProbe(targets, pool, history);
  expect(next.kind === "question" && next.item.skillId).toBe(targets[1].id);
  const results = assessSkills(refined.skills, history);
  expect(results.find(result => result.skillId === targets[2].id)?.status).toBe("unknown");
  expect(results.filter(result => refined.skills.find(skill => skill.id === result.skillId)?.nodeKey === "produire_present_indicatif").every(result => result.status === "unknown")).toBe(true);
});
