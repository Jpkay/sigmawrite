"use client";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import styles from "./story.module.css";
import { cn } from "@/lib/utils";
import { STORY_COPY as copy, STORY_RATINGS, type StoryRating } from "@/lib/story/copy";
import type { PublicStoryTask } from "@/lib/story/micro-task";

/** The two paths at the end of a chapter (H.1). Big, calm cards: the student decides. */
export function ChoiceCards({ choices, selected, disabled, onSelect }: {
  choices: Array<{ index: number; label: string }>;
  selected: number | null;
  disabled?: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <fieldset className="mt-8">
      <legend className={`${styles.serif} mb-5 w-full text-center text-2xl italic`}>{copy.whatNext}</legend>
      <div className="grid gap-4 md:grid-cols-2">
        {choices.map((choice) => {
          const active = selected === choice.index;
          return (
            <button
              key={choice.index}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onSelect(choice.index)}
              className={cn(
                "group flex min-h-24 w-full items-start gap-4 border-2 bg-card p-5 text-left transition-colors",
                active ? "border-brand bg-accent" : "border-border-strong hover:border-brand",
                "disabled:cursor-default",
                disabled && !active && "opacity-45",
              )}
            >
              <span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-border-strong font-display text-sm font-bold">{choice.index === 0 ? "A" : "B"}</span>
              <span className={`${styles.serif} text-lg leading-snug`}>{choice.label}</span>
              <ArrowRight aria-hidden="true" className="ml-auto mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export type TaskAnswer = { optionIndex: number; correct: boolean; correctIndex: number; definition: string; explanation: string | null; bonus: string[] | null };

/**
 * H.3: one question before the next chapter — a word of the chapter, or a
 * question about the story. Never "faux": the right answer is shown, gently,
 * and the chosen path opens either way. A right answer unlocks a bonus scene.
 */
export function StoryTaskPanel({ task, answer, busy, onAnswer }: {
  task: PublicStoryTask;
  answer: TaskAnswer | null;
  busy?: boolean;
  onAnswer: (optionIndex: number) => void;
}) {
  const sentence = task.kind === "vocabulary" ? highlight(task.sentence, task.form) : null;
  const feedback = !answer ? null
    : answer.correct ? `${copy.taskCorrect} ✨${task.kind === "comprehension" && answer.explanation ? ` ${answer.explanation}` : ""}`
      : task.kind === "vocabulary" ? copy.taskGentle(task.form, answer.definition) : copy.comprehensionGentle(answer.definition, answer.explanation);
  return (
    <section aria-labelledby="story-task-title" className={`${styles.fadeIn} mt-6 border-l-4 border-brand bg-card p-5 sm:p-6`}>
      <p className="app-eyebrow">{copy.taskEyebrow}</p>
      {sentence && (
        <blockquote className={`${styles.serif} mt-4 text-lg italic leading-relaxed text-muted-foreground`}>
          « {sentence.before}<mark className="bg-accent px-0.5 font-semibold not-italic text-foreground">{sentence.word}</mark>{sentence.after} »
        </blockquote>
      )}
      <h3 id="story-task-title" className="mt-4 text-lg font-semibold">{task.prompt}</h3>
      <div role="radiogroup" aria-labelledby="story-task-title" className="mt-4 grid gap-3">
        {task.options.map((option, index) => {
          const chosen = answer?.optionIndex === index;
          const right = answer?.correctIndex === index;
          return (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={busy || answer !== null}
              onClick={() => onAnswer(index)}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 border px-4 py-3 text-left text-[15px] leading-snug transition-colors",
                answer === null ? "border-border-strong hover:border-brand" : right ? "border-success bg-success/10" : chosen ? "border-border-strong bg-muted" : "border-border opacity-60",
              )}
            >
              <span aria-hidden="true" className={cn("grid size-6 shrink-0 place-items-center rounded-full border", right && answer ? "border-success bg-success text-success-foreground" : "border-border-strong")}>{right && answer ? <Check className="size-3.5" /> : null}</span>
              {option}
            </button>
          );
        })}
      </div>
      {feedback && (
        <p role="status" className={cn("mt-4 text-[15px] font-medium", answer?.correct ? "text-success" : "text-foreground")}>{feedback}</p>
      )}
      {answer?.correct && answer.bonus?.length ? <BonusScene paragraphs={answer.bonus} /> : null}
    </section>
  );
}

/** The bonus scene a right first answer unlocks: an extra moment of the story, not needed for the plot. */
export function BonusScene({ paragraphs }: { paragraphs: string[] }) {
  return (
    <aside aria-labelledby="story-bonus-title" className={`${styles.fadeIn} mt-5 border border-dashed border-brand/60 bg-accent/40 p-5`}>
      <p id="story-bonus-title" className="flex items-center gap-2 text-sm font-semibold text-success"><Sparkles aria-hidden="true" className="size-4" />{copy.sceneBonusTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">{copy.sceneBonusHelp}</p>
      <div className={`${styles.serif} mt-4 grid gap-3 text-[17px] leading-relaxed`}>
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
    </aside>
  );
}

function highlight(sentence: string, form: string): { before: string; word: string; after: string } {
  const at = sentence.toLocaleLowerCase("fr").indexOf(form.toLocaleLowerCase("fr"));
  if (at < 0 || !form) return { before: sentence, word: "", after: "" };
  return { before: sentence.slice(0, at), word: sentence.slice(at, at + form.length), after: sentence.slice(at + form.length) };
}

/** Optional one-tap rating (😀/😐/🙁), sent with the choice. */
export function RatingRow({ value, onChange }: { value: StoryRating | null; onChange: (value: StoryRating | null) => void }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm text-muted-foreground">{copy.ratingLabel}</span>
      {STORY_RATINGS.map((rating) => (
        <button
          key={rating.key}
          type="button"
          aria-pressed={value === rating.key}
          aria-label={copy.ratings[rating.key]}
          title={copy.ratings[rating.key]}
          onClick={() => onChange(value === rating.key ? null : rating.key)}
          className={cn("grid size-11 place-items-center rounded-full border text-xl transition-colors", value === rating.key ? "border-brand bg-accent" : "border-border hover:border-border-strong")}
        >
          <span aria-hidden="true">{rating.emoji}</span>
        </button>
      ))}
    </div>
  );
}
