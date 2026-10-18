"use server";

import { after } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { getCurrentStudentId } from "@/lib/db/student";
import { requireStudentAccessAuthorized } from "@/lib/diagnostic/access";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { moderateStudentText } from "@/lib/safety/moderate-input";
import { sanitizeStudentTopic } from "@/lib/safety/topic";
import { choose, createSaga, generateChapter, generatePending, prefetchBranches, readChapter, type ChapterView } from "@/lib/content/editorial/story-service";
import { storyDeps } from "@/lib/content/editorial/runtime";

/**
 * Story mode server actions (roadmap H.1–H.6 backend). The UI stream builds
 * the player on these. Every action checks the student session and saga
 * ownership, then works through the service role. Generation never blocks a
 * response: it runs in after(), and getChapter returns status "writing"
 * until the chapter is ready ("Ton aventure s'écrit…").
 */

const uuid = z.string().uuid();

async function studentContext() {
  await requireRole(["student"]);
  const supabase = await createClient();
  const studentId = await getCurrentStudentId(supabase);
  await requireStudentAccessAuthorized(supabase, studentId);
  return { studentId, service: createServiceClient() };
}

async function assertOwnSaga(service: ReturnType<typeof createServiceClient>, studentId: string, sagaId: string) {
  const { data } = await service.from("story_sagas").select("id").eq("id", sagaId).eq("student_id", studentId).maybeSingle();
  if (!data) throw new Error("Histoire introuvable.");
}

const startSchema = z.object({
  interest: z.string().trim().min(2).max(60),
  style: z.string().trim().regex(/^[a-z-]+$/u).max(40).nullish(),
  hero: z.object({ name: z.string().trim().max(24).nullish(), gender: z.enum(["f", "m", "n"]).default("n") }).nullish(),
});

/** startSaga(interest, style?) — creates the saga and writes its outline + chapter 1 in the background. */
export async function startSaga(input: unknown): Promise<{ sagaId: string }> {
  const data = startSchema.parse(input);
  const { studentId, service } = await studentContext();
  const topic = sanitizeStudentTopic(data.interest);
  if (!topic.allowed) throw new Error("Ce thème n'est pas disponible.");
  let heroName = data.hero?.name ?? null;
  if (heroName) {
    // A nickname is student free text: moderated, never sent to a model.
    const moderation = await moderateStudentText(heroName);
    if (!moderation.allowed) heroName = null;
  }
  const deps = storyDeps(service);
  const sagaId = await createSaga(deps, { studentId, interest: topic.value, styleKey: data.style ?? null, hero: { name: heroName, gender: data.hero?.gender ?? "n" } });
  after(async () => { await generateChapter(deps, { sagaId, chapterIndex: 1, parentChoiceId: null }).catch(() => undefined); });
  return { sagaId };
}

/** getChapter(sagaId, chapterId?) — current chapter rendered with the hero's name; prefetches both next branches. */
export async function getChapter(input: unknown): Promise<ChapterView> {
  const data = z.object({ sagaId: uuid, chapterId: uuid.nullish() }).parse(input);
  const { studentId, service } = await studentContext();
  await assertOwnSaga(service, studentId, data.sagaId);
  const view = await readChapter({ db: service }, { sagaId: data.sagaId, chapterId: data.chapterId ?? null });
  const deps = storyDeps(service);
  if (view.status === "ready" && view.chapter && !view.chapter.isLast) {
    const chapterId = view.chapter.id;
    after(async () => { await prefetchBranches(deps, data.sagaId, chapterId).catch(() => undefined); });
  } else if (view.status === "writing") {
    after(async () => {
      await generatePending(deps, data.sagaId).catch(() => undefined);
      // Chapter 1 slot may not exist yet if startSaga's background work was lost.
      await generateChapter(deps, { sagaId: data.sagaId, chapterIndex: 1, parentChoiceId: null }).catch(() => undefined);
    });
  }
  return view;
}

/** chooseBranch(sagaId, chapterId, choiceIndex, rating?) — records the choice and moves on (next chapter usually prefetched). */
export async function chooseBranch(input: unknown): Promise<{ nextChapterId: string | null; completed: boolean }> {
  const data = z.object({ sagaId: uuid, chapterId: uuid, choiceIndex: z.number().int().min(0).max(1).nullable(), rating: z.enum(["happy", "neutral", "sad"]).nullish() }).parse(input);
  const { studentId, service } = await studentContext();
  await assertOwnSaga(service, studentId, data.sagaId);
  const deps = storyDeps(service);
  const result = await choose(deps, { sagaId: data.sagaId, chapterId: data.chapterId, choiceIndex: data.choiceIndex, rating: data.rating ?? null });
  if (result.nextChapterId) after(async () => { await generatePending(deps, data.sagaId).catch(() => undefined); });
  return result;
}

/** reportText(kind, contentId, reason, note?) — "Signaler ce texte". Feeds the audit (H.15); never deletes by itself. */
export async function reportText(input: unknown): Promise<{ ok: true }> {
  const data = z.object({
    kind: z.enum(["story_chapter", "passage", "dictation"]),
    contentId: uuid,
    reason: z.enum(["inappropriate", "confusing", "boring", "error", "other"]),
    note: z.string().trim().max(500).nullish(),
  }).parse(input);
  const { studentId, service } = await studentContext();
  if (data.kind === "story_chapter") {
    const { data: chapter } = await service.from("story_chapters").select("saga_id").eq("id", data.contentId).maybeSingle();
    if (!chapter) throw new Error("Texte introuvable.");
    await assertOwnSaga(service, studentId, chapter.saga_id as string);
  }
  let note = data.note || null;
  if (note) {
    const moderation = await moderateStudentText(note);
    if (!moderation.allowed) note = null;
  }
  const { error } = await service.from("editorial_text_reports").insert({ student_id: studentId, content_kind: data.kind, content_id: data.contentId, reason: data.reason, note });
  if (error) throw new Error("Ton signalement n'a pas pu être envoyé.");
  return { ok: true };
}
