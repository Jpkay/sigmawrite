import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/vocabulary/server", () => ({ getDueWordCards: vi.fn() }));
vi.mock("@/lib/vocabulary/capture", () => ({ captureReadingExposure: vi.fn() }));

import { createSaga, generateChapter, readChapter } from "@/lib/content/editorial/story-service";
import { GOOD_RUBRIC, ScriptedLLM } from "@/lib/content/editorial/test-helpers";
import { createFakeSupabase } from "./fake-supabase.test-helper";

/**
 * H.2 regression guard: the hero's nickname (and the student's real name)
 * never reaches a model. The text is written with {{HEROS}} and the name is
 * inserted at read time only.
 */
const STUDENT = "44444444-4444-4444-8444-444444444444";
const BODY = `Le vestiaire sentait le camphre et la boue sèche. {{HEROS}} compta les crampons alignés sous le banc : vingt-deux, pas un de plus. Dehors, la pluie tambourinait sur la tôle comme un millier de doigts impatients.

L'entraîneur entra, son carnet sous le bras, et posa sur la table un ballon dont le cuir avait viré au gris. « Celui-là a joué la finale », dit-il sans sourire. Personne ne le crut, mais tout le monde le regarda.

{{HEROS}} prit le ballon. Il pesait plus lourd que prévu, gorgé d'eau, et {{HEROS}} sentit sous son pouce une couture qui avait lâché. Le gardien, un grand intrépide aux genoux couronnés, siffla entre ses dents.

À sept heures douze, la sirène retentit. {{HEROS}} sortit {{m:le premier|f:la première}}. La pelouse fumait sous les projecteurs, et quelque part dans les tribunes, un parapluie jaune s'ouvrit tout seul.`;

const outline = {
  title: "Le ballon gris", logline: "Un ballon ancien change le destin d'une équipe de quartier.", setting: "Un stade de banlieue sous la pluie d'octobre.",
  heroRole: "Le plus jeune joueur de l'équipe.",
  cast: [{ name: "Gaspard", role: "entraîneur", trait: "taiseux", voice: "phrases courtes" }, { name: "Odile", role: "gardienne", trait: "rieuse", voice: "vive" }],
  stages: [{ chapter: 1, beat: "Le ballon arrive au vestiaire.", tension: 2 }, { chapter: 4, beat: "Le ballon disparaît avant le match.", tension: 4 }, { chapter: 8, beat: "La finale sous la pluie.", tension: 5 }],
  endings: [{ key: "a", summary: "L'équipe gagne grâce au ballon retrouvé." }, { key: "b", summary: "L'équipe perd mais garde le ballon." }],
  tensePlan: [{ chapter: 1, tenses: ["passe_simple"] }], motifs: [], avoid: [],
};
const author = { title: "Sept heures douze", body: BODY, tenseEvidence: [{ form: "compta", lemma: "compter", tense: "passe_simple" }], targetUsage: [], choices: [{ label: "Suivre le gardien", intent: "x" }, { label: "Rester au vestiaire", intent: "y" }], chapterSummary: "Le match commence.",
  // H.3: the comprehension question and the bonus scene come in the same call, with the same placeholder.
  questions: [{ questionText: "Combien de crampons sont alignés sous le banc ?", questionType: "literal", choices: ["Vingt-deux crampons", "Onze crampons", "Trois crampons"], correctAnswer: "Vingt-deux crampons", explanation: "Le texte dit : vingt-deux, pas un de plus." }],
  bonusScene: "Pendant ce temps, Gaspard rangea son carnet dans la poche de sa veste. Il caressa la couture du vieux ballon, comme on salue un ami. Dehors, la pluie redoublait sur la tôle, et {{HEROS}} entendit les crampons claquer dans le couloir." };

describe("hero privacy (H.2)", () => {
  it("never sends the nickname or the student's name to any editorial role", async () => {
    // CM band (shorter chapters) so the scripted chapter passes every gate and is published with its extras.
    const db = createFakeSupabase({ students: [{ id: STUDENT, current_grade: 5, display_name: "Maëlys Dupont" }] });
    const llm = new ScriptedLLM({
      architect: [outline], author: [author], line_editor: [{ body: BODY, tenseEvidence: author.tenseEvidence, changes: [] }],
      reviewer_style: [{ rubric: GOOD_RUBRIC, strengths: [], notes: [] }], reviewer_targets: [{ naturalness: 5, contextHelpsMeaning: true, notes: [] }],
      reviewer_proof: [{ languageScore: 5, issues: [] }], reviewer_safety: [{ safe: true, ageAppropriate: true, concerns: [] }], editor_in_chief: [{ instructions: ["Plus concret."] }],
      summarizer: [{ summary: "Le match commence." }],
    });
    const deps = {
      db: db as unknown as SupabaseClient, llm,
      gates: { moderate: async () => ({ allowed: true, categories: [] }) },
      liveDecision: async () => ({ live: true, reason: "ok" as const }),
      targetWords: async () => ({ newLemmas: [{ lemma: "intrépide", kind: "new" as const }], dueLemmas: [{ lemma: "vestiaire", kind: "due" as const }] }),
    };
    const sagaId = await createSaga(deps, { studentId: STUDENT, interest: "football", styleKey: "verne", hero: { name: "Zéphyrine", gender: "f" } });
    expect(db.tables.story_sagas[0]).toMatchObject({ hero_name: "Zéphyrine", narration: "il" });
    await generateChapter(deps, { sagaId, chapterIndex: 1, parentChoiceId: null });

    expect(llm.calls.length).toBeGreaterThan(0);
    const sent = JSON.stringify(llm.calls);
    for (const secret of ["Zéphyrine", "Zephyrine", "Maëlys", "Dupont"]) expect(sent).not.toContain(secret);
    const logged = JSON.stringify([db.tables.editorial_runs ?? [], db.tables.editorial_run_steps ?? []]);
    expect(logged).not.toContain("Zéphyrine");

    // H.3 extras are stored with the placeholder too (staff-only table), never with the name.
    expect(db.tables.story_chapters[0].status).toBe("ready");
    expect(db.tables.story_chapter_extras).toHaveLength(1);
    expect(db.tables.story_chapter_extras[0]).toMatchObject({ comprehension: { correctIndex: 0, options: ["Vingt-deux crampons", "Onze crampons", "Trois crampons"] } });
    expect(String(db.tables.story_chapter_extras[0].bonus_scene)).toContain("{{HEROS}}");
    expect(JSON.stringify(db.tables.story_chapter_extras)).not.toContain("Zéphyrine");

    // Whatever the editorial decision, a stored chapter keeps the placeholder; the name appears only when read back.
    const chapter = db.tables.story_chapters[0];
    expect(String(chapter.body_template ?? "")).not.toContain("Zéphyrine");
    Object.assign(chapter, { status: "ready", body_template: BODY });
    const view = await readChapter({ db: db as unknown as SupabaseClient }, { sagaId });
    expect(view.chapter?.paragraphs.join(" ")).toContain("Zéphyrine sortit la première");
  });

  it("serves a fallback chapter with its gated question and bonus scene; a fallback without them stays plain", async () => {
    const pool = (id: string, extras: Record<string, unknown>) => ({
      id, kind: "fallback_chapter", interest: "football", grade_band: "cm", style_key: "verne", status: "published", title: "Sept heures douze", body: BODY,
      choices: [{ label: "Suivre le gardien", intent: "x" }, { label: "Rester au vestiaire", intent: "y" }], used_count: id === "fb-1" ? 0 : 5, ...extras,
    });
    // Fallback sagas have no outline cast: the scene may only name people the chapter already names.
    const scene = author.bonusScene.replace("Gaspard", "l'entraîneur");
    const db = createFakeSupabase({
      students: [{ id: STUDENT, current_grade: 5, display_name: "Maëlys Dupont" }],
      editorial_library_items: [pool("fb-1", { questions: author.questions, bonus_scene: scene }), pool("fb-2", { questions: null, bonus_scene: null })],
    });
    const deps = { db: db as unknown as SupabaseClient, llm: null, gates: { moderate: async () => ({ allowed: true, categories: [] }) }, liveDecision: async () => ({ live: false, reason: "flag_off" as const }) };
    const sagaId = await createSaga(deps, { studentId: STUDENT, interest: "football", styleKey: "verne", hero: { name: "Zéphyrine", gender: "f" } });
    await generateChapter(deps, { sagaId, chapterIndex: 1, parentChoiceId: null });
    expect(db.tables.story_chapters[0]).toMatchObject({ status: "ready", source: "fallback", fallback_item_id: "fb-1" });
    expect(db.tables.story_chapter_extras).toEqual([expect.objectContaining({ chapter_id: db.tables.story_chapters[0].id, comprehension: expect.objectContaining({ correctIndex: 0 }), bonus_scene: scene })]);
    const [choice] = db.tables.story_choices;
    await generateChapter(deps, { sagaId, chapterIndex: 2, parentChoiceId: choice.id as string });
    expect(db.tables.story_chapters[1]).toMatchObject({ status: "ready", fallback_item_id: "fb-2" });
    expect(db.tables.story_chapter_extras).toHaveLength(1);
  });
});
