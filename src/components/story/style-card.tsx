import styles from "./story.module.css";
import { STORY_COPY as copy } from "@/lib/story/copy";

/** End-of-saga style card (H.6): how the author writes, and a short real excerpt when public domain. */
export function StyleCard({ styleName, text, excerpt }: { styleName: string; text: string; excerpt: { text: string; source: string } | null }) {
  return (
    <section aria-labelledby="story-style-card" className="border border-border-strong bg-card p-6 sm:p-8">
      <p className="app-eyebrow">{copy.styleCardTitle}</p>
      <h2 id="story-style-card" className={`${styles.serif} mt-4 text-2xl font-semibold italic`}>{styleName}</h2>
      <p className="mt-3 text-[16px] leading-7">{text}</p>
      {excerpt && (
        <figure className="mt-6 border-l-2 border-secondary pl-5">
          <figcaption className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">{copy.readTheReal(styleName)}</figcaption>
          <blockquote className={`${styles.serif} mt-3 whitespace-pre-line text-[17px] italic leading-8`}>{excerpt.text}</blockquote>
          <p className="mt-2 text-sm text-muted-foreground">— {excerpt.source}</p>
        </figure>
      )}
    </section>
  );
}
