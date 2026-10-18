import "server-only";
/**
 * Story mode for the student (roadmap H.1–H.6): server-side loaders and
 * rules over a service-role client. The thin server actions in
 * src/lib/actions/story-ui.ts authenticate first, then call these. The
 * editorial backend (src/lib/content/editorial, src/lib/actions/story.ts)
 * writes the chapters; this module only reads them and adds the student
 * layer: availability, saga picker, hero, micro-tasks, daily unlock, endings.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderHero } from "@/lib/content/editorial/hero";
import { liveFlagEnabled, resolveLiveGeneration } from "@/lib/content/editorial/kill-switch";
import { editorialProviderConfigured } from "@/lib/content/editorial/runtime";
import { chapterCountFor } from "@/lib/content/editorial/saga";
import { loadClassSwitches, loadEditorialSettings } from "@/lib/content/editorial/store";
import { getStyleCard, stylesFor, studentExcerpt } from "@/lib/content/editorial/styles";
import { gradeBandFor, type GradeBand } from "@/lib/content/editorial/types";
import { INTEREST_BY_KEY } from "@/lib/content/interests";
import { captureError } from "@/lib/observability";
import { getDueWordCards, recordWordEvidence, recordWordReviewAttempt, resolveFormTargets, type WordTarget } from "@/lib/vocabulary/server";
import { wordTokens } from "@/lib/vocabulary/matching";
import { genreSpec } from "@/lib/writing/genres";
import { avatarFor, DEFAULT_AVATAR, STORY_AVATAR_KEYS, type StoryAvatarKey } from "./avatars";
import { mannerOf } from "./copy";
import { buildComprehensionTask, buildVocabularyTask, preferredTaskKind, publicTask, type ComprehensionTask, type PublicStoryTask, type StoryTask, type TaskCandidate } from "./micro-task";
import { proposeSagas, storyInterests, styleTeaser, stylesReadThisTerm, STYLES_PER_TERM_GOAL, type SagaHistoryEntry, type SagaProposal } from "./picker";
import { chapterUnlock, dayStartIso, pickEndingWords } from "./rules";
import { sagaTitle, styleName } from "./recueil";

type Db = SupabaseClient;

export type HeroGender = "f" | "m" | "n";
export type StoryHero = { nickname: string | null; avatar: StoryAvatarKey; gender: HeroGender };

export type StoryAvailability = {
  visible: boolean;
  live: boolean;
  grade: number;
  band: GradeBand;
  /** Student interests that can carry a saga now. */
  interests: string[];
  /** Fallback-pool styles per interest (live off), to keep the promised style. */
  poolStyles: Record<string, string[]>;
  hasSagas: boolean;
};

const safe = async <T>(label: string, fallback: T, run: () => Promise<T>): Promise<T> => {
  try { return await run(); } catch (error) { captureError(error, { component: "story-ui", step: label }); return fallback; }
};

async function studentBasics(db: Db, studentId: string): Promise<{ grade: number; interests: string[] }> {
  const [{ data: student }, { data: interests }] = await Promise.all([
    db.from("students").select("current_grade").eq("id", studentId).maybeSingle(),
    db.from("student_interests").select("interest_key,declared_strength").eq("student_id", studentId),
  ]);
  const grade = Math.min(12, Math.max(4, Number(student?.current_grade ?? 6) || 6));
  const ranked = [...(interests ?? [])].sort((a, b) => Number(b.declared_strength ?? 0) - Number(a.declared_strength ?? 0));
  return { grade, interests: ranked.map((row) => row.interest_key as string).filter((key) => typeof key === "string" && key.length >= 2) };
}

async function liveForStudent(db: Db, studentId: string): Promise<boolean> {
  if (!liveFlagEnabled()) return false;
  return safe("live-decision", false, async () => resolveLiveGeneration({
    settings: await loadEditorialSettings(db),
    classSwitches: await loadClassSwitches(db, studentId),
    providerConfigured: editorialProviderConfigured(),
    flagEnabled: true,
  }).live);
}

/**
 * Visible only when stories can really be served: live generation is on for
 * this student, or the fallback pool of their band holds a whole saga's worth
 * of chapters with at least one of their interests (exact or same group).
 * A student who already has a saga keeps access to it.
 */
export async function storyAvailability(db: Db, studentId: string): Promise<StoryAvailability> {
  const { grade, interests } = await studentBasics(db, studentId);
  const band = gradeBandFor(grade);
  const [live, pool, sagas] = await Promise.all([
    liveForStudent(db, studentId),
    safe("pool", [] as Array<{ interest: string; style_key: string }>, async () => {
      const { data, error } = await db.from("editorial_library_items").select("interest,style_key").eq("kind", "fallback_chapter").eq("grade_band", band).eq("status", "published").limit(500);
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{ interest: string; style_key: string }>;
    }),
    safe("sagas", 0, async () => {
      const { count } = await db.from("story_sagas").select("id", { count: "exact", head: true }).eq("student_id", studentId).neq("status", "abandoned");
      return count ?? 0;
    }),
  ]);
  const poolUsable = pool.length >= chapterCountFor(band);
  const poolInterests = poolUsable ? [...new Set(pool.map((row) => row.interest))] : [];
  const usable = storyInterests(interests, live ? null : poolInterests);
  const poolStyles: Record<string, string[]> = {};
  if (poolUsable) {
    for (const interest of usable) {
      const exact = pool.filter((row) => row.interest === interest).map((row) => row.style_key);
      const group = INTEREST_BY_KEY[interest]?.group;
      const sameGroup = pool.filter((row) => group && INTEREST_BY_KEY[row.interest]?.group === group).map((row) => row.style_key);
      poolStyles[interest] = [...new Set([...exact, ...sameGroup])];
    }
  }
  return { visible: usable.length > 0 || sagas > 0, live, grade, band, interests: usable, poolStyles, hasSagas: sagas > 0 };
}

export async function loadHero(db: Db, studentId: string): Promise<StoryHero> {
  const { data } = await db.from("story_hero_profiles").select("nickname,avatar,gender").eq("student_id", studentId).maybeSingle();
  const avatar = STORY_AVATAR_KEYS.includes(data?.avatar as StoryAvatarKey) ? (data!.avatar as StoryAvatarKey) : DEFAULT_AVATAR;
  const gender = (["f", "m", "n"] as const).includes(data?.gender as HeroGender) ? (data!.gender as HeroGender) : "n";
  return { nickname: (data?.nickname as string | null) ?? null, avatar, gender };
}

export async function saveHero(db: Db, studentId: string, hero: StoryHero): Promise<void> {
  const { error } = await db.from("story_hero_profiles").upsert({ student_id: studentId, nickname: hero.nickname, avatar: hero.avatar, gender: hero.gender, updated_at: new Date().toISOString() }, { onConflict: "student_id" });
  if (error) throw new Error("Ton héros n’a pas pu être enregistré.");
}

// ---------------------------------------------------------------------------
// Sagas, shelf and picker
// ---------------------------------------------------------------------------

type SagaRow = { id: string; interest: string; style_key: string; title: string | null; status: string; chapter_count: number; hero_name: string | null; hero_gender: HeroGender; created_at: string; completed_at: string | null };
type ProgressRow = { saga_id: string; current_chapter_id: string | null; chapters_read: number; last_read_at: string | null; path: string[] | null };

export type StorySagaSummary = {
  id: string; title: string; interest: string; interestLabel: string; emoji: string;
  styleKey: string; styleName: string; manner: string; status: string;
  chaptersRead: number; chapterCount: number; hasEnding: boolean;
};
export type StoryActiveState = "ready" | "locked" | "writing" | "finale";
export type StoryShelfEntry = { key: string; name: string; sagas: number; thisTerm: boolean };
export type StoryLibrary = {
  availability: StoryAvailability;
  hero: StoryHero;
  active: (StorySagaSummary & { state: StoryActiveState; nextIndex: number }) | null;
  completed: StorySagaSummary[];
  shelf: StoryShelfEntry[];
  stylesThisTerm: number;
  styleGoal: number;
  proposals: SagaProposal[];
};


function summarize(saga: SagaRow, progress: ProgressRow | undefined, endings: Set<string>): StorySagaSummary {
  const interest = INTEREST_BY_KEY[saga.interest];
  const name = styleName(saga.style_key);
  return {
    id: saga.id, title: sagaTitle(saga), interest: saga.interest, interestLabel: interest?.labelFr ?? saga.interest, emoji: interest?.emoji ?? "📖",
    styleKey: saga.style_key, styleName: name, manner: mannerOf(name), status: saga.status,
    chaptersRead: Number(progress?.chapters_read ?? 0), chapterCount: saga.chapter_count, hasEnding: endings.has(saga.id),
  };
}

async function loadSagas(db: Db, studentId: string) {
  const { data: sagas } = await db.from("story_sagas").select("id,interest,style_key,title,status,chapter_count,hero_name,hero_gender,created_at,completed_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(60);
  const rows = (sagas ?? []) as SagaRow[];
  const ids = rows.map((row) => row.id);
  const [{ data: progress }, { data: endings }] = ids.length
    ? await Promise.all([
      db.from("story_progress").select("saga_id,current_chapter_id,chapters_read,last_read_at,path").in("saga_id", ids),
      db.from("story_endings").select("saga_id").in("saga_id", ids),
    ])
    : [{ data: [] }, { data: [] }];
  return {
    sagas: rows,
    progress: new Map(((progress ?? []) as ProgressRow[]).map((row) => [row.saga_id, row])),
    endings: new Set((endings ?? []).map((row) => row.saga_id as string)),
  };
}

/** Today's reading allowance (H.5): chapters already read today and whether the daily mission is done. */
export async function dailyReadingState(db: Db, studentId: string, now = new Date()): Promise<{ readsToday: number; goalCompletedToday: boolean }> {
  const since = dayStartIso(now);
  const [{ count }, { data: activity }] = await Promise.all([
    db.from("story_chapter_reads").select("chapter_id", { count: "exact", head: true }).eq("student_id", studentId).gte("read_at", since),
    db.from("student_daily_activity").select("goal_completed").eq("student_id", studentId).eq("activity_date", since.slice(0, 10)).maybeSingle(),
  ]);
  return { readsToday: count ?? 0, goalCompletedToday: Boolean(activity?.goal_completed) };
}

async function activeState(db: Db, studentId: string, saga: SagaRow, progress: ProgressRow | undefined, now: Date): Promise<{ state: StoryActiveState; nextIndex: number }> {
  if (saga.status === "completed") return { state: "finale", nextIndex: saga.chapter_count };
  type CurrentChapter = { id: string; chapter_index: number; status: string };
  const lookup = progress?.current_chapter_id
    ? db.from("story_chapters").select("id,chapter_index,status").eq("id", progress.current_chapter_id)
    : db.from("story_chapters").select("id,chapter_index,status").eq("saga_id", saga.id).eq("chapter_index", 1).is("parent_choice_id", null);
  const { data: current } = await lookup.maybeSingle();
  const chapter = current as CurrentChapter | null;
  const index = Number(chapter?.chapter_index ?? 1);
  if (!chapter) return { state: "writing", nextIndex: index };
  const { data: read } = await db.from("story_chapter_reads").select("chapter_id").eq("student_id", studentId).eq("chapter_id", chapter.id).maybeSingle();
  const daily = await dailyReadingState(db, studentId, now);
  const unlock = chapterUnlock({ chapterIndex: index, alreadyRead: Boolean(read), ...daily });
  if (unlock.locked) return { state: "locked", nextIndex: index };
  return { state: chapter.status === "ready" ? "ready" : "writing", nextIndex: index };
}

export async function loadStoryLibrary(db: Db, studentId: string, now = new Date()): Promise<StoryLibrary> {
  const [availability, hero, { sagas, progress, endings }] = await Promise.all([storyAvailability(db, studentId), loadHero(db, studentId), loadSagas(db, studentId)]);
  const activeRow = sagas.find((saga) => saga.status === "writing" || saga.status === "active" || (saga.status === "completed" && !endings.has(saga.id))) ?? null;
  const active = activeRow ? { ...summarize(activeRow, progress.get(activeRow.id), endings), ...await activeState(db, studentId, activeRow, progress.get(activeRow.id), now) } : null;
  const completed = sagas.filter((saga) => saga.status === "completed" && saga.id !== activeRow?.id).map((saga) => summarize(saga, progress.get(saga.id), endings));
  const history: SagaHistoryEntry[] = sagas.map((saga) => ({ styleKey: saga.style_key, chaptersRead: Number(progress.get(saga.id)?.chapters_read ?? 0), lastReadAt: progress.get(saga.id)?.last_read_at ?? null, createdAt: saga.created_at }));
  const thisTerm = new Set(stylesReadThisTerm(history, now));
  const shelfMap = new Map<string, StoryShelfEntry>();
  for (const entry of history.filter((item) => item.chaptersRead > 0)) {
    const current = shelfMap.get(entry.styleKey) ?? { key: entry.styleKey, name: styleName(entry.styleKey), sagas: 0, thisTerm: thisTerm.has(entry.styleKey) };
    current.sagas += 1;
    shelfMap.set(entry.styleKey, current);
  }
  const styles = stylesFor(availability.band, "chapter").map((card) => ({ key: card.key, name: card.studentFacingName, teaser: styleTeaser(card.studentCard) }));
  const proposals = availability.interests.length
    ? proposeSagas({ interests: availability.interests, styles, history, now, seed: studentId, poolStyles: availability.live ? undefined : availability.poolStyles })
    : [];
  return { availability, hero, active, completed, shelf: [...shelfMap.values()], stylesThisTerm: thisTerm.size, styleGoal: STYLES_PER_TERM_GOAL, proposals };
}

export type StoryHomeCard = null | {
  state: "start" | StoryActiveState;
  sagaId: string | null;
  title: string | null;
  chapterIndex: number;
  chapterCount: number;
  avatarEmoji: string;
  manner: string | null;
};

/** Home card (H.5): the chapter of the day, or an invitation. Null when story mode cannot be served. */
export async function loadStoryHomeCard(db: Db, studentId: string, now = new Date()): Promise<StoryHomeCard> {
  const availability = await storyAvailability(db, studentId);
  if (!availability.visible) return null;
  const [hero, { sagas, progress, endings }] = await Promise.all([loadHero(db, studentId), loadSagas(db, studentId)]);
  const avatarEmoji = avatarFor(hero.avatar).emoji;
  const activeRow = sagas.find((saga) => saga.status === "writing" || saga.status === "active" || (saga.status === "completed" && !endings.has(saga.id)));
  if (!activeRow) return availability.interests.length ? { state: "start", sagaId: null, title: null, chapterIndex: 0, chapterCount: 0, avatarEmoji, manner: null } : null;
  const state = await activeState(db, studentId, activeRow, progress.get(activeRow.id), now);
  return { state: state.state, sagaId: activeRow.id, title: sagaTitle(activeRow), chapterIndex: state.nextIndex, chapterCount: activeRow.chapter_count, avatarEmoji, manner: mannerOf(styleName(activeRow.style_key)) };
}

/** Starting a new saga leaves the current one without penalty (rule 5): it is simply set aside. */
export async function setAsideActiveSagas(db: Db, studentId: string): Promise<void> {
  await db.from("story_sagas").update({ status: "abandoned", updated_at: new Date().toISOString() }).eq("student_id", studentId).in("status", ["writing", "active"]);
}

// ---------------------------------------------------------------------------
// Micro-tasks (H.3) and embedded word evidence (D.6)
// ---------------------------------------------------------------------------

export type DueWordInText = { target: WordTarget; senseId: string; word: string; definition: string | null; form: string };

/** Today's due words (word memory plan) that the chapter actually uses. */
export async function dueWordsInText(db: Db, studentId: string, paragraphs: string[], now = new Date()): Promise<DueWordInText[]> {
  const plan = await getDueWordCards(db, studentId, { now: now.toISOString() });
  const due = new Map(plan.reviews.filter((review) => review.senseId).map((review) => [review.senseId, review]));
  if (!due.size) return [];
  const forms = await resolveFormTargets(db, [...new Set(wordTokens(paragraphs.join("\n")))]);
  const found = new Map<string, DueWordInText>();
  for (const [form, target] of forms) {
    const senseId = target.senseIds.find((id) => due.has(id));
    if (!senseId || found.has(target.vocabularyItemId)) continue;
    const review = due.get(senseId)!;
    found.set(target.vocabularyItemId, { target, senseId, word: review.word ?? target.displayWord, definition: review.definition, form });
  }
  return [...found.values()];
}

type TaskRow = { chapter_id: string; kind?: StoryTask["kind"]; word: string | null; sense_id: string | null; due: boolean; task: StoryTask; correct_index: number; answer_index: number | null; correct: boolean | null; bonus_unlocked?: boolean | null };
const TASK_COLUMNS = "chapter_id,kind,word,sense_id,due,task,correct_index,answer_index,correct,bonus_unlocked";

async function lexiconCandidates(db: Db, paragraphs: string[], exclude: Set<string>): Promise<{ candidates: TaskCandidate[]; definitions: string[] }> {
  const forms = await resolveFormTargets(db, [...new Set(wordTokens(paragraphs.join("\n")))]);
  const unambiguous = [...forms.entries()].filter(([, target]) => target.senseId && !exclude.has(target.vocabularyItemId));
  const senseIds = [...new Set(unambiguous.map(([, target]) => target.senseId as string))].slice(0, 200);
  if (!senseIds.length) return { candidates: [], definitions: [] };
  const { data } = await db.from("lexical_senses").select("id,definition_fr,is_teachable,is_specialist,is_proper_noun,review_status").in("id", senseIds);
  const senses = new Map((data ?? []).filter((row) => row.is_teachable !== false && !row.is_specialist && !row.is_proper_noun && !["rejected", "retired"].includes(row.review_status as string) && typeof row.definition_fr === "string").map((row) => [row.id as string, row.definition_fr as string]));
  const seen = new Set<string>();
  const candidates: TaskCandidate[] = [];
  for (const [form, target] of unambiguous.sort((a, b) => b[1].displayWord.length - a[1].displayWord.length)) {
    const definition = senses.get(target.senseId as string);
    if (!definition || seen.has(target.vocabularyItemId)) continue;
    seen.add(target.vocabularyItemId);
    candidates.push({ word: target.displayWord, forms: [form], definition, senseId: target.senseId, due: false });
  }
  return { candidates, definitions: candidates.map((candidate) => candidate.definition) };
}

type ChapterMeta = { chapterIndex: number; sagaId: string | null; lemmas: Array<{ lemma: string; definition?: string }> };

async function chapterMeta(db: Db, chapterId: string): Promise<ChapterMeta> {
  const { data } = await db.from("story_chapters").select("chapter_index,saga_id,target_lemmas,fallback_item_id").eq("id", chapterId).maybeSingle();
  let lemmas = Array.isArray(data?.target_lemmas) ? data!.target_lemmas as Array<{ lemma?: string; definition?: string }> : [];
  if (!lemmas.length && data?.fallback_item_id) {
    const { data: item } = await db.from("editorial_library_items").select("target_lemmas").eq("id", data.fallback_item_id).maybeSingle();
    lemmas = Array.isArray(item?.target_lemmas) ? item!.target_lemmas as Array<{ lemma?: string; definition?: string }> : [];
  }
  return {
    chapterIndex: Number(data?.chapter_index ?? 1) || 1,
    sagaId: (data?.saga_id as string | undefined) ?? null,
    lemmas: lemmas.filter((entry) => typeof entry?.lemma === "string").map((entry) => ({ lemma: entry.lemma as string, definition: typeof entry.definition === "string" ? entry.definition : undefined })),
  };
}

type ExtrasRow = { comprehension: { question?: string; options?: string[]; correctIndex?: number; explanation?: string } | null; bonus_scene: string | null };

async function chapterExtras(db: Db, chapterId: string): Promise<ExtrasRow | null> {
  const { data, error } = await db.from("story_chapter_extras").select("comprehension,bonus_scene").eq("chapter_id", chapterId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ExtrasRow | null) ?? null;
}

function comprehensionFrom(extras: ExtrasRow | null): ComprehensionTask | null {
  const q = extras?.comprehension;
  if (!q || typeof q.question !== "string" || !Array.isArray(q.options) || typeof q.correctIndex !== "number") return null;
  return buildComprehensionTask({ question: q.question, options: q.options.map(String), correctIndex: q.correctIndex, explanation: typeof q.explanation === "string" ? q.explanation : "" });
}

async function vocabularyTaskFor(db: Db, studentId: string, chapter: { id: string; paragraphs: string[] }, lemmas: ChapterMeta["lemmas"], now: Date) {
  const due = await safe("due-words", [] as DueWordInText[], () => dueWordsInText(db, studentId, chapter.paragraphs, now));
  const lexicon = await safe("lexicon", { candidates: [] as TaskCandidate[], definitions: [] as string[] }, () => lexiconCandidates(db, chapter.paragraphs, new Set()));
  const candidates: TaskCandidate[] = [
    ...due.filter((word) => word.definition).map((word) => ({ word: word.word, forms: [word.form], definition: word.definition as string, senseId: word.senseId, due: true })),
    ...lemmas.filter((entry) => entry.definition).map((entry) => {
      const known = lexicon.candidates.find((candidate) => candidate.word.toLocaleLowerCase("fr") === entry.lemma.toLocaleLowerCase("fr"));
      return { word: entry.lemma, forms: known?.forms ?? [], definition: entry.definition as string, senseId: known?.senseId ?? null, due: false };
    }),
    ...lexicon.candidates.filter((candidate) => candidate.word.length >= 7),
  ];
  let distractors = [...lexicon.definitions];
  if (distractors.length < 4) {
    const { data } = await db.from("lexical_senses").select("definition_fr").eq("is_teachable", true).limit(40);
    distractors = [...distractors, ...(data ?? []).map((row) => row.definition_fr as string).filter(Boolean)];
  }
  return buildVocabularyTask({ paragraphs: chapter.paragraphs, candidates, distractors, seed: chapter.id });
}

/**
 * Builds (once) and returns the chapter's micro-task (H.3). Chapters
 * alternate between a comprehension question (when the chapter has one that
 * passed its gates) and a vocabulary task; either stands in for the other.
 * Null when the chapter offers neither.
 */
export async function ensureChapterTask(db: Db, studentId: string, chapter: { id: string; paragraphs: string[] }, now = new Date()): Promise<TaskRow | null> {
  const { data: existing } = await db.from("story_chapter_tasks").select(TASK_COLUMNS).eq("chapter_id", chapter.id).eq("student_id", studentId).maybeSingle();
  if (existing) return existing as unknown as TaskRow;
  const meta = await safe("chapter-meta", { chapterIndex: 1, sagaId: null, lemmas: [] } as ChapterMeta, () => chapterMeta(db, chapter.id));
  const comprehension = comprehensionFrom(await safe("extras", null as ExtrasRow | null, () => chapterExtras(db, chapter.id)));
  let task: StoryTask | null = comprehension && preferredTaskKind(meta.chapterIndex) === "comprehension" ? comprehension : null;
  task ??= await vocabularyTaskFor(db, studentId, chapter, meta.lemmas, now);
  task ??= comprehension;
  if (!task) return null;
  const row: { chapter_id: string; student_id: string; kind: StoryTask["kind"]; word: string | null; sense_id: string | null; due: boolean; task: StoryTask; correct_index: number } = task.kind === "vocabulary"
    ? { chapter_id: chapter.id, student_id: studentId, kind: "vocabulary", word: task.word.slice(0, 60), sense_id: task.senseId, due: task.due, task, correct_index: task.correctIndex }
    : { chapter_id: chapter.id, student_id: studentId, kind: "comprehension", word: null, sense_id: null, due: false, task, correct_index: task.correctIndex };
  const { error } = await db.from("story_chapter_tasks").upsert(row, { onConflict: "chapter_id", ignoreDuplicates: true });
  if (error) { captureError(new Error(error.message), { component: "story-ui", step: "task-insert" }); return null; }
  const { data: stored } = await db.from("story_chapter_tasks").select(TASK_COLUMNS).eq("chapter_id", chapter.id).maybeSingle();
  return (stored as unknown as TaskRow | null) ?? { ...row, answer_index: null, correct: null, bonus_unlocked: false };
}

/** The chapter's bonus scene with the hero's name inserted (H.2/H.3), as paragraphs. Null when the chapter has none. */
export async function loadBonusScene(db: Db, chapterId: string): Promise<string[] | null> {
  return safe("bonus-scene", null, async () => {
    const extras = await chapterExtras(db, chapterId);
    if (!extras?.bonus_scene) return null;
    const { data: chapter } = await db.from("story_chapters").select("saga_id").eq("id", chapterId).maybeSingle();
    const { data: saga } = chapter?.saga_id ? await db.from("story_sagas").select("hero_name,hero_gender").eq("id", chapter.saga_id).maybeSingle() : { data: null };
    const hero = { name: (saga?.hero_name as string | null) ?? null, gender: ((saga?.hero_gender as HeroGender | undefined) ?? "n") };
    const paragraphs = renderHero(extras.bonus_scene, hero).split(/\n{2,}/u).map((p) => p.trim()).filter(Boolean);
    return paragraphs.length ? paragraphs : null;
  });
}

export function toPublicTask(row: TaskRow | null, bonus: string[] | null = null): PublicStoryTask | null {
  if (!row) return null;
  return publicTask({ ...row.task, correctIndex: row.correct_index }, row.answer_index == null ? null : { optionIndex: row.answer_index, correct: Boolean(row.correct), bonus: row.bonus_unlocked ? bonus : null });
}

/** The chapter's task as the browser sees it, with the bonus scene once it is unlocked. */
export async function chapterTaskView(db: Db, studentId: string, chapter: { id: string; paragraphs: string[] }, now = new Date()): Promise<PublicStoryTask | null> {
  const row = await ensureChapterTask(db, studentId, chapter, now);
  const bonus = row?.bonus_unlocked ? await loadBonusScene(db, chapter.id) : null;
  return toPublicTask(row, bonus);
}

export type TaskAnswerResult = {
  kind: StoryTask["kind"];
  correct: boolean;
  correctIndex: number;
  /** The right option as written (a meaning for a vocabulary task, an answer for a comprehension question). */
  definition: string;
  word: string | null;
  form: string | null;
  explanation: string | null;
  /** A right first answer unlocks the chapter's bonus scene, when it has one. */
  bonus: string[] | null;
};

/**
 * Grades the micro-task. Due words get a review woven into content
 * (source 'embedded', D.6): a recognition format, so weak credit, as the
 * word-memory rules require. A right answer unlocks the bonus scene; a wrong
 * one still opens the chosen branch. Idempotent: the first answer stands.
 */
export async function answerChapterTask(db: Db, studentId: string, chapterId: string, optionIndex: number, now = new Date()): Promise<TaskAnswerResult> {
  const { data } = await db.from("story_chapter_tasks").select(TASK_COLUMNS).eq("chapter_id", chapterId).eq("student_id", studentId).maybeSingle();
  const row = data as unknown as TaskRow | null;
  if (!row) throw new Error("Cette question n’existe plus.");
  const task = row.task;
  const result = (correct: boolean, bonus: string[] | null): TaskAnswerResult => ({
    kind: task.kind, correct, correctIndex: row.correct_index, definition: task.options[row.correct_index] ?? "",
    word: task.kind === "vocabulary" ? row.word ?? task.word : null, form: task.kind === "vocabulary" ? task.form : null,
    explanation: task.kind === "comprehension" ? task.explanation || null : null, bonus: correct ? bonus : null,
  });
  if (row.answer_index != null) return result(Boolean(row.correct), row.bonus_unlocked ? await loadBonusScene(db, chapterId) : null);
  if (optionIndex < 0 || optionIndex >= task.options.length) throw new Error("Réponse invalide.");
  const correct = optionIndex === row.correct_index;
  const bonus = correct ? await loadBonusScene(db, chapterId) : null;
  const at = now.toISOString();
  await db.from("story_chapter_tasks").update({ answer_index: optionIndex, correct, answered_at: at, bonus_unlocked: Boolean(bonus) }).eq("chapter_id", chapterId).eq("student_id", studentId).is("answer_index", null);
  if (task.kind === "vocabulary" && row.due && row.sense_id) {
    await safe("task-evidence", null, () => recordWordReviewAttempt(db, { studentId, senseId: row.sense_id as string, format: "pick_definition", correct, source: "embedded", novelContext: true, occurrenceKey: `story-task:${chapterId}`, at }));
  }
  return result(correct, bonus);
}

/** Due words used in a chapter count as met inside content (D.6, source 'embedded'). Best effort. */
export async function recordEmbeddedExposure(db: Db, studentId: string, chapterId: string, paragraphs: string[], now = new Date()): Promise<number> {
  return safe("embedded-exposure", 0, async () => {
    const words = await dueWordsInText(db, studentId, paragraphs, now);
    if (!words.length) return 0;
    await recordWordEvidence(db, studentId, words.map((word) => ({
      target: { ...word.target, senseId: word.senseId }, format: "story_exposure", source: "embedded", correct: true,
      occurrenceKey: `story-embedded:${chapterId}:${word.target.vocabularyItemId}`, at: now.toISOString(),
    })));
    return words.length;
  });
}

// ---------------------------------------------------------------------------
// Endings (H.4) and the style card (H.6)
// ---------------------------------------------------------------------------

export type StoryFinale = {
  styleName: string;
  manner: string;
  styleCard: { text: string; excerpt: { text: string; source: string } | null };
  words: string[];
  minimumWords: number;
  maximumWords: number;
  saved: { body: string; styleChallenge: boolean } | null;
};

/** The three words of the ending: the saga's own target and micro-task words first, then rich words of the chapters read. */
export async function endingWordsFor(db: Db, studentId: string, sagaId: string): Promise<string[]> {
  const { data: saga } = await db.from("story_sagas").select("id,hero_name,hero_gender").eq("id", sagaId).eq("student_id", studentId).maybeSingle();
  if (!saga) throw new Error("Histoire introuvable.");
  const { data: progress } = await db.from("story_progress").select("path").eq("saga_id", sagaId).maybeSingle();
  const path = ((progress?.path as string[] | null) ?? []).slice(0, 12);
  if (!path.length) return pickEndingWords([], []);
  const [{ data: chapters }, { data: tasks }] = await Promise.all([
    db.from("story_chapters").select("id,chapter_index,body_template,target_lemmas").in("id", path),
    db.from("story_chapter_tasks").select("chapter_id,word").in("chapter_id", path),
  ]);
  const ordered = [...(chapters ?? [])].sort((a, b) => Number(a.chapter_index) - Number(b.chapter_index));
  const preferred = [
    ...(tasks ?? []).map((task) => task.word as string | null).filter((word): word is string => Boolean(word)),
    ...ordered.flatMap((chapter) => (Array.isArray(chapter.target_lemmas) ? chapter.target_lemmas as Array<{ lemma?: string }> : []).map((entry) => entry.lemma ?? "")),
  ];
  const hero = { name: saga.hero_name as string | null, gender: (saga.hero_gender as HeroGender) ?? "n" };
  const paragraphs = ordered.flatMap((chapter) => renderHero(String(chapter.body_template ?? ""), hero).split(/\n{2,}/u));
  return pickEndingWords(preferred, paragraphs);
}

export async function loadFinale(db: Db, studentId: string, sagaId: string, styleKey: string): Promise<StoryFinale> {
  const card = getStyleCard(styleKey);
  const excerpt = studentExcerpt(card);
  const spec = genreSpec("recit");
  const [words, { data: ending }] = await Promise.all([
    endingWordsFor(db, studentId, sagaId),
    db.from("story_endings").select("body,style_challenge").eq("saga_id", sagaId).eq("student_id", studentId).maybeSingle(),
  ]);
  return {
    styleName: card.studentFacingName, manner: mannerOf(card.studentFacingName),
    styleCard: { text: card.studentCard, excerpt: excerpt ? { text: excerpt.text, source: excerpt.source } : null },
    words, minimumWords: spec.minimumWords, maximumWords: spec.maximumWords,
    saved: ending ? { body: ending.body as string, styleChallenge: Boolean(ending.style_challenge) } : null,
  };
}

export async function saveEnding(db: Db, input: { studentId: string; sagaId: string; body: string; words: string[]; styleKey: string; styleChallenge: boolean; wordCount: number }): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db.from("story_endings").upsert({
    saga_id: input.sagaId, student_id: input.studentId, body: input.body, target_words: input.words, style_key: input.styleKey,
    style_challenge: input.styleChallenge, word_count: input.wordCount, updated_at: now,
  }, { onConflict: "saga_id" });
  if (error) throw new Error("Ta fin n’a pas pu être rangée. Réessaie dans un instant.");
}
