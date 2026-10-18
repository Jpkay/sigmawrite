import styles from "./story.module.css";
import { STORY_COPY as copy } from "@/lib/story/copy";

/** "Ton aventure s’écrit…" (H.11): a quill drawing an ink line. Static under reduced motion. */
export function WritingWait({ longer = false }: { longer?: boolean }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <span aria-hidden="true" className={`${styles.quill} text-5xl`}>🪶</span>
      <div aria-hidden="true" className="mt-4 h-0.5 w-40 overflow-hidden"><div className={styles.inkLine} /></div>
      <p className={`${styles.serif} mt-6 text-2xl italic`}>{copy.writingTitle}</p>
      <p className="mt-2 text-sm text-muted-foreground">{longer ? copy.writingLonger : copy.writingHelp}</p>
    </div>
  );
}
