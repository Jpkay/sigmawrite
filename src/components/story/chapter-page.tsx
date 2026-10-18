import styles from "./story.module.css";
import { STORY_COPY as copy } from "@/lib/story/copy";

/** One chapter laid out like a book page: generous serif text, drop cap, French indents. */
export function ChapterPage({ index, count, title, paragraphs, heroName, avatarEmoji, avatarLabel }: {
  index: number; count: number; title: string | null; paragraphs: string[];
  heroName: string | null; avatarEmoji: string; avatarLabel: string;
}) {
  return (
    <article className={`${styles.fadeIn} mx-auto max-w-[36rem]`} aria-labelledby="story-chapter-title">
      <header className="mb-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{copy.chapter(index, count)}</p>
        <h2 id="story-chapter-title" className={`${styles.serif} mt-3 text-balance text-[clamp(1.75rem,5vw,2.4rem)] font-semibold italic leading-tight tracking-normal`}>{title ?? copy.chapter(index, count)}</h2>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full border border-border-strong bg-accent text-base">{avatarEmoji}</span>
          <span><span className="sr-only">{avatarLabel} · </span>{heroName ?? "Toi"}</span>
        </p>
      </header>
      <div className={styles.page}>
        {paragraphs.map((paragraph, position) => (
          <p key={position} className={position === 0 ? styles.dropCap : undefined}>{paragraph}</p>
        ))}
      </div>
      <p aria-hidden="true" className={`${styles.ornament} mt-10`}>✦ ✦ ✦</p>
    </article>
  );
}
