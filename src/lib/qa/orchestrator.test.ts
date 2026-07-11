import { describe, expect, it } from "vitest";
import { createRepairRecord, decideCandidate, orchestrateCandidateSet, type CandidateEvidence } from "./orchestrator";

const candidate = (partial: Partial<CandidateEvidence> & Pick<CandidateEvidence, "candidateId">): CandidateEvidence => ({ passage: { decision: "pass", hardFailures: [], softFailures: [] }, questions: [{ id: "q", decision: "pass", failures: [] }], risk: { decision: "pass", riskClass: "low", reasons: [] }, quality: { contractCompliance: .9, naturalness: .8, engagement: .8, questionQuality: .85 }, repairCount: 0, generationAttempt: 1, costUsd: .01, repairableFailureKeys: [], ...partial });

describe("decision orchestrator", () => {
  it("lets hard failures override perfect aggregate scores", () => {
    const result = decideCandidate(candidate({ candidateId: "bad", passage: { decision: "fail", hardFailures: ["excluded_tense"], softFailures: [] }, quality: { contractCompliance: 1, naturalness: 1, engagement: 1, questionQuality: 1 }, generationAttempt: 3 }));
    expect(result.decision).toBe("quarantine"); expect(result.hardFailures).toContain("excluded_tense");
  });
  it("allows exactly one repair and preserves original provenance with a diff", () => {
    const value = candidate({ candidateId: "repair", passage: { decision: "fail", hardFailures: ["word_count"], softFailures: [] }, repairableFailureKeys: ["word_count"] });
    expect(decideCandidate(value).decision).toBe("repair_once"); expect(decideCandidate({ ...value, repairCount: 1 }).decision).toBe("regenerate");
    const record = createRepairRecord({ originalCandidateId: "repair", original: { body: "a" }, repaired: { body: "ab" }, repairNumber: 1 });
    expect(record).toMatchObject({ parentCandidateId: "repair", originalSnapshot: { body: "a" }, diff: { changed: true } });
    expect(() => createRepairRecord({ originalCandidateId: "repair", original: {}, repaired: {}, repairNumber: 2 })).toThrow(/one repair/);
  });
  it("terminates repeated failure safely at retry limit", () => {
    expect(decideCandidate(candidate({ candidateId: "repeat", passage: { decision: "fail", hardFailures: ["grammar"], softFailures: [] }, generationAttempt: 3 })).decision).toBe("quarantine");
  });
  it("quarantines prohibited risk regardless of quality", () => {
    expect(decideCandidate(candidate({ candidateId: "unsafe", risk: { decision: "reject", riskClass: "prohibited", reasons: ["prohibited_risk"] } }))).toMatchObject({ decision: "quarantine" });
  });
  it("advances only the highest-ranked fully eligible candidate", () => {
    const result = orchestrateCandidateSet([candidate({ candidateId: "second", quality: { contractCompliance: .8, naturalness: .8, engagement: .8, questionQuality: .8 } }), candidate({ candidateId: "first", quality: { contractCompliance: .95, naturalness: .9, engagement: .9, questionQuality: .95 } })]);
    expect(result).toMatchObject({ decision: "accept_provisionally", selectedCandidateId: "first" });
    expect(result.candidateDecisions.find((item) => item.candidateId === "second")?.decision).toBe("not_selected");
  });
  it("obeys total cost ceilings", () => {
    expect(decideCandidate(candidate({ candidateId: "cost", passage: { decision: "fail", hardFailures: ["grammar"], softFailures: [] }, costUsd: 1, generationAttempt: 1 })).decision).toBe("quarantine");
  });
});
