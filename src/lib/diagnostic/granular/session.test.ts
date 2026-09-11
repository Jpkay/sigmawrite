import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY, type Probe, type Skill } from "./engine";
import { createSession, sessionView, transitionSession, type AssessmentSession, type SessionEvent } from "./session";
const release = { taxonomyId: "taxonomy-1", bankId: "bank-1", checksum: "pinned-content" };
const skills: Skill[] = ["etre", "avoir"].map(id => ({ id, branch: id, domain: "conjugation", level: 0, modes: ["production"], prerequisites: [] }));
const bank: Probe[] = skills.flatMap(s => Array.from({ length: 8 }, (_, i) => ({ id: `${s.id}-${i}`, skillId: s.id, mode: "production", contextId: `context-${i}`, difficulty: .5, expectedSeconds: 5, guessProbability: .05 })));
const policy = { ...DEFAULT_POLICY, activeSeconds: 60 };
function apply(state: AssessmentSession, event: SessionEvent) {
  return transitionSession({ state, release, expectedRevision: state.revision, event, skills, bank, policy });
}
describe("granular diagnostic to learning lifecycle", () => {
  it("cannot resume a paused assessment through a stray heartbeat", () => {
    const state = createSession(release);
    expect(apply(state, { type: "pulse", at: 1_000 })).toBe(state);
  });
  it("preserves a pending question across a long pause and serialized resume", () => {
    let state = apply(createSession(release), { type: "resume", at: 0 });
    const item = state.pendingItemId;
    state = apply(state, { type: "pulse", at: 10_000 });
    state = apply(state, { type: "pause", at: 15_000 });
    state = apply(JSON.parse(JSON.stringify(state)), { type: "resume", at: 86_400_000 });
    expect(state.activeSeconds).toBe(15); expect(state.pendingItemId).toBe(item);
    state = apply(state, { type: "answer", at: 86_405_000, itemId: item!, correct: false });
    expect(state.observations[0].activeSeconds).toBe(20);
  });
  it("starts learning at the time budget, without declaring untested skills missing", () => {
    let state = apply(createSession(release), { type: "resume", at: 0 });
    for (const at of [15_000, 30_000, 45_000, 60_000]) state = apply(state, { type: "pulse", at });
    const view = sessionView(state, skills, policy);
    expect(state).toMatchObject({ phase: "learning", completionReason: "time_budget", pendingItemId: null });
    expect(view.provisional).toBe(true); expect(view.remainingSeconds).toBe(0);
    expect(view.results.every(r => r.status === "unknown")).toBe(true);
    expect(view.priorities.every(p => p.action === "verify")).toBe(true);
  });
  it("does not charge a disconnected tab for hours", () => {
    let state = apply(createSession(release), { type: "resume", at: 0 });
    state = apply(state, { type: "pulse", at: 3_600_000 });
    expect(state.activeSeconds).toBe(30); expect(state.phase).toBe("assessing");
  });
  it("keeps an answer arriving at the limit before producing results", () => {
    let state = apply(createSession(release), { type: "resume", at: 0 });
    state = apply(state, { type: "pulse", at: 30_000 });
    state = apply(state, { type: "answer", at: 60_000, itemId: state.pendingItemId!, correct: true });
    expect(state.phase).toBe("learning"); expect(state.observations).toHaveLength(1);
  });
  it("rejects release substitution, stale writes and answers for an unserved question", () => {
    const state = apply(createSession(release), { type: "resume", at: 0 });
    const input = { state, release, expectedRevision: state.revision, event: { type: "pulse", at: 1 } as const, skills, bank };
    expect(() => transitionSession({ ...input, release: { ...release, checksum: "different" } })).toThrow(/release changed/);
    expect(() => transitionSession({ ...input, expectedRevision: 0 })).toThrow(/Stale/);
    expect(() => apply(state, { type: "answer", at: 1, itemId: "etre-7", correct: true })).toThrow(/active question/);
  });
  it("ignores duplicate accepted answers without changing evidence or time", () => {
    let state = apply(createSession(release), { type: "resume", at: 0 });
    const answer = { type: "answer", at: 5_000, itemId: state.pendingItemId!, correct: false } as const;
    state = apply(state, answer);
    expect(apply(state, { ...answer, at: 10_000 })).toBe(state);
  });
  it("refines unresolved skills during learning only from new independent evidence", () => {
    let state = apply(createSession(release), { type: "resume", at: 0 });
    state = apply(state, { type: "pulse", at: 30_000 });
    state = apply(state, { type: "pulse", at: 60_000 });
    const event = { type: "refine", itemId: "etre-0", correct: true, independent: true, hintsUsed: false, firstAttempt: true, occasionId: "learning-1" } as const;
    expect(apply(state, { ...event, hintsUsed: true }).refinements).toHaveLength(0);
    expect(apply(state, { ...event, firstAttempt: false }).refinements).toHaveLength(0);
    const guided = apply(state, { ...event, hintsUsed: true });
    expect(apply(guided, event)).toBe(guided);
    for (let i = 0; i < 3; i++) state = apply(state, { ...event, itemId: `etre-${i}` });
    const view = sessionView(state, skills, policy);
    expect(view.results.find(r => r.skillId === "etre")?.status).toBe("mastered");
    expect(view.results.find(r => r.skillId === "avoir")?.status).toBe("unknown");
    expect(view.priorities.map(p => p.skillId)).toEqual(["avoir"]);
    expect(state.activeSeconds).toBe(60);
    expect(apply(state, event)).toBe(state);
  });
});
