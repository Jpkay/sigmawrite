import { readFileSync } from "node:fs";
import { beforeAll, expect, it } from "vitest";
import { validateAnswer } from "@/lib/linguistic/validator";
import { checksum } from "@/lib/taxonomy/validate";
import type { CanonicalDiagnosticBankItem } from "../item-bank";
import { buildCauseRelationExpansion, type CauseRelationExpansion } from "./cause-relation-expansion";
import { CAUSE_PRODUCTION_QUESTIONS, CAUSE_RECOGNITION_QUESTIONS, CAUSE_RELATION_ANALYSES, CAUSE_RELATION_REVIEW, CAUSE_RELATION_TEACHING } from "./cause-relation-family";
import { questionAssessedMaterialKeys, questionMaterialKeys, teachingMaterialKeys } from "./material-annotations";
import { assessesNegativeExample } from "./negative-examples";
import { canonicalProbeMetrics } from "./probe-metrics";
import { isQuestionPoolSufficient } from "./question-pools";
import { validateTeachingTargets } from "./teaching-content";
import type { V3Assessment } from "./v3-adapter";
import { granularBankOptions } from "../../../../scripts/lib/granular-bank-options";
import { selectedDraftExpansionSources, selectedTeachingDrafts } from "../../../../scripts/lib/granular-authoring-selection";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const taxonomyArtifact = read("generated/french-taxonomy-v3.json");
const base = read("generated/diagnostic-bank-v3-draft.json");
const candidate = read("docs/diagnostic/v3-scoped-review-candidate.json");
const registry = read("docs/diagnostic/remaining-target-goals-2026-09-13.json");
const targetIds = ["relation_cause::reading-analysis", "relation_cause::writing-controlled-production"];
let artifact: CauseRelationExpansion;
let items: CanonicalDiagnosticBankItem[];

beforeAll(async () => {
  artifact = await buildCauseRelationExpansion(taxonomyArtifact, base);
  items = artifact.items;
});

function assessment(): V3Assessment {
  const skills = (candidate.assessment.skills as V3Assessment["skills"]).filter(skill => targetIds.includes(skill.id));
  const annotations = new Map(artifact.annotations.map(annotation => [annotation.itemKey, annotation]));
  const initial = new Set(artifact.poolIntents.initial);
  return {
    taxonomyChecksum: candidate.assessment.taxonomyChecksum,
    bankChecksum: checksum(items),
    skills,
    probes: items.map(entry => {
      const annotation = annotations.get(entry.itemKey);
      if (!annotation || annotation.kind !== "evidence") throw new Error(`Missing evidence annotation for ${entry.itemKey}`);
      const skillId = `${annotation.evidenceTarget.nodeKey}::${annotation.evidenceTarget.evidenceKey}`;
      const skill = skills.find(candidateSkill => candidateSkill.id === skillId);
      if (!skill) throw new Error(`Missing exact skill for ${entry.itemKey}`);
      return {
        id: entry.itemKey,
        skillId,
        mode: skill.modes[0],
        contextId: annotation.contextKey,
        usage: initial.has(entry.itemKey) ? "initial" as const : "learning" as const,
        materialKeys: questionMaterialKeys(entry.item),
        assessedMaterialKeys: questionAssessedMaterialKeys(entry.item),
        negativeExampleAssessed: assessesNegativeExample(entry.item),
        ...canonicalProbeMetrics(entry),
      };
    }),
  };
}

it("authors C081 and C082 against their exact approved evidence contracts", () => {
  const prepared = assessment();
  expect(prepared.skills.map(skill => skill.id).sort()).toEqual([...targetIds].sort());
  for (const registryId of ["C081", "C082"]) {
    const tracked = registry.targets.find((target: { id: string }) => target.id === registryId);
    const skill = prepared.skills.find(candidateSkill => candidateSkill.id === tracked.skillId);
    expect(skill?.prerequisites).toEqual(tracked.prerequisites);
    expect(skill?.evidenceRequirements).toEqual(tracked.requirements);
    expect(tracked.tasks.map((task: { id: string; dependsOn: string[] }) => ({ id: task.id, dependsOn: task.dependsOn }))).toEqual([
      { id: `${registryId}.Q`, dependsOn: ["P4.01"] },
      { id: `${registryId}.L`, dependsOn: ["P4.01"] },
      { id: `${registryId}.V`, dependsOn: [`${registryId}.Q`, `${registryId}.L`, "P2.02"] },
      { id: `${registryId}.R`, dependsOn: [`${registryId}.V`] },
      { id: `${registryId}.O`, dependsOn: [`${registryId}.Q`, `${registryId}.L`] },
    ]);
  }
});

it("keeps sufficient initial and follow-up recognition pools with real counterexamples", () => {
  const prepared = assessment();
  const skill = prepared.skills.find(candidateSkill => candidateSkill.id === targetIds[0])!;
  expect(CAUSE_RECOGNITION_QUESTIONS).toHaveLength(12);
  for (const usage of ["initial", "learning"] as const) {
    const pool = prepared.probes.filter(probe => probe.skillId === skill.id && probe.usage === usage);
    expect(pool).toHaveLength(6);
    expect(new Set(pool.map(probe => probe.difficulty))).toEqual(new Set([0.25, 0.5, 0.75]));
    expect(pool.filter(probe => probe.negativeExampleAssessed)).toHaveLength(3);
    expect(isQuestionPoolSufficient(pool, skill, "recognition", usage === "learning")).toBe(true);
  }
  for (const entry of items.filter(candidateItem => candidateItem.evidenceKey === "reading-analysis")) {
    expect(entry.item.responseType).toBe("mcq");
    expect(entry.item.choices?.map(choice => choice.text)).toEqual([...CAUSE_RELATION_ANALYSES]);
    expect(entry.item.choices?.filter(choice => choice.correct)).toHaveLength(1);
  }
});

it("keeps sufficient unaided production pools with a new assessed sentence per item", () => {
  const prepared = assessment();
  const skill = prepared.skills.find(candidateSkill => candidateSkill.id === targetIds[1])!;
  const productionItems = items.filter(entry => entry.evidenceKey === "writing-controlled-production");
  expect(CAUSE_PRODUCTION_QUESTIONS).toHaveLength(16);
  expect(productionItems).toHaveLength(16);
  const assessed = productionItems.flatMap(entry => questionAssessedMaterialKeys(entry.item));
  expect(new Set(assessed).size).toBe(16);
  for (const usage of ["initial", "learning"] as const) {
    const pool = prepared.probes.filter(probe => probe.skillId === skill.id && probe.usage === usage);
    expect(pool).toHaveLength(8);
    expect(new Set(pool.map(probe => probe.difficulty))).toEqual(new Set([0.25, 0.5, 0.75]));
    expect(pool.every(probe => probe.guessProbability === 0.5)).toBe(true);
    expect(isQuestionPoolSufficient(pool, skill, "production", usage === "learning")).toBe(true);
  }
});

it("grades the controlled combination and rejects copying or reversing the cause", async () => {
  const entries = new Map(items.map(entry => [entry.itemKey.split(":").at(-1), entry]));
  for (const row of CAUSE_PRODUCTION_QUESTIONS) {
    const item = entries.get(row.key)!.item;
    const spec = {
      validatorType: item.validatorType,
      correctAnswer: item.correctAnswer,
      acceptableAnswers: item.acceptableAnswers,
      config: item.validatorConfig,
    };
    expect((await validateAnswer(row.answer, spec)).pass).toBe(true);
    expect((await validateAnswer(row.answer.slice(0, -1), spec)).pass).toBe(true);
    expect((await validateAnswer(row.reverse, spec)).pass).toBe(false);
    expect((await validateAnswer(`${row.effect} ${row.reason}`, spec)).pass).toBe(false);
  }
});

it("keeps guided material disjoint and leaves teaching and item review pending", () => {
  const prepared = assessment();
  expect(() => validateTeachingTargets(prepared, CAUSE_RELATION_TEACHING)).not.toThrow();
  const taught = new Set(CAUSE_RELATION_TEACHING.flatMap(teachingMaterialKeys));
  const assessed = items.flatMap(entry => questionAssessedMaterialKeys(entry.item));
  expect(assessed.some(key => taught.has(key))).toBe(false);
  expect(new Set(assessed).size).toBe(assessed.length);
  for (const lesson of CAUSE_RELATION_TEACHING) {
    expect(lesson.status).toBe("draft_requires_review");
    expect(lesson.steps.length).toBeLessThanOrEqual(3);
    expect(lesson.practice).toHaveLength(6);
  }
  expect(items.every(entry => entry.reviewStatus === "needs_human_review" && !entry.review)).toBe(true);
  expect(CAUSE_RELATION_REVIEW.every(row => row.status === "awaiting_real_review")).toBe(true);
  expect(JSON.stringify({ CAUSE_RELATION_TEACHING, CAUSE_RECOGNITION_QUESTIONS, CAUSE_PRODUCTION_QUESTIONS })).not.toMatch(/—|delve into/);
  expect(artifact.claimScope).toBe("sentence_level_recognition_and_controlled_combination");
  const { checksum: recorded, ...content } = artifact;
  expect(checksum(content)).toBe(recorded);
});

it("selects the cause questions and lessons only through the complete revision 42 option chain", () => {
  const r41 = ["--bank-revision", "41", "--verb-family-recognition", "--etre-participle-agreement", "--question-detail-reading", "--local-definition-reading", "--avoir-participle-agreement", "--causal-reading-genres"];
  const r42 = [r41[0], "42", ...r41.slice(2), "--cause-relation-family"];
  expect(granularBankOptions(r42).causeRelationFamily).toBe(true);
  expect(selectedDraftExpansionSources(r41)).not.toContain("cause-relation-family");
  expect(selectedTeachingDrafts(r41)).not.toEqual(expect.arrayContaining([...CAUSE_RELATION_TEACHING]));
  expect(selectedDraftExpansionSources(r42)).toContain("cause-relation-family");
  expect(selectedTeachingDrafts(r42)).toEqual(expect.arrayContaining([...CAUSE_RELATION_TEACHING]));
});
