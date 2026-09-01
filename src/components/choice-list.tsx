"use client";

import { Check, X } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Multiple-choice question. In input mode the learner picks an option; in
 * `reveal` mode it shows correctness (used on the results page).
 */
export function ChoiceList({
  prompt,
  passage,
  choices,
  value,
  onChange,
  reveal,
  correctIndex,
}: {
  prompt: string;
  passage?: string;
  choices: string[];
  value: number | null;
  onChange?: (index: number) => void;
  reveal?: boolean;
  correctIndex?: number;
}) {
  const promptId = useId();
  return (
    <div>
      {passage && (
        <p className="mb-3 rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
          {passage}
        </p>
      )}
      <fieldset aria-labelledby={promptId}><legend id={promptId} className="mb-3 font-medium">{prompt}</legend>
      <div className="space-y-2">
        {choices.map((c, i) => {
          const selected = value === i;
          const isCorrect = reveal && i === correctIndex;
          const isWrongPick = reveal && selected && i !== correctIndex;
          return (
            <label
              key={i}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                isCorrect && "border-[color:var(--success)] bg-[color:var(--success)]/10",
                isWrongPick && "border-destructive bg-destructive/10",
                !reveal && selected && "border-primary bg-primary/10",
                !reveal && !selected && "border-border hover:border-primary/40",
                reveal && !isCorrect && !isWrongPick && "border-border opacity-70"
              )}
            >
              <input className="sr-only" type="radio" name={promptId} value={i} checked={selected} disabled={reveal} onChange={() => onChange?.(i)} />
              <span>{c}</span>
              {isCorrect && <Check className="size-4 shrink-0 text-[color:var(--success)]" />}
              {isWrongPick && <X className="size-4 shrink-0 text-destructive" />}
            </label>
          );
        })}
      </div></fieldset>
    </div>
  );
}
