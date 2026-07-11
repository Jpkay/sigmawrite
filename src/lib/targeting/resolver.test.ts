import { describe, expect, it } from "vitest";
import { resolveStudentTargets, type LearnerProfile, type ResolverState, type TargetCandidate } from "./resolver";

const candidate = (partial: Partial<TargetCandidate> & Pick<TargetCandidate, "id" | "nodeId" | "source">): TargetCandidate => ({ targetType: "competency", mastery: .5, uncertainty: .2, predictedSuccess: .8, hardPrerequisiteIds: [], ...partial });
const state = (profile: LearnerProfile, candidates: TargetCandidate[]): ResolverState => ({ now: "2026-07-11T12:00:00Z", profile, candidates, masteryByNode: { root: .9 }, activeCourseVersionId: "course-v1" });

describe("student target resolver", () => {
  it("is deterministic and centers normal work at predicted success .80", () => {
    const value = state("l1", [candidate({ id: "b", nodeId: "b", source: "new_learning", predictedSuccess: .83 }), candidate({ id: "a", nodeId: "a", source: "new_learning", predictedSuccess: .8 })]);
    expect(resolveStudentTargets(value)).toEqual(resolveStudentTargets(value));
    expect(resolveStudentTargets(value).difficultyZone).toMatchObject({ center: .8, semantic: "predicted_task_success" });
    expect(resolveStudentTargets(value).targets[0].id).toBe("a");
  });
  it("blocks dependents with unmastered hard prerequisites", () => {
    const value = { ...state("l2", [candidate({ id: "dependent", nodeId: "d", source: "course", hardPrerequisiteIds: ["missing"] })]), masteryByNode: { missing: .4 } };
    expect(resolveStudentTargets(value).blockedCandidateIds).toEqual(["dependent"]);
  });
  it("prioritises missing foundations and overdue review while preserving course context", () => {
    const result = resolveStudentTargets(state("heritage", [candidate({ id: "course", nodeId: "c", source: "course" }), candidate({ id: "gap", nodeId: "g", source: "diagnostic_gap" }), candidate({ id: "due", nodeId: "d", source: "due_retrieval", dueAt: "2026-06-01T00:00:00Z" })]));
    expect(result.targets.slice(0, 2).map((item) => item.id)).toEqual(["due", "gap"]);
    expect(result.activeCourseVersionId).toBe("course-v1"); expect(result.explanation.preservesCourseProgress).toBe(true);
  });
  it.each(["l1", "l2", "heritage", "immersion"] as LearnerProfile[])("resolves a realistic %s profile", (profile) => {
    const result = resolveStudentTargets(state(profile, [candidate({ id: profile, nodeId: profile, source: "new_learning" })]));
    expect(result).toMatchObject({ targets: [{ id: profile }] });
  });
  it("uses conservative choices for cold start and high uncertainty", () => {
    expect(resolveStudentTargets({ ...state("immersion", [candidate({ id: "uncertain", nodeId: "u", source: "quiz_calibration", uncertainty: .9, predictedSuccess: .88 })]), coldStart: true })).toMatchObject({ policy: "conservative", confidence: "low" });
  });
  it("keeps mastery, percentile, completion, and difficulty semantics separate", () => {
    const result = resolveStudentTargets(state("l1", [candidate({ id: "a", nodeId: "a", source: "new_learning" })]));
    expect(result).toMatchObject({ difficultyZone: { semantic: "predicted_task_success" }, explanation: { masteryThreshold: .85, percentile: null, forcedScore: null } });
  });
  it("uses receptive/productive conjugation gaps", () => {
    const result = resolveStudentTargets(state("heritage", [candidate({ id: "balanced", nodeId: "b", source: "course", targetType: "conjugation", receptiveScore: .6, productiveScore: .6 }), candidate({ id: "production-gap", nodeId: "p", source: "course", targetType: "conjugation", receptiveScore: .95, productiveScore: .35 })]));
    expect(result.targets[0].id).toBe("production-gap");
  });
});
