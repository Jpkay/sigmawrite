"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import styles from "./story.module.css";
import { ChapterPage } from "./chapter-page";
import { ChoiceCards, RatingRow, StoryTaskPanel, type TaskAnswer } from "./choice-panel";
import { EndingWriter } from "./ending-writer";
import { ReportText } from "./report-text";
import { StyleCard } from "./style-card";
import { WritingWait } from "./writing-wait";
import { Button, buttonVariants } from "@/components/ui/button";
import { answerStoryTask, chooseStoryBranch, loadStoryChapter, submitStoryEnding, type ReaderView } from "@/lib/actions/story-ui";
import { STORY_COPY as copy, type StoryRating } from "@/lib/story/copy";
import type { PublicStoryTask } from "@/lib/story/micro-task";
import { track } from "@/lib/analytics";

const POLL_MS = 3000;
/** H.11: after ~20 s the message changes; the backend keeps going and falls back by itself. */
const LONG_WAIT_MS = 20_000;
const GIVE_UP_MS = 4 * 60_000;

export type ReaderActions = {
  load: typeof loadStoryChapter;
  answer: typeof answerStoryTask;
  choose: typeof chooseStoryBranch;
  submitEnding: typeof submitStoryEnding;
};

const DEFAULT_ACTIONS: ReaderActions = { load: loadStoryChapter, answer: answerStoryTask, choose: chooseStoryBranch, submitEnding: submitStoryEnding };

function answerFrom(task: PublicStoryTask | null): TaskAnswer | null {
  if (!task?.answered) return null;
  return { ...task.answered, definition: task.options[task.answered.correctIndex] ?? "" };
}

function prefetch(sagaId: string, chapterId: string) {
  // Fire and forget (H.11): prepares both next branches while the student reads.
  void fetch("/api/story/prefetch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sagaId, chapterId }), keepalive: true }).catch(() => undefined);
}

export function StoryReader({ initial, actions = DEFAULT_ACTIONS }: { initial: ReaderView; actions?: ReaderActions }) {
  const [view, setView] = useState(initial);
  const [pendingChapterId, setPendingChapterId] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState<TaskAnswer | null>(answerFrom(initial.task));
  const [rating, setRating] = useState<StoryRating | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [waitedMs, setWaitedMs] = useState(0);
  const prefetched = useRef(new Set<string>());
  const topRef = useRef<HTMLDivElement>(null);
  const sagaId = view.saga.id;

  const show = useCallback((next: ReaderView) => {
    setView(next);
    setSelected(null);
    setAnswer(answerFrom(next.task));
    setRating(null);
    setError("");
    setWaitedMs(0);
  }, []);

  // Prefetch both next branches as soon as a chapter is on screen.
  useEffect(() => {
    if (view.status !== "ready" || !view.chapter || view.chapter.isLast || prefetched.current.has(view.chapter.id)) return;
    prefetched.current.add(view.chapter.id);
    prefetch(sagaId, view.chapter.id);
    track("story_chapter_viewed", { saga_id: sagaId, chapter_index: view.chapter.index, bonus: view.bonus });
  }, [view, sagaId]);

  // "Ton aventure s'écrit…": poll gently until the chapter is ready.
  useEffect(() => {
    if (view.status !== "writing") return;
    if (pendingChapterId && !prefetched.current.has(`pending:${pendingChapterId}`)) {
      prefetched.current.add(`pending:${pendingChapterId}`);
      prefetch(sagaId, pendingChapterId);
    }
    const started = Date.now();
    let active = true;
    const timer = setInterval(() => {
      const waited = Date.now() - started;
      setWaitedMs(waited);
      if (waited > GIVE_UP_MS) { clearInterval(timer); setView((current) => ({ ...current, status: "unavailable" })); return; }
      actions.load({ sagaId, chapterId: pendingChapterId }).then((next) => { if (active && next.status !== "writing") show(next); }).catch(() => undefined);
    }, POLL_MS);
    return () => { active = false; clearInterval(timer); };
  }, [view.status, pendingChapterId, sagaId, actions, show]);

  useEffect(() => { topRef.current?.scrollIntoView({ block: "start" }); }, [view.chapter?.id, view.status]);

  async function onAnswer(optionIndex: number) {
    if (!view.chapter) return;
    setBusy(true);
    try {
      const result = await actions.answer({ sagaId, chapterId: view.chapter.id, optionIndex });
      setAnswer({ optionIndex, correct: result.correct, correctIndex: result.correctIndex, definition: result.definition });
      track("story_task_answered", { saga_id: sagaId, correct: result.correct });
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  async function openNext(choiceIndex: number | null) {
    if (!view.chapter) return;
    setBusy(true);
    setError("");
    try {
      const result = await actions.choose({ sagaId, chapterId: view.chapter.id, choiceIndex, rating });
      track("story_choice_made", { saga_id: sagaId, chapter_index: view.chapter.index, completed: result.completed });
      setPendingChapterId(result.nextChapterId);
      show(await actions.load({ sagaId, chapterId: result.nextChapterId }));
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : copy.error);
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    setBusy(true);
    try { show(await actions.load({ sagaId, chapterId: pendingChapterId })); } catch { setError(copy.error); } finally { setBusy(false); }
  }

  const chapter = view.chapter;
  const task = view.task;
  const canOpen = selected !== null && (!task || answer !== null);

  return (
    <div ref={topRef} className="scroll-mt-24 pb-16">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/student/histoire" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft aria-hidden="true" className="size-4" />{copy.back}</Link>
        <p className="truncate text-sm text-muted-foreground"><span className={`${styles.serif} italic`}>{view.saga.title ?? copy.eyebrow}</span> · {view.saga.manner}</p>
      </div>

      {view.status === "writing" && <WritingWait longer={waitedMs > LONG_WAIT_MS} />}

      {view.status === "unavailable" && (
        <div role="status" className="mx-auto max-w-md py-16 text-center">
          <p className={`${styles.serif} text-2xl italic`}>{copy.unavailableTitle}</p>
          <p className="mt-3 text-[15px] text-muted-foreground">{copy.unavailableHelp}</p>
          <Button className="mt-6" variant="outline" disabled={busy} onClick={() => void retry()}>{copy.retry}</Button>
        </div>
      )}

      {view.status === "locked" && view.locked && (
        <section className={`${styles.fadeIn} mx-auto max-w-[36rem] border border-border-strong bg-card p-8 text-center`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{copy.chapter(view.locked.index, view.saga.chapterCount)}</p>
          {view.locked.title && <p className={`${styles.serif} mt-3 text-2xl italic`}>{view.locked.title}</p>}
          {view.locked.choice && <p className="mt-4 text-[15px]">{copy.lockedChoice(view.locked.choice)}</p>}
          <p aria-hidden="true" className={`${styles.ornament} my-6`}>✦ ✦ ✦</p>
          <h2 className="text-xl font-semibold">{copy.lockedTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">{copy.lockedHelp}</p>
          <Link href="/student" className={`${buttonVariants({ variant: "outline" })} mt-6`}>{copy.lockedBack} <ArrowRight /></Link>
        </section>
      )}

      {view.status === "ready" && chapter && (
        <>
          {view.bonus && <p className="mx-auto mb-6 flex max-w-[36rem] items-center justify-center gap-2 text-sm font-semibold text-success"><Sparkles aria-hidden="true" className="size-4" />{copy.bonus}</p>}
          <ChapterPage index={chapter.index} count={view.saga.chapterCount} title={chapter.title} paragraphs={chapter.paragraphs} heroName={view.hero.name} avatarEmoji={view.hero.avatarEmoji} avatarLabel={view.hero.avatarLabel} />
          <div className={`${styles.noPrint} mx-auto max-w-[44rem]`}>
            {chapter.isLast ? (
              <div className="mt-10 text-center">
                <RatingRow value={rating} onChange={setRating} />
                <Button size="lg" className="mt-6" disabled={busy} onClick={() => void openNext(null)}>{busy ? copy.opening : copy.finish} <ArrowRight /></Button>
              </div>
            ) : (
              <>
                <ChoiceCards choices={chapter.choices} selected={selected} disabled={busy || answer !== null} onSelect={setSelected} />
                {selected !== null && task && <StoryTaskPanel task={task} answer={answer} busy={busy} onAnswer={(index) => void onAnswer(index)} />}
                {canOpen && (
                  <div className={`${styles.fadeIn} mt-6 text-center`}>
                    <RatingRow value={rating} onChange={setRating} />
                    <Button size="lg" className="mt-6" disabled={busy} onClick={() => void openNext(selected)}>{busy ? copy.opening : copy.openNext} <ArrowRight /></Button>
                  </div>
                )}
              </>
            )}
            {error && <p role="alert" className="mt-4 text-center text-sm text-destructive">{error}</p>}
            <div className="mt-12 flex justify-center"><ReportText chapterId={chapter.id} /></div>
          </div>
        </>
      )}

      {view.status === "finale" && view.finale && (
        <div className={`${styles.fadeIn} mx-auto grid max-w-[44rem] gap-8`}>
          <header className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{copy.finaleEyebrow}</p>
            <h2 className={`${styles.serif} mt-3 text-[clamp(1.75rem,5vw,2.4rem)] font-semibold italic`}>{copy.finaleTitle}</h2>
            <p className="mt-3 text-4xl" aria-hidden="true">{view.hero.avatarEmoji}</p>
          </header>
          <StyleCard styleName={view.finale.styleName} text={view.finale.styleCard.text} excerpt={view.finale.styleCard.excerpt} />
          <EndingWriter sagaId={sagaId} words={view.finale.words} minimumWords={view.finale.minimumWords} maximumWords={view.finale.maximumWords} manner={view.finale.manner} saved={view.finale.saved} submit={actions.submitEnding} />
          <Link href="/student/histoire" className={`${buttonVariants({ variant: "outline" })} justify-self-center`}>{copy.newAdventure} <ArrowRight /></Link>
        </div>
      )}
    </div>
  );
}
