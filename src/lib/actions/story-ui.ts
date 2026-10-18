"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { getCurrentStudentId } from "@/lib/db/student";
import { requireStudentAccessAuthorized } from "@/lib/diagnostic/access";
import { journalStudentPayload } from "@/lib/diagnostic/granular/server-delivery-journal";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { moderateStudentText } from "@/lib/safety/moderate-input";
import { moderateOrReject } from "@/lib/safety/moderate-or-reject";
import { renderHero, sanitizeHeroName } from "@/lib/content/editorial/hero";
import { captureFreeWritingEvidence } from "@/lib/vocabulary/capture";
import { genreSpec } from "@/lib/writing/genres";
import { chooseBranch, getChapter, startSaga } from "./story";
import { avatarFor, STORY_AVATAR_KEYS } from "@/lib/story/avatars";
import { mannerOf } from "@/lib/story/copy";
import type { PublicStoryTask } from "@/lib/story/micro-task";
import { chapterUnlock, checkEnding } from "@/lib/story/rules";
import {
  answerChapterTask, dailyReadingState, endingWordsFor, ensureChapterTask, loadFinale, loadHero, recordEmbeddedExposure,
  saveEnding, saveHero, setAsideActiveSagas, storyAvailability, toPublicTask, type StoryFinale,
} from "@/lib/story/server";

/**
 * Student story mode actions (roadmap H.1–H.6). Thin wrappers: authenticate,
 * then delegate to the editorial actions (src/lib/actions/story.ts) and the
 * student layer (src/lib/story/server.ts). Pages using these export
 * maxDuration = 300 because chapter generation runs in after().
 */

const uuid = z.string().uuid();

async function studentContext() {
  await requireRole(["student"]);
  const supabase = await createClient();
  const studentId = await getCurrentStudentId(supabase);
  await requireStudentAccessAuthorized(supabase, studentId);
  return { supabase, studentId, service: createServiceClient() };
}

async function ownSaga(service: ReturnType<typeof createServiceClient>, studentId: string, sagaId: string) {
  const { data } = await service.from("story_sagas").select("id,style_key,status,hero_name,hero_gender,chapter_count").eq("id", sagaId).eq("student_id", studentId).maybeSingle();
  if (!data) throw new Error("Histoire introuvable.");
  return data as { id: string; style_key: string; status: string; hero_name: string | null; hero_gender: "f" | "m" | "n"; chapter_count: number };
}

export type ReaderChapter = { id: string; index: number; title: string | null; paragraphs: string[]; choices: Array<{ index: number; label: string }>; isLast: boolean };
export type ReaderView = {
  status: "ready" | "writing" | "unavailable" | "locked" | "finale";
  saga: { id: string; title: string | null; interest: string; styleName: string; manner: string; chapterCount: number; status: string };
  hero: { name: string | null; avatarEmoji: string; avatarLabel: string };
  chapter: ReaderChapter | null;
  task: PublicStoryTask | null;
  locked: null | { index: number; title: string | null; choice: string | null };
  bonus: boolean;
  finale: StoryFinale | null;
};

/** Current (or given) chapter, with the student layer: daily unlock, micro-task, finale. Never sends a locked chapter's text. */
export async function loadStoryChapter(input: unknown): Promise<ReaderView> {
  const data = z.object({ sagaId: uuid, chapterId: uuid.nullish() }).parse(input);
  const { studentId, service } = await studentContext();
  const saga = await ownSaga(service, studentId, data.sagaId);
  const [view, hero] = await Promise.all([getChapter({ sagaId: data.sagaId, chapterId: data.chapterId ?? null }), loadHero(service, studentId)]);
  const avatar = avatarFor(hero.avatar);
  const base: ReaderView = {
    status: view.status,
    saga: { id: view.saga.id, title: view.saga.title, interest: view.saga.interest, styleName: view.saga.styleName, manner: mannerOf(view.saga.styleName), chapterCount: view.saga.chapterCount, status: view.saga.status },
    hero: { name: sanitizeHeroName(saga.hero_name), avatarEmoji: avatar.emoji, avatarLabel: avatar.label },
    chapter: null, task: null, locked: null, bonus: false, finale: null,
  };
  let result = base;
  if (view.saga.status === "completed") {
    result = { ...base, status: "finale", finale: await loadFinale(service, studentId, saga.id, saga.style_key) };
  } else if (view.status === "ready" && view.chapter) {
    const chapter = view.chapter;
    const [{ data: read }, daily] = await Promise.all([
      service.from("story_chapter_reads").select("chapter_id").eq("student_id", studentId).eq("chapter_id", chapter.id).maybeSingle(),
      dailyReadingState(service, studentId),
    ]);
    const unlock = chapterUnlock({ chapterIndex: chapter.index, alreadyRead: Boolean(read), ...daily });
    if (unlock.locked) {
      const { data: row } = await service.from("story_chapters").select("parent_choice_id").eq("id", chapter.id).maybeSingle();
      const { data: choice } = row?.parent_choice_id ? await service.from("story_choices").select("label").eq("id", row.parent_choice_id).maybeSingle() : { data: null };
      const label = choice?.label ? renderHero(choice.label as string, { name: saga.hero_name, gender: saga.hero_gender }) : null;
      result = { ...base, status: "locked", locked: { index: chapter.index, title: chapter.title, choice: label } };
    } else {
      const choices = chapter.choices.map((choice) => ({ index: choice.index, label: choice.label }));
      const task = !chapter.isLast && choices.length === 2 ? toPublicTask(await ensureChapterTask(service, studentId, { id: chapter.id, paragraphs: chapter.paragraphs })) : null;
      result = { ...base, chapter: { id: chapter.id, index: chapter.index, title: chapter.title, paragraphs: chapter.paragraphs, choices, isLast: chapter.isLast }, task, bonus: unlock.bonus };
    }
  }
  return journalStudentPayload(studentId, "student:story-chapter", result);
}

/** H.3: answer the micro-task. Any answer opens the branch; due words count as embedded reviews. */
export async function answerStoryTask(input: unknown) {
  const data = z.object({ sagaId: uuid, chapterId: uuid, optionIndex: z.number().int().min(0).max(3) }).parse(input);
  const { studentId, service } = await studentContext();
  await ownSaga(service, studentId, data.sagaId);
  const { data: chapter } = await service.from("story_chapters").select("id").eq("id", data.chapterId).eq("saga_id", data.sagaId).maybeSingle();
  if (!chapter) throw new Error("Chapitre introuvable.");
  return answerChapterTask(service, studentId, data.chapterId, data.optionIndex);
}

/** Records the choice (and the 😀/😐/🙁 rating) and moves on; due words of the chapter count as met in content. */
export async function chooseStoryBranch(input: unknown): Promise<{ nextChapterId: string | null; completed: boolean }> {
  const data = z.object({ sagaId: uuid, chapterId: uuid, choiceIndex: z.number().int().min(0).max(1).nullable(), rating: z.enum(["happy", "neutral", "sad"]).nullish() }).parse(input);
  const { studentId, service } = await studentContext();
  const saga = await ownSaga(service, studentId, data.sagaId);
  const { data: chapter } = await service.from("story_chapters").select("id,chapter_index,body_template,status").eq("id", data.chapterId).eq("saga_id", saga.id).maybeSingle();
  if (!chapter || chapter.status !== "ready") throw new Error("Ce chapitre n’est pas encore prêt.");
  const [{ data: read }, daily] = await Promise.all([
    service.from("story_chapter_reads").select("chapter_id").eq("student_id", studentId).eq("chapter_id", chapter.id).maybeSingle(),
    dailyReadingState(service, studentId),
  ]);
  if (chapterUnlock({ chapterIndex: Number(chapter.chapter_index), alreadyRead: Boolean(read), ...daily }).locked) throw new Error("La suite s’ouvre demain.");
  if (!read && chapter.body_template) {
    const paragraphs = renderHero(chapter.body_template as string, { name: saga.hero_name, gender: saga.hero_gender }).split(/\n{2,}/u);
    await recordEmbeddedExposure(service, studentId, chapter.id as string, paragraphs);
  }
  const result = await chooseBranch({ sagaId: data.sagaId, chapterId: data.chapterId, choiceIndex: data.choiceIndex, rating: data.rating ?? null });
  revalidatePath("/student");
  return result;
}

const beginSchema = z.object({
  interest: z.string().trim().min(2).max(60),
  style: z.string().trim().regex(/^[a-z-]+$/u).max(40).nullish(),
  nickname: z.string().trim().max(24).nullish(),
  avatar: z.enum(STORY_AVATAR_KEYS),
  gender: z.enum(["f", "m", "n"]),
});

/**
 * H.1/H.2: starts a saga for one of the proposed interests. The nickname is
 * moderated and stored with the hero; it reaches the text only at read time
 * and is never sent to a model (the backend writes with a placeholder).
 */
export async function beginStorySaga(input: unknown): Promise<{ sagaId: string; nicknameKept: boolean }> {
  const data = beginSchema.parse(input);
  const { studentId, service } = await studentContext();
  const availability = await storyAvailability(service, studentId);
  if (!availability.interests.includes(data.interest)) throw new Error("Cette aventure n’est pas disponible pour le moment.");
  let nickname = sanitizeHeroName(data.nickname);
  let nicknameKept = true;
  if (nickname) {
    const moderation = await moderateStudentText(nickname);
    if (!moderation.allowed) { nickname = null; nicknameKept = false; }
  }
  await saveHero(service, studentId, { nickname, avatar: data.avatar, gender: data.gender });
  await setAsideActiveSagas(service, studentId);
  const { sagaId } = await startSaga({ interest: data.interest, style: data.style ?? null, hero: { name: nickname, gender: data.gender } });
  revalidatePath("/student");
  return { sagaId, nicknameKept };
}

/** H.4: the student's alternative ending, moderated, checked (3 words, récit length) and saved into the recueil. */
export async function submitStoryEnding(input: unknown): Promise<{ ok: true }> {
  const data = z.object({ sagaId: uuid, text: z.string().trim().min(1).max(4000), styleChallenge: z.boolean().default(false) }).parse(input);
  const { supabase, studentId, service } = await studentContext();
  const saga = await ownSaga(service, studentId, data.sagaId);
  if (saga.status !== "completed") throw new Error("Termine d’abord l’aventure.");
  const words = await endingWordsFor(service, studentId, saga.id);
  const spec = genreSpec("recit");
  const check = checkEnding(data.text, words, spec);
  if (!check.lengthOk) throw new Error(`Ta fin doit faire entre ${spec.minimumWords} et ${spec.maximumWords} mots.`);
  if (!check.ready) throw new Error("Il manque encore un des trois mots dans ta fin.");
  await moderateOrReject({ supabase, studentId, text: data.text, field: "story_ending" });
  await saveEnding(service, { studentId, sagaId: saga.id, body: data.text, words, styleKey: saga.style_key, styleChallenge: data.styleChallenge, wordCount: check.wordCount });
  await captureFreeWritingEvidence(service, { studentId, text: data.text, source: "story", occurrenceKey: `story-ending:${saga.id}`, at: new Date().toISOString() });
  revalidatePath("/student/recueil");
  return { ok: true };
}
