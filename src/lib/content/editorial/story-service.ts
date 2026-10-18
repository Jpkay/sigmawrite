import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEditorialBrief, type EditorialBrief } from "./brief";
import { bridgeSentence, pickFallback, type FallbackCandidate } from "./fallback";
import type { GateDeps } from "./gates";
import { renderHero } from "./hero";
import type { LiveDecision } from "./kill-switch";
import { runLiveChapter } from "./live";
import type { EditorialLLM } from "./llm";
import type { SagaOutline } from "./prompts";
import { allowedCastNames, appendToSummary, architectSaga, chapterCountFor, tensesForChapter } from "./saga";
import { finishRun, startRun, SupabaseRunLogger } from "./store";
import { getStyleCard, pickStyle, studentExcerpt } from "./styles";
import { getDueWordCards } from "@/lib/vocabulary/server";
import { captureReadingExposure } from "@/lib/vocabulary/capture";
import { EDITORIAL_PIPELINE_VERSION, TENSES_BY_BAND, gradeBandFor, type GradeBand, type TargetLemma, type TenseKey } from "./types";

/**
 * Story mode backend (roadmap H.1, H.11, H.13, H.14). Pure orchestration over
 * a service-role client; the server actions in src/lib/actions/story.ts do
 * the auth and ownership checks and call these functions.
 */

export type TargetWordSource = (db: SupabaseClient, studentId: string, grade: number) => Promise<{ newLemmas: TargetLemma[]; dueLemmas: TargetLemma[] }>;

const SIMPLE_LEMMA = /^[\p{L}][\p{L}' -]{1,38}$/u;

/**
 * Default target words: today's due cards and words to introduce from the
 * word-memory interface (src/lib/vocabulary, getDueWordCards), caps applied.
 * Failures return no targets: a chapter is still written.
 */
export const defaultTargetWords: TargetWordSource = async (db, studentId) => {
  try {
    const plan = await getDueWordCards(db, studentId);
    const dueLemmas = plan.reviews
      .filter((r) => r.word && SIMPLE_LEMMA.test(r.word))
      .map((r) => ({ lemma: r.word as string, kind: "due" as const, definition: r.definition ?? undefined }))
      .filter((l, i, all) => all.findIndex((x) => x.lemma === l.lemma) === i).slice(0, 5);
    const newLemmas = plan.toIntroduce.filter((w) => SIMPLE_LEMMA.test(w.word)).slice(0, Math.min(2, plan.newWordAllowance))
      .map((w) => ({ lemma: w.word, kind: "new" as const, definition: w.definition ?? undefined }));
    return { newLemmas, dueLemmas };
  } catch {
    return { newLemmas: [], dueLemmas: [] };
  }
};

export type StoryDeps = {
  db: SupabaseClient;
  llm: EditorialLLM | null;
  gates: Omit<GateDeps, "forbiddenNames" | "allowedNames">;
  liveDecision: (studentId: string) => Promise<LiveDecision>;
  targetWords?: TargetWordSource;
};

type SagaRow = { id: string; student_id: string; interest: string; style_key: string; grade_band: GradeBand; narration: "tu" | "il" | "je"; hero_name: string | null; hero_gender: "f" | "m" | "n"; title: string | null; outline: SagaOutline | null; running_summary: string; chapter_count: number; status: string };
type ChapterRow = { id: string; saga_id: string; chapter_index: number; parent_choice_id: string | null; title: string | null; body_template: string | null; bridge: string | null; status: string; source: string | null; fallback_item_id: string | null; created_at: string };

async function loadSaga(db: SupabaseClient, sagaId: string): Promise<SagaRow> {
  const { data, error } = await db.from("story_sagas").select("*").eq("id", sagaId).single();
  if (error || !data) throw new Error("saga_not_found");
  return data as SagaRow;
}

async function studentGrade(db: SupabaseClient, studentId: string): Promise<{ grade: number; displayName: string | null }> {
  const { data } = await db.from("students").select("current_grade,display_name").eq("id", studentId).maybeSingle();
  const grade = Math.min(9, Math.max(4, Number(data?.current_grade ?? 6) || 6));
  return { grade, displayName: (data?.display_name as string | null) ?? null };
}

export async function createSaga(deps: StoryDeps, input: { studentId: string; interest: string; styleKey?: string | null; hero?: { name?: string | null; gender?: "f" | "m" | "n" } }): Promise<string> {
  const { grade } = await studentGrade(deps.db, input.studentId);
  const band = gradeBandFor(grade);
  const { data: previous } = await deps.db.from("story_sagas").select("style_key").eq("student_id", input.studentId).order("created_at", { ascending: true }).limit(50);
  const style = pickStyle(band, "chapter", (previous ?? []).map((r) => r.style_key as string), input.styleKey);
  const heroName = input.hero?.name?.trim() ? input.hero.name.trim().slice(0, 24) : null;
  const { data, error } = await deps.db.from("story_sagas").insert({
    student_id: input.studentId, interest: input.interest, style_key: style.key, grade_band: band,
    narration: heroName ? "il" : "tu", hero_name: heroName, hero_gender: input.hero?.gender ?? "n",
    chapter_count: chapterCountFor(band), status: "writing", pipeline_version: EDITORIAL_PIPELINE_VERSION,
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "saga_not_created");
  return data.id as string;
}

/** Claims a chapter slot (saga × index × parent choice). Returns the row and whether we own generation. */
async function claimChapter(db: SupabaseClient, sagaId: string, chapterIndex: number, parentChoiceId: string | null): Promise<{ row: ChapterRow; owned: boolean }> {
  const lookup = async () => {
    let query = db.from("story_chapters").select("*").eq("saga_id", sagaId).eq("chapter_index", chapterIndex);
    query = parentChoiceId ? query.eq("parent_choice_id", parentChoiceId) : query.is("parent_choice_id", null);
    const { data } = await query.maybeSingle();
    return data as ChapterRow | null;
  };
  const existing = await lookup();
  if (existing) {
    const stale = existing.status === "generating" && Date.now() - new Date(existing.created_at).getTime() > 5 * 60_000;
    if (existing.status === "failed" || existing.status === "pending" || stale) {
      const { data } = await db.from("story_chapters").update({ status: "generating", created_at: new Date().toISOString() }).eq("id", existing.id).eq("status", existing.status).select("*").maybeSingle();
      if (data) return { row: data as ChapterRow, owned: true };
    }
    return { row: existing, owned: false };
  }
  const { data, error } = await db.from("story_chapters").insert({ saga_id: sagaId, chapter_index: chapterIndex, parent_choice_id: parentChoiceId, status: "generating", pipeline_version: EDITORIAL_PIPELINE_VERSION }).select("*").single();
  if (error || !data) {
    const raced = await lookup();
    if (raced) return { row: raced, owned: false };
    throw new Error(error?.message ?? "chapter_claim_failed");
  }
  return { row: data as ChapterRow, owned: true };
}

async function ensureOutline(deps: StoryDeps, saga: SagaRow, brief: EditorialBrief): Promise<SagaOutline | null> {
  if (saga.outline) return saga.outline;
  if (!deps.llm) return null;
  const runId = await startRun(deps.db, { mode: "live", kind: "saga_outline", brief, sagaId: saga.id });
  try {
    const outline = await architectSaga(brief, getStyleCard(saga.style_key), deps.llm, new SupabaseRunLogger(deps.db, runId));
    await deps.db.from("story_sagas").update({ outline, title: outline.title, updated_at: new Date().toISOString() }).eq("id", saga.id);
    await finishRun(deps.db, runId, { status: "published", costUsd: 0 });
    return outline;
  } catch (error) {
    await finishRun(deps.db, runId, { status: "failed", reasons: [error instanceof Error ? error.message.slice(0, 200) : "error"], costUsd: 0 });
    return null;
  }
}

async function loadFallbackPool(db: SupabaseClient, band: GradeBand): Promise<FallbackCandidate[]> {
  const { data } = await db.from("editorial_library_items").select("id,interest,grade_band,style_key,title,body,choices,used_count").eq("kind", "fallback_chapter").eq("grade_band", band).eq("status", "published").limit(200);
  return (data ?? []).map((r) => ({ id: r.id as string, interest: r.interest as string, gradeBand: r.grade_band as string, styleKey: r.style_key as string, title: r.title as string, body: r.body as string, choices: (r.choices as FallbackCandidate["choices"]) ?? [], usedCount: Number(r.used_count ?? 0) }));
}

async function saveChoices(db: SupabaseClient, chapterId: string, choices: Array<{ label: string; intent?: string }>) {
  if (!choices.length) return;
  await db.from("story_choices").upsert(choices.slice(0, 2).map((c, index) => ({ chapter_id: chapterId, choice_index: index, label: c.label, intent: c.intent ?? null })), { onConflict: "chapter_id,choice_index" });
}

async function serveFallback(deps: StoryDeps, saga: SagaRow, chapter: ChapterRow, previousChoice: string | null, reason: string): Promise<void> {
  const { data: used } = await deps.db.from("story_chapters").select("fallback_item_id").eq("saga_id", saga.id).not("fallback_item_id", "is", null);
  const pick = pickFallback(await loadFallbackPool(deps.db, saga.grade_band), { interest: saga.interest, gradeBand: saga.grade_band, styleKey: saga.style_key }, (used ?? []).map((u) => u.fallback_item_id as string));
  if (!pick) {
    // No fallback in the pool yet: the UI keeps showing "Ton aventure s'écrit…" and retries.
    await deps.db.from("story_chapters").update({ status: "failed", scores: { fallbackReason: reason, pool: "empty" } }).eq("id", chapter.id);
    return;
  }
  const isLast = chapter.chapter_index >= saga.chapter_count;
  await deps.db.from("story_chapters").update({
    title: pick.title, body_template: pick.body, bridge: chapter.chapter_index > 1 ? bridgeSentence(previousChoice, chapter.chapter_index) : null,
    status: "ready", source: "fallback", fallback_item_id: pick.id, scores: { fallbackReason: reason }, ready_at: new Date().toISOString(),
  }).eq("id", chapter.id);
  await deps.db.from("editorial_library_items").update({ used_count: pick.usedCount + 1 }).eq("id", pick.id);
  if (!isLast) await saveChoices(deps.db, chapter.id, pick.choices);
}

/** Generates one chapter slot (live, else fallback). Idempotent: concurrent calls share one generation. */
export async function generateChapter(deps: StoryDeps, input: { sagaId: string; chapterIndex: number; parentChoiceId: string | null }): Promise<string> {
  const saga = await loadSaga(deps.db, input.sagaId);
  const { row, owned } = await claimChapter(deps.db, saga.id, input.chapterIndex, input.parentChoiceId);
  if (!owned) return row.id;
  let previousChoice: string | null = null;
  if (input.parentChoiceId) {
    const { data } = await deps.db.from("story_choices").select("label").eq("id", input.parentChoiceId).maybeSingle();
    previousChoice = (data?.label as string | undefined) ?? null;
  }
  const decision = await deps.liveDecision(saga.student_id);
  if (!decision.live || !deps.llm) { await serveFallback(deps, saga, row, previousChoice, decision.reason); return row.id; }

  const { grade, displayName } = await studentGrade(deps.db, saga.student_id);
  const words = await (deps.targetWords ?? defaultTargetWords)(deps.db, saga.student_id, grade);
  const baseBrief = buildEditorialBrief({ kind: "chapter", mode: "live", interests: [saga.interest], grade, gradeBand: saga.grade_band, newLemmas: words.newLemmas, dueLemmas: words.dueLemmas, targetTenses: TENSES_BY_BAND[saga.grade_band].slice(0, 2), styleKey: saga.style_key, narration: saga.narration, heroGender: saga.hero_gender });
  const outline = await ensureOutline(deps, saga, baseBrief);
  const tenses: TenseKey[] = tensesForChapter(outline, input.chapterIndex, baseBrief.targetTenses);
  const brief = { ...baseBrief, targetTenses: tenses };
  const runId = await startRun(deps.db, { mode: "live", kind: "chapter", brief, sagaId: saga.id, chapterId: row.id });
  const forbiddenNames = [saga.hero_name, displayName].filter((n): n is string => Boolean(n && n.trim().length >= 2));
  const outcome = await runLiveChapter({
    brief, style: getStyleCard(saga.style_key),
    context: { outline, chapterIndex: input.chapterIndex, chapterCount: saga.chapter_count, storySoFar: saga.running_summary, previousChoice },
    gates: { ...deps.gates, forbiddenNames, allowedNames: allowedCastNames(outline) },
  }, deps.llm, new SupabaseRunLogger(deps.db, runId));
  if (outcome.decision === "publish") {
    await deps.db.from("story_chapters").update({
      title: outcome.text.title, body_template: outcome.text.body, chapter_summary: outcome.text.chapterSummary,
      target_lemmas: brief.targetLemmas, target_tenses: brief.targetTenses, status: "ready", source: "live", run_id: runId,
      word_count: outcome.gates.wordCount, scores: { rubricMean: outcome.reviews.rubricMean, rubric: outcome.reviews.rubric, aiTells: outcome.gates.aiTells.score, styleFit: outcome.gates.styleFit, rewrites: outcome.rewrites },
      ready_at: new Date().toISOString(),
    }).eq("id", row.id);
    if (input.chapterIndex < saga.chapter_count) await saveChoices(deps.db, row.id, outcome.text.choices);
    await finishRun(deps.db, runId, { status: "published", reasons: outcome.verdict.reasons, rubricMean: outcome.reviews.rubricMean, aiTells: outcome.gates.aiTells.score, gates: outcome.gates.results.map((r) => ({ gate: r.gate, passed: r.passed, level: r.level })), costUsd: outcome.costUsd, latencyMs: outcome.latencyMs });
  } else {
    await finishRun(deps.db, runId, { status: "fallback", reasons: [outcome.reason, ...(outcome.verdict?.reasons ?? [])], costUsd: outcome.costUsd, latencyMs: outcome.latencyMs });
    await serveFallback(deps, saga, row, previousChoice, outcome.reason);
  }
  if (saga.status === "writing") await deps.db.from("story_sagas").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", saga.id);
  return row.id;
}

/** H.11: while the student reads chapter N, prepare chapter N+1 for both choices. */
export async function prefetchBranches(deps: StoryDeps, sagaId: string, chapterId: string): Promise<void> {
  const saga = await loadSaga(deps.db, sagaId);
  const { data: chapter } = await deps.db.from("story_chapters").select("chapter_index,status").eq("id", chapterId).eq("saga_id", sagaId).maybeSingle();
  if (!chapter || chapter.status !== "ready" || Number(chapter.chapter_index) >= saga.chapter_count) return;
  const { data: choices } = await deps.db.from("story_choices").select("id").eq("chapter_id", chapterId);
  await Promise.allSettled((choices ?? []).map((c) => generateChapter(deps, { sagaId, chapterIndex: Number(chapter.chapter_index) + 1, parentChoiceId: c.id as string })));
}

export type ChapterView = {
  status: "ready" | "writing" | "unavailable";
  saga: { id: string; title: string | null; interest: string; styleKey: string; styleName: string; chapterCount: number; status: string };
  chapter: null | { id: string; index: number; title: string | null; paragraphs: string[]; choices: Array<{ id: string; index: number; label: string; task: unknown }>; isLast: boolean; source: string | null };
  /** End-of-saga style card (H.6), only once the last chapter is read. */
  styleReveal: null | { text: string; excerpt: { text: string; source: string } | null };
};

export async function readChapter(deps: Pick<StoryDeps, "db">, input: { sagaId: string; chapterId?: string | null }): Promise<ChapterView> {
  const saga = await loadSaga(deps.db, input.sagaId);
  const style = getStyleCard(saga.style_key);
  const sagaView = { id: saga.id, title: saga.title, interest: saga.interest, styleKey: saga.style_key, styleName: style.studentFacingName, chapterCount: saga.chapter_count, status: saga.status };
  let chapterId = input.chapterId ?? null;
  if (!chapterId) {
    const { data: progress } = await deps.db.from("story_progress").select("current_chapter_id").eq("saga_id", saga.id).maybeSingle();
    chapterId = (progress?.current_chapter_id as string | null) ?? null;
  }
  let query = deps.db.from("story_chapters").select("*").eq("saga_id", saga.id);
  query = chapterId ? query.eq("id", chapterId) : query.eq("chapter_index", 1).is("parent_choice_id", null);
  const { data: row } = await query.maybeSingle();
  const chapter = row as ChapterRow | null;
  const reveal = saga.status === "completed" ? { text: style.studentCard, excerpt: (() => { const e = studentExcerpt(style); return e ? { text: e.text, source: e.source } : null; })() } : null;
  if (!chapter || chapter.status !== "ready" || !chapter.body_template) {
    return { status: chapter?.status === "failed" && Date.now() - new Date(chapter.created_at).getTime() > 10 * 60_000 ? "unavailable" : "writing", saga: sagaView, chapter: null, styleReveal: reveal };
  }
  const { data: choices } = await deps.db.from("story_choices").select("id,choice_index,label,task").eq("chapter_id", chapter.id).order("choice_index");
  const hero = { name: saga.hero_name, gender: saga.hero_gender };
  const text = [chapter.bridge, chapter.body_template].filter(Boolean).join("\n\n");
  return {
    status: "ready",
    saga: sagaView,
    chapter: {
      id: chapter.id, index: chapter.chapter_index, title: chapter.title,
      paragraphs: renderHero(text, hero).split(/\n{2,}/u).map((p) => p.trim()).filter(Boolean),
      choices: (choices ?? []).map((c) => ({ id: c.id as string, index: Number(c.choice_index), label: renderHero(c.label as string, hero), task: c.task ?? null })),
      isLast: chapter.chapter_index >= saga.chapter_count, source: chapter.source,
    },
    styleReveal: reveal,
  };
}

/** Records the choice, moves progress to the next chapter (prefetched in the best case). */
export async function choose(deps: StoryDeps, input: { sagaId: string; chapterId: string; choiceIndex: number | null; rating?: "happy" | "neutral" | "sad" | null }): Promise<{ nextChapterId: string | null; completed: boolean }> {
  const saga = await loadSaga(deps.db, input.sagaId);
  const { data: chapter } = await deps.db.from("story_chapters").select("id,chapter_index,chapter_summary,status").eq("id", input.chapterId).eq("saga_id", saga.id).single();
  if (!chapter || chapter.status !== "ready") throw new Error("chapter_not_ready");
  const isLast = Number(chapter.chapter_index) >= saga.chapter_count;
  let choice: { id: string; label: string } | null = null;
  if (!isLast) {
    const { data } = await deps.db.from("story_choices").select("id,label").eq("chapter_id", chapter.id).eq("choice_index", input.choiceIndex ?? -1).maybeSingle();
    if (!data) throw new Error("choice_not_found");
    choice = { id: data.id as string, label: data.label as string };
  }
  // D.6: words met in the chapter count as embedded exposure (best effort, never blocks the student).
  const { data: body } = await deps.db.from("story_chapters").select("body_template").eq("id", chapter.id).maybeSingle();
  if (body?.body_template) await captureReadingExposure(deps.db, { studentId: saga.student_id, sessionId: `story:${chapter.id}`, textVersionId: chapter.id as string, paragraphs: renderHero(body.body_template as string, { name: saga.hero_name, gender: saga.hero_gender }).split(/\n{2,}/u), interest: saga.interest, at: new Date().toISOString(), source: "story" });
  await deps.db.from("story_chapter_reads").upsert({ student_id: saga.student_id, chapter_id: chapter.id, choice_id: choice?.id ?? null, rating: input.rating ?? null, read_at: new Date().toISOString() }, { onConflict: "student_id,chapter_id" });
  const summary = appendToSummary(saga.running_summary, Number(chapter.chapter_index), (chapter.chapter_summary as string | null) ?? "", choice?.label ?? null);
  if (isLast) {
    await deps.db.from("story_sagas").update({ status: "completed", running_summary: summary, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", saga.id);
    await upsertProgress(deps.db, saga, chapter.id as string, chapter.id as string);
    return { nextChapterId: null, completed: true };
  }
  await deps.db.from("story_sagas").update({ running_summary: summary, updated_at: new Date().toISOString() }).eq("id", saga.id);
  const nextId = await generateChapterIdOrClaim(deps, saga.id, Number(chapter.chapter_index) + 1, choice!.id);
  await upsertProgress(deps.db, saga, chapter.id as string, nextId);
  return { nextChapterId: nextId, completed: false };
}

async function generateChapterIdOrClaim(deps: StoryDeps, sagaId: string, chapterIndex: number, parentChoiceId: string): Promise<string> {
  const { data } = await deps.db.from("story_chapters").select("id,status").eq("saga_id", sagaId).eq("chapter_index", chapterIndex).eq("parent_choice_id", parentChoiceId).maybeSingle();
  if (data && data.status !== "failed") return data.id as string;
  const { row } = await claimChapter(deps.db, sagaId, chapterIndex, parentChoiceId);
  // Generation itself runs in the background (after()); the row id is returned at once.
  if (row.status === "generating" || row.status === "failed") await deps.db.from("story_chapters").update({ status: "pending" }).eq("id", row.id).eq("status", row.status);
  return row.id;
}

async function upsertProgress(db: SupabaseClient, saga: SagaRow, readChapterId: string, currentChapterId: string) {
  const { data: progress } = await db.from("story_progress").select("path,chapters_read").eq("saga_id", saga.id).maybeSingle();
  const path = [...((progress?.path as string[] | undefined) ?? [])];
  if (!path.includes(readChapterId)) path.push(readChapterId);
  await db.from("story_progress").upsert({ saga_id: saga.id, student_id: saga.student_id, current_chapter_id: currentChapterId, path, chapters_read: path.length, last_read_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "saga_id" });
}

/** Pending slots (chosen branch not prefetched, or a failed attempt) — generated by actions' after() or the prefetch route. */
export async function generatePending(deps: StoryDeps, sagaId: string): Promise<void> {
  const { data } = await deps.db.from("story_chapters").select("chapter_index,parent_choice_id,status").eq("saga_id", sagaId).in("status", ["pending", "failed"]).limit(4);
  await Promise.allSettled((data ?? []).map((r) => generateChapter(deps, { sagaId, chapterIndex: Number(r.chapter_index), parentChoiceId: (r.parent_choice_id as string | null) ?? null })));
}
