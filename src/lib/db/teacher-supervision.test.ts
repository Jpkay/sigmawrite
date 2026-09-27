import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  guard: vi.fn(),
  rpc: vi.fn(),
  service: vi.fn(),
  latestSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireRole: f.guard }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: f.rpc }),
  createServiceClient: f.service,
}));
vi.mock("@/lib/diagnostic/granular/release-content-cache", () => ({ sharedReleaseContentCache: {} }));
vi.mock("@/lib/diagnostic/granular/store", () => ({
  SupabaseAssessmentStore: class {
    latestSession = f.latestSession;
  },
}));
vi.mock("@/lib/diagnostic/granular/session", () => ({
  sessionView: () => ({
    phase: "learning",
    provisional: true,
    results: [{ skillId: "skill", status: "uncertain", evidence: "direct", resolved: false, modes: [{ mode: "recognition", probability: .6, distinctItems: 2, distinctContexts: 2, distinctOccasions: 1, accuracy: .5, confirmed: false }] }],
  }),
}));
vi.mock("@/lib/diagnostic/granular/release-scope", () => ({
  inspectReleaseScope: () => ({ assessmentSkillIds: new Set(["skill"]), deferredSkillIds: ["deferred"], scope: { limitationFr: "Partiel." } }),
}));

import { loadTeacherGranularReport } from "./teacher-supervision";

describe("loadTeacherGranularReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.guard.mockResolvedValue({ id: "teacher", role: "teacher" });
  });

  it("denies before constructing any service-backed read", async () => {
    f.rpc.mockResolvedValue({ data: false, error: null });

    await expect(loadTeacherGranularReport("other-student")).resolves.toBeNull();

    expect(f.rpc).toHaveBeenCalledWith("can_view_student", { p_student_id: "other-student" });
    expect(f.service).not.toHaveBeenCalled();
    expect(f.latestSession).not.toHaveBeenCalled();
  });

  it("fails closed on an authorization RPC error before any service read", async () => {
    f.rpc.mockResolvedValue({ data: null, error: { message: "rpc unavailable" } });

    await expect(loadTeacherGranularReport("student")).rejects.toThrow("vérification de l’accès");

    expect(f.service).not.toHaveBeenCalled();
    expect(f.latestSession).not.toHaveBeenCalled();
  });

  it("returns a bounded aggregate without answer or bank material", async () => {
    f.rpc.mockResolvedValue({ data: true, error: null });
    f.service.mockReturnValue({ secret: "service-client" });
    f.latestSession.mockResolvedValue({
      session: {
        state: {
          completionReason: "later_evidence_required",
          activeSeconds: 125,
          observations: [{ skipped: false }, { skipped: true }],
          refinements: [{ correct: true }, { correct: false }],
          completedTeachingIds: ["lesson", "lesson"],
          teaching: { contentId: "lesson", phase: "practice", exerciseIndex: 1, responses: [{ answer: "private guided answer" }] },
          diagnosticResponses: [{ answer: "private response" }],
        },
      },
      bundle: {
        assessment: {
          releaseScope: { private: "scope-source" },
          skills: [{ id: "skill", labelFr: "Compétence", domain: "grammar", branch: "grammar", modes: ["recognition"] }],
        },
        teachingContent: [{ id: "lesson", titleFr: "Leçon actuelle", practice: [{}, {}, {}], answerFr: "private lesson key" }],
        bank: { correctAnswer: "private answer key" },
      },
    });

    const result = await loadTeacherGranularReport("student");
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({ answeredCount: 1, skippedCount: 1, supportedSkillCount: 1, unsupportedSkillCount: 1, learningProgress: { completedGuidedLessons: 1, independentChecks: 2, successfulIndependentChecks: 1, currentGuided: { titleFr: "Leçon actuelle", phase: "practice", exerciseIndex: 1, totalExercises: 3 } } });
    expect(serialized).not.toContain("private response");
    expect(serialized).not.toContain("private answer key");
    expect(serialized).not.toContain("correctAnswer");
    expect(serialized).not.toContain("diagnosticResponses");
    expect(serialized).not.toContain("private guided answer");
    expect(serialized).not.toContain("private lesson key");
  });
});
