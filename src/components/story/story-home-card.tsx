import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import styles from "./story.module.css";
import { buttonVariants } from "@/components/ui/button";
import { STORY_COPY as copy } from "@/lib/story/copy";
import type { StoryHomeCard as StoryHomeCardData } from "@/lib/story/server";

/** Home card (H.5): the chapter of the day lives in the daily routine. No counters, no "missed days". */
export function StoryHomeCard({ card }: { card: StoryHomeCardData }) {
  if (!card) return null;
  const href = card.sagaId ? `/student/histoire/${card.sagaId}` : "/student/histoire";
  const title = card.state === "start" ? copy.homeStart
    : card.state === "locked" ? copy.homeLocked
      : card.state === "finale" ? copy.homeFinale
        : card.state === "writing" ? copy.writingTitle
          : copy.homeReady(card.chapterIndex);
  const help = card.state === "start" ? copy.homeStartHelp : [card.title, card.manner].filter(Boolean).join(" · ");
  const cta = card.state === "start" ? copy.homeStartCta : card.state === "locked" ? copy.resume : card.state === "finale" ? copy.writeEnding : copy.readToday;
  return (
    <section aria-labelledby="story-home-title" className="mb-10 grid gap-5 border border-border-strong bg-card p-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <span aria-hidden="true" className="grid size-14 place-items-center rounded-full border border-border-strong bg-accent text-3xl">{card.avatarEmoji}</span>
      <div className="min-w-0">
        <p className="app-eyebrow">{copy.homeEyebrow}</p>
        <h2 id="story-home-title" className={`${styles.serif} mt-2 text-2xl font-semibold italic leading-tight`}>{title}</h2>
        {help && <p className="mt-1.5 text-sm text-muted-foreground">{help}</p>}
      </div>
      <Link href={href} className={buttonVariants({ variant: card.state === "locked" ? "outline" : "default" })}>
        {card.state === "locked" && <Lock aria-hidden="true" />}{cta} <ArrowRight />
      </Link>
    </section>
  );
}
