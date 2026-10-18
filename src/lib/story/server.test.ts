import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability", () => ({ captureError: vi.fn() }));
vi.mock("@/lib/content/editorial/runtime", () => ({ editorialProviderConfigured: () => false }));
const vocab = vi.hoisted(() => ({
  getDueWordCards: vi.fn(),
  resolveFormTargets: vi.fn(),
  recordWordEvidence: vi.fn(),
  recordWordReviewAttempt: vi.fn(),
}));
vi.mock("@/lib/vocabulary/server", () => vocab);

import { createFakeSupabase } from "./fake-supabase.test-helper";
import { answerChapterTask, endingWordsFor, ensureChapterTask, loadFinale, loadStoryHomeCard, loadStoryLibrary, recordEmbeddedExposure, storyAvailability, toPublicTask } from "./server";

const STUDENT = "11111111-1111-4111-8111-111111111111";
const SAGA = "22222222-2222-4222-8222-222222222222";
const CH1 = "33333333-3333-4333-8333-333333333331";
const CH2 = "33333333-3333-4333-8333-333333333332";
const NOW = new Date("2026-10-18T15:00:00Z");

const BODY = "Le gardien, un grand intrépide aux genoux couronnés, siffla entre ses dents.\n\nTu sortis le premier sous la pluie.";
const target = (word: string, id: string) => ({ vocabularyItemId: `item-${id}`, lemmaId: `lemma-${id}`, senseId: `sense-${id}`, senseIds: [`sense-${id}`], displayWord: word });

function pool(count: number, interest = "football") {
  return Array.from({ length: count }, (_, index) => ({ id: `pool-${index}`, kind: "fallback_chapter", interest, grade_band: "6e-5e", status: "published", style_key: index % 2 ? "verne" : "renard" }));
}

function baseDb(extra: Record<string, Array<Record<string, unknown>>> = {}) {
  return createFakeSupabase({
    students: [{ id: STUDENT, current_grade: 6 }],
    student_interests: [{ student_id: STUDENT, interest_key: "football", declared_strength: 1 }, { student_id: STUDENT, interest_key: "space", declared_strength: 0.5 }],
    editorial_library_items: pool(8),
    ...extra,
  }, { uniqueKeys: { story_chapter_tasks: ["chapter_id"] } });
}
const asDb = (db: ReturnType<typeof createFakeSupabase>) => db as unknown as SupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.STORY_LIVE_GENERATION;
  vocab.getDueWordCards.mockResolvedValue({ reviews: [{ senseId: "sense-a", word: "intrépide", definition: "qui n'a pas peur du danger" }], toIntroduce: [], newWordAllowance: 0 });
  vocab.resolveFormTargets.mockImplementation(async (_db: unknown, forms: string[]) => {
    const known: Record<string, ReturnType<typeof target>> = { intrépide: target("intrépide", "a"), couronnés: target("couronné", "b"), gardien: target("gardien", "c") };
    return new Map(forms.filter((form) => known[form]).map((form) => [form, known[form]]));
  });
  vocab.recordWordEvidence.mockResolvedValue([]);
  vocab.recordWordReviewAttempt.mockResolvedValue({ outcomes: [], status: null });
});

describe("availability (never a broken feature)", () => {
  it("is visible without live generation when the band's fallback pool can carry a saga for an interest", async () => {
    const availability = await storyAvailability(asDb(baseDb()), STUDENT);
    expect(availability).toMatchObject({ visible: true, live: false, band: "6e-5e", interests: ["football"] });
    expect(availability.poolStyles.football.sort()).toEqual(["renard", "verne"]);
  });

  it("is hidden when the pool is too small and live generation is off", async () => {
    const availability = await storyAvailability(asDb(baseDb({ editorial_library_items: pool(3) })), STUDENT);
    expect(availability.visible).toBe(false);
  });

  it("is hidden when no fallback matches the student's interests", async () => {
    const availability = await storyAvailability(asDb(baseDb({ editorial_library_items: pool(9, "fashion") })), STUDENT);
    expect(availability.visible).toBe(false);
  });

  it("stays hidden with the flag on but no provider configured", async () => {
    process.env.STORY_LIVE_GENERATION = "true";
    const availability = await storyAvailability(asDb(baseDb({ editorial_library_items: [] })), STUDENT);
    expect(availability).toMatchObject({ visible: false, live: false });
  });

  it("keeps an existing saga reachable", async () => {
    const availability = await storyAvailability(asDb(baseDb({ editorial_library_items: [], story_sagas: [{ id: SAGA, student_id: STUDENT, status: "active" }] })), STUDENT);
    expect(availability).toMatchObject({ visible: true, interests: [] });
  });
});

function sagaDb(reads: Array<Record<string, unknown>> = [], goal = false) {
  return baseDb({
    story_sagas: [{ id: SAGA, student_id: STUDENT, interest: "football", style_key: "verne", title: "Le ballon gris", status: "active", chapter_count: 8, hero_name: "Lina", hero_gender: "f", created_at: "2026-10-10T00:00:00Z" }],
    story_progress: [{ saga_id: SAGA, student_id: STUDENT, current_chapter_id: CH2, chapters_read: 1, last_read_at: "2026-10-18T08:00:00Z", path: [CH1] }],
    story_chapters: [
      { id: CH1, saga_id: SAGA, chapter_index: 1, parent_choice_id: null, status: "ready", body_template: BODY, target_lemmas: [] },
      { id: CH2, saga_id: SAGA, chapter_index: 2, parent_choice_id: "choice-0", status: "ready", body_template: BODY, target_lemmas: [] },
    ],
    story_chapter_reads: reads,
    student_daily_activity: goal ? [{ student_id: STUDENT, activity_date: "2026-10-18", goal_completed: true }] : [],
    story_hero_profiles: [{ student_id: STUDENT, nickname: "Lina", avatar: "renard", gender: "f" }],
    lexical_senses: [
      { id: "sense-a", definition_fr: "qui n'a pas peur du danger", is_teachable: true, review_status: "human_approved" },
      { id: "sense-b", definition_fr: "qui porte une couronne", is_teachable: true, review_status: "human_approved" },
      { id: "sense-c", definition_fr: "joueur qui protège les buts", is_teachable: true, review_status: "human_approved" },
    ],
  });
}

describe("home card and library (H.5, H.6)", () => {
  it("offers the chapter of the day, then waits for tomorrow without penalty", async () => {
    expect(await loadStoryHomeCard(asDb(sagaDb()), STUDENT, NOW)).toMatchObject({ state: "ready", sagaId: SAGA, chapterIndex: 2, avatarEmoji: "🦊", manner: "à la manière de Jules Verne" });
    const readToday = [{ student_id: STUDENT, chapter_id: CH1, read_at: "2026-10-18T08:00:00Z" }];
    expect(await loadStoryHomeCard(asDb(sagaDb(readToday)), STUDENT, NOW)).toMatchObject({ state: "locked" });
    expect(await loadStoryHomeCard(asDb(sagaDb(readToday, true)), STUDENT, NOW)).toMatchObject({ state: "ready" });
    const readDaysAgo = [{ student_id: STUDENT, chapter_id: CH1, read_at: "2026-10-11T08:00:00Z" }];
    expect(await loadStoryHomeCard(asDb(sagaDb(readDaysAgo)), STUDENT, NOW)).toMatchObject({ state: "ready" });
  });

  it("invites a first saga when none is running", async () => {
    expect(await loadStoryHomeCard(asDb(baseDb()), STUDENT, NOW)).toMatchObject({ state: "start", sagaId: null });
  });

  it("returns nothing when story mode cannot be served", async () => {
    expect(await loadStoryHomeCard(asDb(baseDb({ editorial_library_items: [] })), STUDENT, NOW)).toBeNull();
  });

  it("builds the library: active saga, shelf of styles read this term, proposals in new styles", async () => {
    const library = await loadStoryLibrary(asDb(sagaDb()), STUDENT, NOW);
    expect(library.active).toMatchObject({ id: SAGA, title: "Le ballon gris", state: "ready", chaptersRead: 1 });
    expect(library.shelf).toEqual([{ key: "verne", name: "Jules Verne", sagas: 1, thisTerm: true }]);
    expect(library.stylesThisTerm).toBe(1);
    expect(library.proposals.length).toBeGreaterThanOrEqual(2);
    expect(library.proposals.every((proposal) => proposal.interest === "football")).toBe(true);
  });
});

describe("micro-task and embedded evidence (H.3, D.6)", () => {
  const chapter = { id: CH2, paragraphs: BODY.split("\n\n") };

  it("builds the task from a due word of the chapter and never sends the answer", async () => {
    const db = sagaDb();
    const row = await ensureChapterTask(asDb(db), STUDENT, chapter, NOW);
    expect(row).toMatchObject({ word: "intrépide", due: true, sense_id: "sense-a" });
    const shown = toPublicTask(row)!;
    expect(shown.options).toContain("qui n'a pas peur du danger");
    expect(JSON.stringify(shown)).not.toMatch(/correct_?index|sense-a/iu);
    expect(db.tables.story_chapter_tasks).toHaveLength(1);
    await ensureChapterTask(asDb(db), STUDENT, chapter, NOW);
    expect(db.tables.story_chapter_tasks).toHaveLength(1);
  });

  it("records the answer as an embedded review, once", async () => {
    const db = sagaDb();
    const row = (await ensureChapterTask(asDb(db), STUDENT, chapter, NOW))!;
    const wrong = (row.correct_index + 1) % 3;
    const result = await answerChapterTask(asDb(db), STUDENT, CH2, wrong, NOW);
    expect(result).toMatchObject({ correct: false, correctIndex: row.correct_index, definition: "qui n'a pas peur du danger" });
    expect(vocab.recordWordReviewAttempt).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ studentId: STUDENT, senseId: "sense-a", format: "pick_definition", source: "embedded", correct: false, occurrenceKey: `story-task:${CH2}` }));
    const again = await answerChapterTask(asDb(db), STUDENT, CH2, row.correct_index, NOW);
    expect(again.correct).toBe(false);
    expect(vocab.recordWordReviewAttempt).toHaveBeenCalledTimes(1);
  });

  it("records due words met in the chapter with source 'embedded'", async () => {
    const count = await recordEmbeddedExposure(asDb(sagaDb()), STUDENT, CH2, chapter.paragraphs, NOW);
    expect(count).toBe(1);
    expect(vocab.recordWordEvidence).toHaveBeenCalledWith(expect.anything(), STUDENT, [expect.objectContaining({ source: "embedded", format: "story_exposure", occurrenceKey: `story-embedded:${CH2}:item-a` })]);
  });

  it("never fails the student when word memory is down", async () => {
    vocab.getDueWordCards.mockRejectedValue(new Error("db down"));
    vocab.resolveFormTargets.mockRejectedValue(new Error("db down"));
    expect(await ensureChapterTask(asDb(sagaDb()), STUDENT, chapter, NOW)).toBeNull();
    expect(await recordEmbeddedExposure(asDb(sagaDb()), STUDENT, CH2, chapter.paragraphs, NOW)).toBe(0);
  });
});

describe("finale (H.4, H.6)", () => {
  it("offers three words (task words first) and the author's card with a real excerpt", async () => {
    const db = sagaDb();
    db.tables.story_chapter_tasks = [{ chapter_id: CH1, student_id: STUDENT, word: "intrépide" }];
    db.tables.story_sagas[0].status = "completed";
    const words = await endingWordsFor(asDb(db), STUDENT, SAGA);
    expect(words[0]).toBe("intrépide");
    expect(words).toHaveLength(3);
    expect(words).not.toContain("Lina");
    const finale = await loadFinale(asDb(db), STUDENT, SAGA, "verne");
    expect(finale).toMatchObject({ styleName: "Jules Verne", manner: "à la manière de Jules Verne", minimumWords: 60, maximumWords: 120, saved: null });
    expect(finale.styleCard.text).toContain("Jules Verne");
    expect(finale.styleCard.excerpt?.source).toMatch(/quatre-vingts jours/u);
  });
});
