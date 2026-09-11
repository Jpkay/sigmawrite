import { expect, it } from "vitest";
import { assessGranularReadiness, type ReviewedProbe } from "./readiness";
import type { Skill } from "./engine";
const skill: Skill = { id: "etre-present", branch: "etre", level: 0, modes: ["production"], prerequisites: [] };
const bank: ReviewedProbe[] = Array.from({ length: 6 }, (_, i) => ({ id: `item-${i}`, skillId: skill.id, mode: "production", contextId: `context-${i}`, difficulty: .5, expectedSeconds: 20, guessProbability: .05, reviewStatus: "approved" }));
it("requires reviewed coverage and activities for each node", () => {
 expect(assessGranularReadiness([skill], bank, new Set([skill.id])).ready).toBe(true);
 const gaps = assessGranularReadiness([skill], bank.map(i => ({ ...i, reviewStatus: "draft" })), new Set());
 expect(gaps.ready).toBe(false);
 expect(gaps.issues.map(i => i.reason)).toEqual(["missing_items", "missing_contexts", "missing_learning_activity"]);
});
it("cannot replace a missing sibling skill with more questions on another", () => {
 const missing = { ...skill, id: "avoir-present" };
 const result = assessGranularReadiness([skill, missing], bank, new Set([skill.id, missing.id]));
 expect(result.ready).toBe(false); expect(result.issues.every(i => i.skillId === missing.id)).toBe(true);
});
it("requires reserve questions for contradictions and refinement", () => {
 expect(assessGranularReadiness([skill], bank.slice(0, 3), new Set([skill.id])).ready).toBe(false);
});
it("rejects cyclic and missing learning dependencies", () => {
 expect(assessGranularReadiness([{ ...skill, prerequisites: [skill.id] }], bank, new Set([skill.id])).issues).toContainEqual({ skillId: skill.id, reason: "cycle" });
 expect(assessGranularReadiness([{ ...skill, prerequisites: ["missing"] }], bank, new Set([skill.id])).issues).toContainEqual({ skillId: skill.id, reason: "missing_prerequisite" });
});
