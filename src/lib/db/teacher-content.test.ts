import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  release: vi.fn(),
  publishedReleaseId: vi.fn(),
  createClient: vi.fn(),
  serviceFrom: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/diagnostic/granular/store", () => ({
  SupabaseAssessmentStore: class {
    release = fixture.release;
    publishedReleaseId = fixture.publishedReleaseId;
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({ from: fixture.serviceFrom }),
  createClient: fixture.createClient,
}));

import { getTeacherContent } from "./teacher-content";

const bundle = {
  activities: [
    { contentId: "live-lesson", status: "published" },
    { contentId: "hidden-lesson", status: "draft" },
    { contentId: "draft-lesson", status: "published" },
  ],
  teachingContent: [
    { id: "live-lesson", titleFr: "Accord", status: "published_pending_review", learnerQuestionFr: "Question", steps: [{ exampleFr: "Exemple", explanationFr: "Explication" }], takeawayFr: "Règle", boundaryFr: "Limite", practice: [{ promptFr: "Complète", choices: ["un", "une"], answerFr: "une", explanationFr: "Accord féminin" }] },
    { id: "hidden-lesson", titleFr: "Brouillon", status: "published", learnerQuestionFr: "?", steps: [], takeawayFr: "", boundaryFr: "", practice: [] },
    { id: "draft-lesson", titleFr: "En préparation", status: "draft", learnerQuestionFr: "?", steps: [], takeawayFr: "", boundaryFr: "", practice: [] },
  ],
  assessment: { probes: [{ id: "live-probe" }], skills: [{ nodeKey: "accord", labelFr: "Accord" }] },
  bank: { items: [
    { itemKey: "live-probe", reviewStatus: "needs_human_review", item: { nodeKey: "accord", instructionsFr: "Choisis", promptFr: "Un ou une ?", choices: [{ text: "une", correct: true }], correctAnswer: "une" } },
    { itemKey: "hidden-probe", reviewStatus: "human_approved", item: { nodeKey: "accord", promptFr: "Non publié", choices: [] } },
  ] },
};

describe("teacher granular catalog", () => {
  beforeEach(() => {
    vi.stubEnv("GRANULAR_DIAGNOSTIC_ENABLED", "true");
    vi.stubEnv("GRANULAR_DIAGNOSTIC_RELEASE_KEY", "current-release");
    fixture.publishedReleaseId.mockResolvedValue("release-uuid");
    fixture.release.mockResolvedValue(bundle);
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

  it("shows only published activity lessons from the validated current release", async () => {
    const result = await getTeacherContent("lesson", 1);
    expect(fixture.publishedReleaseId).toHaveBeenCalledWith("current-release");
    expect(fixture.release).toHaveBeenCalledWith("release-uuid");
    expect(result.count).toBe(1);
    expect(result.rows[0]).toMatchObject({ id: "live-lesson", targetKind: "granular_lesson", releaseId: "release-uuid", contentKey: "live-lesson" });
    expect(result.rows[0].body).toContain("Complète");
  });

  it("shows only probes delivered by the release, including permitted parallel review material", async () => {
    const result = await getTeacherContent("exercise", 1);
    expect(result.count).toBe(1);
    expect(result.rows[0]).toMatchObject({ id: "live-probe", status: "needs_human_review", targetKind: "granular_exercise", releaseId: "release-uuid" });
    expect(result.rows[0].body).toContain("✓ une");
  });

  it("does not fall back to legacy material when the active release is unavailable", async () => {
    fixture.release.mockResolvedValue(null);
    expect(await getTeacherContent("lesson", 1)).toEqual({ count: 0, rows: [] });
    expect(fixture.createClient).not.toHaveBeenCalled();
  });

  it("normalizes submitted passage reviews returned as objects, arrays, or null", async () => {
    const passageQuery = {
      select: () => passageQuery, eq: () => passageQuery, in: () => passageQuery,
      order: () => passageQuery,
      range: async () => ({ data: [{ id: "passage-id", title: "Texte", body: "Contenu", review_status: "human_approved" }], count: 1, error: null }),
    };
    const reviewQuery = {
      select: () => reviewQuery,
      in: async () => ({ data: [{ published_text_version_id: "passage-id", review_assignments: [
        { status: "submitted", passage_reviews: { status: "submitted", general_comment: "Avis A" } },
        { status: "submitted", passage_reviews: null },
        { status: "submitted", passage_reviews: [{ status: "submitted", general_comment: "Avis B" }] },
        { status: "draft", passage_reviews: { status: "draft", general_comment: "Private draft" } },
      ] }], error: null }),
    };
    fixture.createClient.mockResolvedValue({ from: () => passageQuery });
    fixture.serviceFrom.mockReturnValue(reviewQuery);
    const result = await getTeacherContent("passage", 1);
    expect(result.rows[0].reviewSummary).toEqual(["Avis A", "Avis B"]);
  });
});
