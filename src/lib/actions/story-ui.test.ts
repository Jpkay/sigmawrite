import { beforeEach, describe, expect, it, vi } from "vitest";

const f = vi.hoisted(() => ({
  db: null as unknown as ReturnType<typeof import("@/lib/story/fake-supabase.test-helper").createFakeSupabase>,
  getChapter: vi.fn(), chooseBranch: vi.fn(), startSaga: vi.fn(),
  moderate: vi.fn(), moderateOrReject: vi.fn(), capture: vi.fn(), journal: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: vi.fn(async () => ({ id: "p" })) }));
vi.mock("@/lib/db/student", () => ({ getCurrentStudentId: vi.fn(async () => STUDENT) }));
vi.mock("@/lib/diagnostic/access", () => ({ requireStudentAccessAuthorized: vi.fn() }));
vi.mock("@/lib/diagnostic/granular/server-delivery-journal", () => ({ journalStudentPayload: f.journal }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}), createServiceClient: () => f.db }));
vi.mock("./story", () => ({ getChapter: f.getChapter, chooseBranch: f.chooseBranch, startSaga: f.startSaga }));
vi.mock("@/lib/safety/moderate-input", () => ({ moderateStudentText: f.moderate }));
vi.mock("@/lib/safety/moderate-or-reject", () => ({ moderateOrReject: f.moderateOrReject }));
vi.mock("@/lib/vocabulary/capture", () => ({ captureFreeWritingEvidence: f.capture }));
vi.mock("@/lib/vocabulary/server", () => ({ getDueWordCards: vi.fn(async () => ({ reviews: [] })), resolveFormTargets: vi.fn(async () => new Map()), recordWordEvidence: vi.fn(), recordWordReviewAttempt: vi.fn() }));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/content/editorial/runtime", () => ({ editorialProviderConfigured: () => false }));

const STUDENT = "11111111-1111-4111-8111-111111111111";
const SAGA = "22222222-2222-4222-8222-222222222222";
const CH1 = "33333333-3333-4333-8333-333333333331";
const CH2 = "33333333-3333-4333-8333-333333333332";

import { createFakeSupabase } from "@/lib/story/fake-supabase.test-helper";
import { beginStorySaga, chooseStoryBranch, loadStoryChapter, submitStoryEnding } from "./story-ui";

function seed(status = "active", reads: Array<Record<string, unknown>> = []) {
  f.db = createFakeSupabase({
    students: [{ id: STUDENT, current_grade: 6 }],
    student_interests: [{ student_id: STUDENT, interest_key: "football" }],
    editorial_library_items: Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, kind: "fallback_chapter", interest: "football", grade_band: "6e-5e", status: "published", style_key: "verne" })),
    story_sagas: [{ id: SAGA, student_id: STUDENT, interest: "football", style_key: "verne", status, chapter_count: 7, hero_name: "Lina", hero_gender: "f", title: "Le ballon gris" }],
    story_chapters: [
      { id: CH1, saga_id: SAGA, chapter_index: 1, status: "ready", body_template: "Le vestiaire sentait la boue.", parent_choice_id: null },
      { id: CH2, saga_id: SAGA, chapter_index: 2, status: "ready", body_template: "{{HEROS}} sortit la première.", parent_choice_id: "choice-a" },
    ],
    story_choices: [{ id: "choice-a", chapter_id: CH1, choice_index: 0, label: "Suivre le gardien" }],
    story_progress: [{ saga_id: SAGA, student_id: STUDENT, path: [CH1], chapters_read: 1 }],
    story_chapter_reads: reads,
  });
}

const chapterView = (id: string, index: number) => ({
  status: "ready",
  saga: { id: SAGA, title: "Le ballon gris", interest: "football", styleKey: "verne", styleName: "Jules Verne", chapterCount: 7, status: "active" },
  chapter: { id, index, title: `Chapitre ${index}`, paragraphs: ["Lina sortit la première."], choices: [{ id: "c0", index: 0, label: "A", task: null }, { id: "c1", index: 1, label: "B", task: null }], isLast: false, source: "fallback" },
  styleReveal: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  f.journal.mockImplementation(async (_student: string, _boundary: string, payload: unknown) => payload);
  f.moderate.mockResolvedValue({ allowed: true });
  f.moderateOrReject.mockResolvedValue({ allowed: true });
});

describe("loadStoryChapter", () => {
  it("delivers today's chapter and journals what was shown", async () => {
    seed();
    f.getChapter.mockResolvedValue(chapterView(CH2, 2));
    const view = await loadStoryChapter({ sagaId: SAGA });
    expect(view.status).toBe("ready");
    expect(view.chapter?.paragraphs).toEqual(["Lina sortit la première."]);
    expect(view.hero).toMatchObject({ name: "Lina", avatarEmoji: "🪶" });
    expect(f.journal).toHaveBeenCalledWith(STUDENT, "student:story-chapter", view);
  });

  it("never sends a locked chapter's text (one chapter a day)", async () => {
    seed("active", [{ student_id: STUDENT, chapter_id: CH1, read_at: new Date().toISOString() }]);
    f.getChapter.mockResolvedValue(chapterView(CH2, 2));
    const view = await loadStoryChapter({ sagaId: SAGA });
    expect(view.status).toBe("locked");
    expect(view.chapter).toBeNull();
    expect(view.locked).toEqual({ index: 2, title: "Chapitre 2", choice: "Suivre le gardien" });
    expect(JSON.stringify(view)).not.toContain("sortit la première");
  });

  it("refuses someone else's saga", async () => {
    seed();
    await expect(loadStoryChapter({ sagaId: "99999999-9999-4999-8999-999999999999" })).rejects.toThrow("Histoire introuvable.");
    expect(f.getChapter).not.toHaveBeenCalled();
  });
});

describe("chooseStoryBranch", () => {
  it("refuses to move past today's allowance", async () => {
    seed("active", [{ student_id: STUDENT, chapter_id: CH1, read_at: new Date().toISOString() }]);
    await expect(chooseStoryBranch({ sagaId: SAGA, chapterId: CH2, choiceIndex: 0 })).rejects.toThrow("La suite s’ouvre demain.");
    expect(f.chooseBranch).not.toHaveBeenCalled();
  });

  it("passes the choice and the rating to the editorial backend", async () => {
    seed();
    f.chooseBranch.mockResolvedValue({ nextChapterId: "n", completed: false });
    await expect(chooseStoryBranch({ sagaId: SAGA, chapterId: CH1, choiceIndex: 1, rating: "happy" })).resolves.toEqual({ nextChapterId: "n", completed: false });
    expect(f.chooseBranch).toHaveBeenCalledWith({ sagaId: SAGA, chapterId: CH1, choiceIndex: 1, rating: "happy" });
  });
});

describe("beginStorySaga", () => {
  it("only starts sagas for interests that can be served, and keeps the nickname out of the model path", async () => {
    seed("completed");
    await expect(beginStorySaga({ interest: "fashion", avatar: "renard", gender: "f" })).rejects.toThrow("pas disponible");
    f.startSaga.mockResolvedValue({ sagaId: "new" });
    await expect(beginStorySaga({ interest: "football", style: "renard", nickname: "  Lina<3 ", avatar: "renard", gender: "f" })).resolves.toEqual({ sagaId: "new", nicknameKept: true });
    expect(f.startSaga).toHaveBeenCalledWith({ interest: "football", style: "renard", hero: { name: "Lina", gender: "f" } });
    expect(f.db.tables.story_hero_profiles[0]).toMatchObject({ student_id: STUDENT, nickname: "Lina", avatar: "renard", gender: "f" });
  });

  it("drops a nickname the moderation rejects and sets the previous saga aside", async () => {
    seed("active");
    f.moderate.mockResolvedValue({ allowed: false });
    f.startSaga.mockResolvedValue({ sagaId: "new" });
    const result = await beginStorySaga({ interest: "football", nickname: "Grossier", avatar: "chat", gender: "n" });
    expect(result.nicknameKept).toBe(false);
    expect(f.startSaga).toHaveBeenCalledWith(expect.objectContaining({ hero: { name: null, gender: "n" } }));
    expect(f.db.tables.story_sagas[0].status).toBe("abandoned");
  });
});

describe("submitStoryEnding", () => {
  it("requires a finished saga, the récit length and the three words, then saves into the recueil", async () => {
    seed("active");
    await expect(submitStoryEnding({ sagaId: SAGA, text: "Fin." })).rejects.toThrow("Termine d’abord");
    seed("completed");
    f.db.tables.story_chapters[0].body_template = "La passerelle grinçait sous la tempête. Le capitaine observait l’horizon embrumé.";
    await expect(submitStoryEnding({ sagaId: SAGA, text: "Trop court." })).rejects.toThrow("entre 60 et 120 mots");
    const filler = "Le vent tomba enfin et la mer redevint calme sous un ciel très clair. ".repeat(5);
    await expect(submitStoryEnding({ sagaId: SAGA, text: filler })).rejects.toThrow("trois mots");
    const text = `${filler}Sur la passerelle, sous la tempête finie, le capitaine sourit.`;
    await expect(submitStoryEnding({ sagaId: SAGA, text, styleChallenge: true })).resolves.toEqual({ ok: true });
    expect(f.moderateOrReject).toHaveBeenCalledWith(expect.objectContaining({ studentId: STUDENT, field: "story_ending" }));
    expect(f.db.tables.story_endings[0]).toMatchObject({ saga_id: SAGA, style_challenge: true, style_key: "verne" });
    expect(f.capture).toHaveBeenCalledWith(f.db, expect.objectContaining({ source: "story", occurrenceKey: `story-ending:${SAGA}` }));
  });
});
