"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Check, Lock, PenLine } from "lucide-react";
import styles from "./story.module.css";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { beginStorySaga } from "@/lib/actions/story-ui";
import { STORY_AVATARS, type StoryAvatarKey } from "@/lib/story/avatars";
import { STORY_COPY as copy } from "@/lib/story/copy";
import type { SagaProposal } from "@/lib/story/picker";
import type { StoryLibrary } from "@/lib/story/server";
import { track } from "@/lib/analytics";

const ACTIVE_CTA: Record<string, string> = { ready: copy.readToday, writing: copy.resume, locked: copy.resume, finale: copy.homeFinale };

/** Library: the saga in progress, the picker (H.1/H.6) with the hero setup (H.2), the shelf of authors met. */
export function StoryLibraryView({ library, suggestedName, begin = beginStorySaga }: { library: StoryLibrary; suggestedName: string | null; begin?: typeof beginStorySaga }) {
  const [picked, setPicked] = useState<SagaProposal | null>(null);
  const active = library.active;
  return (
    <div className="grid gap-12 pb-16">
      {active && (
        <section aria-labelledby="story-active" className="grid gap-6 border-b border-border-strong pb-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="app-eyebrow">{copy.resumeEyebrow}</p>
            <h2 id="story-active" className={`${styles.serif} mt-4 text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold italic leading-tight`}>{active.title}</h2>
            <p className="mt-3 text-[15px] text-muted-foreground"><span aria-hidden="true">{active.emoji} </span>{active.interestLabel} · {active.manner}</p>
            <ChapterDots read={active.chaptersRead} count={active.chapterCount} />
            {active.state === "locked" && <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground"><Lock aria-hidden="true" className="size-4" />{copy.lockedTitle}</p>}
          </div>
          <Link href={`/student/histoire/${active.id}`} className={buttonVariants({ size: "lg", variant: active.state === "locked" ? "outline" : "default" })}>{ACTIVE_CTA[active.state]} <ArrowRight /></Link>
        </section>
      )}

      {library.proposals.length > 0 && (
        <section aria-labelledby="story-picker">
          {picked ? (
            <HeroSetup proposal={picked} initial={library.hero} suggestedName={suggestedName} onBack={() => setPicked(null)} begin={begin} />
          ) : (
            <>
              <h2 id="story-picker" className="text-2xl font-bold tracking-[-0.04em]">{copy.pickerTitle}</h2>
              <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">{copy.pickerHelp}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {library.proposals.map((proposal) => (
                  <article key={`${proposal.interest}:${proposal.styleKey}`} className="flex flex-col border border-border-strong bg-card p-5">
                    <p className="text-3xl" aria-hidden="true">{proposal.emoji}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{proposal.interestLabel}</p>
                    <h3 className={`${styles.serif} mt-2 text-xl font-semibold italic leading-snug`}>{capitalize(proposal.manner)}</h3>
                    <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{proposal.teaser}</p>
                    {proposal.newStyle && <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold">{copy.newStyle}</p>}
                    <div className="mt-auto pt-5">
                      <Button className="w-full" variant="outline" onClick={() => { setPicked(proposal); track("story_saga_picked", { interest: proposal.interest, style: proposal.styleKey }); }}>{copy.pickThis}</Button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section aria-labelledby="story-shelf">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="story-shelf" className="text-xl font-semibold">{copy.shelfTitle}</h2>
          <p className="text-sm text-muted-foreground">{copy.shelfTerm} <span className="font-semibold text-foreground tabular-nums">{Math.min(library.stylesThisTerm, library.styleGoal)} / {library.styleGoal}</span> {copy.shelfTermUnit}</p>
        </div>
        {library.shelf.length === 0 ? <p className="mt-3 text-[15px] text-muted-foreground">{copy.shelfEmpty}</p> : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {library.shelf.map((entry) => (
              <li key={entry.key} className={cn("inline-flex min-h-10 items-center gap-2 border px-3 text-[15px]", entry.thisTerm ? "border-secondary" : "border-border")}>
                <BookOpen aria-hidden="true" className="size-4 text-secondary" /><span className={styles.serif}>{entry.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {library.completed.length > 0 && (
        <section aria-labelledby="story-completed">
          <h2 id="story-completed" className="text-xl font-semibold">{copy.completedTitle}</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {library.completed.map((saga) => (
              <li key={saga.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className={`${styles.serif} text-lg italic`}>{saga.title}</p>
                  <p className="text-sm text-muted-foreground">{saga.manner}{saga.hasEnding ? ` · ${copy.endingInRecueil}` : ""}</p>
                </div>
                <Link href={`/student/histoire/${saga.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-border-strong underline-offset-4">{saga.hasEnding ? copy.reread : copy.writeEnding} <PenLine aria-hidden="true" className="size-4" /></Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function capitalize(text: string) { return text.charAt(0).toLocaleUpperCase("fr") + text.slice(1); }

export function ChapterDots({ read, count }: { read: number; count: number }) {
  return (
    <ol aria-label={`${Math.min(read, count)} chapitre(s) lu(s) sur ${count}`} className="mt-4 flex gap-1.5">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} aria-hidden="true" className={cn("h-1.5 w-6", index < read ? "bg-brand" : "bg-rail")} />
      ))}
    </ol>
  );
}

function HeroSetup({ proposal, initial, suggestedName, onBack, begin }: {
  proposal: SagaProposal;
  initial: StoryLibrary["hero"];
  suggestedName: string | null;
  onBack: () => void;
  begin: typeof beginStorySaga;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initial.nickname ?? suggestedName ?? "");
  const [avatar, setAvatar] = useState<StoryAvatarKey>(initial.avatar);
  const [gender, setGender] = useState<"f" | "m" | "n">(initial.gender);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const { sagaId } = await begin({ interest: proposal.interest, style: proposal.styleKey, nickname: nickname.trim() || null, avatar, gender });
      track("story_saga_started", { interest: proposal.interest, style: proposal.styleKey, nickname: Boolean(nickname.trim()) });
      router.push(`/student/histoire/${sagaId}`);
    } catch (failure) {
      setBusy(false);
      setError(failure instanceof Error && failure.message ? failure.message : copy.error);
    }
  }

  return (
    <form className={`${styles.fadeIn} max-w-2xl`} onSubmit={(event) => { event.preventDefault(); void start(); }}>
      <p className="text-sm text-muted-foreground"><span aria-hidden="true">{proposal.emoji} </span>{proposal.interestLabel} · {proposal.manner}</p>
      <h2 id="story-picker" className={`${styles.serif} mt-2 text-3xl font-semibold italic`}>{copy.heroTitle}</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">{copy.heroHelp}</p>

      <label htmlFor="story-hero-name" className="mt-6 block font-semibold">{copy.heroNameLabel}</label>
      <input id="story-hero-name" value={nickname} maxLength={24} autoComplete="off" onChange={(event) => setNickname(event.target.value)} aria-describedby="story-hero-name-hint" className="mt-2 h-12 w-full max-w-sm border border-input bg-background px-3 text-[16px]" />
      <p id="story-hero-name-hint" className="mt-1 text-sm text-muted-foreground">{copy.heroNameHint}</p>

      <fieldset className="mt-6">
        <legend className="font-semibold">{copy.heroAvatarLabel}</legend>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {STORY_AVATARS.map((option) => (
            <label key={option.key} className={cn("relative grid aspect-square cursor-pointer place-items-center border-2 text-3xl transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", avatar === option.key ? "border-brand bg-accent" : "border-border hover:border-border-strong")}>
              <input type="radio" name="story-avatar" value={option.key} checked={avatar === option.key} onChange={() => setAvatar(option.key)} className="sr-only" />
              <span aria-hidden="true">{option.emoji}</span>
              <span className="sr-only">{option.label}</span>
              {avatar === option.key && <Check aria-hidden="true" className="absolute right-1 top-1 size-4 text-primary" />}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="font-semibold">{copy.heroGenderLabel}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["f", "m", "n"] as const).map((key) => (
            <label key={key} className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2 border px-4 text-[15px] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", gender === key ? "border-brand bg-accent" : "border-border-strong")}>
              <input type="radio" name="story-gender" value={key} checked={gender === key} onChange={() => setGender(key)} className="sr-only" />
              {copy.heroGender[key]}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={busy}>{busy ? copy.starting : copy.start} <ArrowRight /></Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onBack}>{copy.back}</Button>
      </div>
    </form>
  );
}
