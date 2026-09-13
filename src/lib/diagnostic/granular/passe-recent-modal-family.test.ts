import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { beforeAll, expect, it } from "vitest";
import { conjugate, PERSONS } from "@/lib/linguistic/conjugation";
import { validateAnswer } from "@/lib/linguistic/validator";
import { checksum } from "@/lib/taxonomy/validate";
import type { CanonicalDiagnosticBankItem } from "../item-bank";
import { canonicalProbeMetrics } from "./probe-metrics";
import { questionAssessedMaterialKeys, questionMaterialKeys, teachingMaterialKeys } from "./material-annotations";
import { isQuestionPoolSufficient } from "./question-pools";
import { validateTeachingTargets } from "./teaching-content";
import { PASSE_RECENT_MODAL_QUESTIONS, PASSE_RECENT_MODAL_TARGETS, PASSE_RECENT_MODAL_TEACHING } from "./passe-recent-modal-family";
import { buildPasseRecentModalExpansion, type PasseRecentModalExpansion } from "./passe-recent-modal-expansion";
import type { V3Assessment } from "./v3-adapter";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const frozenCandidatePath = `${homedir()}/.codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json`;
const frozenCandidate = existsSync(frozenCandidatePath) ? read(frozenCandidatePath) : null;
const candidate = read("docs/diagnostic/v3-scoped-review-candidate.json");
const taxonomyArtifact = read("generated/french-taxonomy-v3.json");
const base = read("generated/diagnostic-bank-v3-draft.json");
const registry = read("docs/diagnostic/remaining-target-goals-2026-09-13.json");
const targetIds = PASSE_RECENT_MODAL_TARGETS.map(target => `produire_passe_recent::writing-controlled-production::verb:${target.verb}`);
let artifact: PasseRecentModalExpansion;
let items: CanonicalDiagnosticBankItem[];

beforeAll(async () => {
  artifact = await buildPasseRecentModalExpansion(taxonomyArtifact, base);
  items = artifact.items;
});

function assessment(): V3Assessment {
  const skills = (candidate.assessment.skills as V3Assessment["skills"]).filter(skill => targetIds.includes(skill.id));
  const annotations = new Map(artifact.annotations.map(annotation => [annotation.itemKey, annotation]));
  const initial = new Set<string>(artifact.poolIntents.initial);
  return {
    taxonomyChecksum: candidate.assessment.taxonomyChecksum,
    bankChecksum: checksum(items),
    skills,
    probes: items.map(entry => {
      const annotation = annotations.get(entry.itemKey);
      if (!annotation || annotation.kind === "evidence") throw new Error(`Missing facet annotation for ${entry.itemKey}`);
      const skill = skills.find(candidateSkill => candidateSkill.facetKey === annotation.facetKey);
      if (!skill) throw new Error(`Missing exact skill for ${entry.itemKey}`);
      return {
        id: entry.itemKey,
        skillId: skill.id,
        mode: "production" as const,
        contextId: annotation.contextKey,
        usage: initial.has(entry.itemKey) ? "initial" as const : "learning" as const,
        materialKeys: questionMaterialKeys(entry.item),
        assessedMaterialKeys: questionAssessedMaterialKeys(entry.item),
        ...canonicalProbeMetrics(entry),
      };
    }),
  };
}

const frozenInventoryIt = frozenCandidate ? it : it.skip;
frozenInventoryIt("keeps the 184-target registry equal to the revision-41 544 minus 360 scoped graph complement", () => {
  const revisionCandidate = frozenCandidate!;
  const graph = new Set<string>((revisionCandidate.assessment.skills as Array<{ id: string }>).map(skill => skill.id));
  const supported = new Set<string>(revisionCandidate.assessment.releaseScope.assessmentSkillIds);
  const remaining = [...graph].filter(skillId => !supported.has(skillId)).sort();
  const tracked = (registry.targets as Array<{ id: string; skillId: string; tasks: unknown[] }>).map(target => target.skillId).sort();
  expect(graph.size).toBe(544);
  expect(supported.size).toBe(360);
  expect(remaining).toHaveLength(184);
  expect(tracked).toEqual(remaining);
  expect(new Set(registry.targets.map((target: { id: string }) => target.id)).size).toBe(184);
  expect(registry.targets.every((target: { tasks: unknown[] }) => target.tasks.length === 5)).toBe(true);
});

it("authors exact C001 to C003 targets without changing their graph requirements", () => {
  const prepared = assessment();
  expect(prepared.skills.map(skill => skill.id).sort()).toEqual([...targetIds].sort());
  for (const target of PASSE_RECENT_MODAL_TARGETS) {
    const skillId = `produire_passe_recent::writing-controlled-production::verb:${target.verb}`;
    const skill = prepared.skills.find(candidateSkill => candidateSkill.id === skillId)!;
    const tracked = registry.targets.find((candidateTarget: { id: string }) => candidateTarget.id === target.registryId);
    expect(skill.prerequisites).toEqual(tracked.prerequisites);
    expect(skill.evidenceRequirements).toEqual(tracked.requirements);
    expect(tracked.tasks.map((task: { id: string; dependsOn: string[] }) => ({ id: task.id, dependsOn: task.dependsOn }))).toEqual([
      { id: `${target.registryId}.Q`, dependsOn: ["P4.01"] },
      { id: `${target.registryId}.L`, dependsOn: ["P4.01"] },
      { id: `${target.registryId}.V`, dependsOn: [`${target.registryId}.Q`, `${target.registryId}.L`, "P2.02"] },
      { id: `${target.registryId}.R`, dependsOn: [`${target.registryId}.V`] },
      { id: `${target.registryId}.O`, dependsOn: [`${target.registryId}.Q`, `${target.registryId}.L`] },
    ]);
  }
});

it("produces separate sufficient initial and follow-up pools across persons and difficulty tiers", () => {
  const prepared = assessment();
  expect(PASSE_RECENT_MODAL_QUESTIONS).toHaveLength(36);
  expect(items).toHaveLength(36);
  expect(new Set(items.map(entry => entry.itemKey)).size).toBe(36);
  for (const skill of prepared.skills) {
    const rows = prepared.probes.filter(probe => probe.skillId === skill.id);
    for (const usage of ["initial", "learning"] as const) {
      const pool = rows.filter(probe => probe.usage === usage);
      expect(pool).toHaveLength(6);
      expect(new Set(pool.map(probe => probe.contextId)).size).toBe(6);
      expect(new Set(pool.map(probe => probe.difficulty))).toEqual(new Set([0.25, 0.5, 0.75]));
      expect(isQuestionPoolSufficient(pool, skill, "production", usage === "learning")).toBe(true);
    }
    const sourceRows = PASSE_RECENT_MODAL_QUESTIONS.filter(row => skill.id.endsWith(`:verb:${row.verb}`));
    for (const usage of ["initial", "learning"] as const) {
      expect(new Set(sourceRows.filter(row => row.pool === usage).map(row => row.person))).toEqual(new Set(PERSONS));
    }
  }
});

it("keeps guided material separate and states the controlled-form naturalness boundary", () => {
  const prepared = assessment();
  expect(() => validateTeachingTargets(prepared, PASSE_RECENT_MODAL_TEACHING)).not.toThrow();
  for (const target of PASSE_RECENT_MODAL_TARGETS) {
    expect(target.lesson.status).toBe("draft_requires_review");
    expect(target.lesson.practice).toHaveLength(6);
    expect(target.lesson.boundaryFr).toMatch(/transformation contrôlée|construction demandée|production libre/);
    expect(target.ownerReviewQuestionsFr).toHaveLength(2);
    const taught = new Set(teachingMaterialKeys(target.lesson));
    const assessed = items.filter(entry => entry.item.validatorConfig?.verb === target.verb).flatMap(entry => questionAssessedMaterialKeys(entry.item));
    expect(assessed.some(key => taught.has(key))).toBe(false);
  }
  expect(PASSE_RECENT_MODAL_TARGETS.find(target => target.verb === "savoir")!.lesson.boundaryFr).toContain("venir d’apprendre que");
  expect(JSON.stringify(PASSE_RECENT_MODAL_TARGETS)).not.toMatch(/—|delve into/);
});

it("retains deterministic answer keys and rejects incomplete or wrongly conjugated groups", async () => {
  for (const entry of items) {
    expect(entry.reviewStatus).toBe("needs_human_review");
    expect(entry.review).toBeUndefined();
    expect(entry.qcGates.verdict).toBe("needs_human_review");
    const config = entry.item.validatorConfig!;
    expect(entry.item.correctAnswer).toBe(conjugate(String(config.verb), "passe_recent", config.person as Parameters<typeof conjugate>[2]));
    const spec = { validatorType: entry.item.validatorType, correctAnswer: entry.item.correctAnswer, config };
    expect((await validateAnswer(entry.item.correctAnswer!, spec)).pass).toBe(true);
    expect((await validateAnswer(entry.item.correctAnswer!.replace(" de ", " "), spec)).pass).toBe(false);
    expect((await validateAnswer(conjugate(String(config.verb), "present", config.person as Parameters<typeof conjugate>[2]), spec)).pass).toBe(false);
  }
  const { checksum: recorded, ...content } = artifact;
  expect(checksum(content)).toBe(recorded);
  expect(artifact.claimScope).toBe("controlled_form_only");
  expect(artifact.naturalnessReview.every((row: { status: string }) => row.status === "awaiting_real_review")).toBe(true);
});
