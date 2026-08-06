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
      <p id={promptId} className="mb-3 font-medium">{prompt}</p>
      <div role="radiogroup" aria-labelledby={promptId} className="space-y-2">
        {choices.map((c, i) => {
          const selected = value === i;
          const isCorrect = reveal && i === correctIndex;
          const isWrongPick = reveal && selected && i !== correctIndex;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={reveal || undefined}
              disabled={reveal}
              onClick={() => onChange?.(i)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                isCorrect && "border-[color:var(--success)] bg-[color:var(--success)]/10",
                isWrongPick && "border-destructive bg-destructive/10",
                !reveal && selected && "border-primary bg-primary/10",
                !reveal && !selected && "border-border hover:border-primary/40",
                reveal && !isCorrect && !isWrongPick && "border-border opacity-70"
              )}
            >
              <span>{c}</span>
              {isCorrect && <Check className="size-4 shrink-0 text-[color:var(--success)]" />}
              {isWrongPick && <X className="size-4 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
