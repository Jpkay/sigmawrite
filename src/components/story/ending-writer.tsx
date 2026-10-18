"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import styles from "./story.module.css";
import { AccentTextarea } from "@/components/accent-textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STORY_COPY as copy } from "@/lib/story/copy";
import { checkEnding } from "@/lib/story/rules";

/** H.4: the student writes another ending with three of the saga's words; optional "à la manière de" challenge. */
export function EndingWriter({ sagaId, words, minimumWords, maximumWords, manner, saved, submit }: {
  sagaId: string;
  words: string[];
  minimumWords: number;
  maximumWords: number;
  manner: string;
  saved: { body: string; styleChallenge: boolean } | null;
  submit: (input: { sagaId: string; text: string; styleChallenge: boolean }) => Promise<unknown>;
}) {
  const [text, setText] = useState(saved?.body ?? "");
  const [challenge, setChallenge] = useState(saved?.styleChallenge ?? false);
  const [state, setState] = useState<"idle" | "saving" | "saved">(saved ? "saved" : "idle");
  const [error, setError] = useState("");
  const check = useMemo(() => checkEnding(text, words, { minimumWords, maximumWords }), [text, words, minimumWords, maximumWords]);

  async function save() {
    setError("");
    setState("saving");
    try {
      await submit({ sagaId, text, styleChallenge: challenge });
      setState("saved");
    } catch (failure) {
      setState("idle");
      setError(failure instanceof Error && failure.message ? failure.message : copy.error);
    }
  }

  return (
    <section aria-labelledby="story-ending-title" className="border border-border-strong bg-card p-6 sm:p-8">
      <h2 id="story-ending-title" className={`${styles.serif} text-2xl font-semibold italic`}>{copy.endingTitle}</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">{copy.endingHelp}</p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label={copy.endingHelp}>
        {words.map((word, index) => (
          <li key={word} className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[15px] font-semibold transition-colors", check.wordsUsed[index] ? "border-success bg-success/10 text-success" : "border-border-strong")}>
            {check.wordsUsed[index] && <Check aria-hidden="true" className="size-4" />}{word}
            <span className="sr-only">{check.wordsUsed[index] ? " — utilisé" : " — pas encore utilisé"}</span>
          </li>
        ))}
      </ul>
      <label htmlFor="story-ending-text" className="mt-6 block font-semibold">{copy.endingLabel}</label>
      <AccentTextarea
        id="story-ending-text"
        value={text}
        onChange={(value) => { setText(value); if (state === "saved") setState("idle"); }}
        rows={9}
        maxLength={4000}
        lang="fr"
        className={`${styles.serif} mt-2 w-full border border-input bg-background p-4 text-[18px] leading-8`}
      />
      <p className={cn("mt-2 text-sm tabular-nums", check.lengthOk ? "text-success" : "text-muted-foreground")}>{copy.endingWords(check.wordCount, minimumWords, maximumWords)}</p>
      <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-[15px]">
        <input type="checkbox" checked={challenge} onChange={(event) => setChallenge(event.target.checked)} className="mt-1 size-4 accent-[var(--primary)]" />
        <span>{copy.endingChallenge(manner)}</span>
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {state === "saved" ? (
        <div role="status" className="mt-5 flex flex-wrap items-center gap-4">
          <p className="font-semibold text-success">{copy.endingSaved}</p>
          <Link href="/student/recueil" className={buttonVariants({ variant: "outline" })}>{copy.endingOpenRecueil} <ArrowRight /></Link>
        </div>
      ) : (
        <Button className="mt-5" disabled={!check.ready || state === "saving"} onClick={() => void save()}>{state === "saving" ? copy.endingSaving : copy.endingSave}</Button>
      )}
    </section>
  );
}
