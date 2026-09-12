import {EXERCISE_CONTROL_COPY as copy} from "@/lib/content/exercise-control-copy";
import { splitExercisePrompt } from "@/lib/content/exercise-prompt";

/** The same instruction/passage/question hierarchy in preview and live work. */
export function ExercisePrompt({ promptFr, instructionsFr }: { promptFr: string; instructionsFr?: string | null }) {
  const content = splitExercisePrompt(promptFr);
  const instructions = [...new Set([content.instruction, instructionsFr?.trim()].filter((value): value is string => Boolean(value)))];
  return <div className="space-y-6">
    {instructions.length > 0 && <section aria-label={copy.instruction} className="border-l-2 border-primary/60 pl-4">
      <p className="mb-1 text-xs font-semibold tracking-wide text-primary">{copy.instruction}</p>
      {instructions.map((instruction) => <p key={instruction} className="whitespace-pre-line text-base leading-7">{instruction}</p>)}
    </section>}
    {content.passage.length > 0 && <section aria-label={copy.passage} className="rounded-lg border border-border bg-card px-5 py-6 sm:px-6">
      <p className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground">{copy.passage}</p>
      <div className="space-y-4 text-base font-normal leading-8">{content.passage.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}</div>
    </section>}
    {content.question ? <section aria-label={copy.question}>
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">{copy.question}</p>
      <h2 className="whitespace-pre-line text-lg font-semibold leading-8 sm:text-xl">{content.question}</h2>
    </section> : <div className="space-y-4">{content.paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line text-lg font-medium leading-8 sm:text-xl">{paragraph}</p>)}</div>}
  </div>;
}
