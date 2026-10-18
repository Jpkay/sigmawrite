import type { TreasureGroup } from "@/lib/actions/words";
import { INTEREST_BY_KEY } from "@/lib/content/interests";
import { WORD_SESSION_COPY as copy } from "@/lib/vocabulary/session/copy";
import type { WordStatus } from "@/lib/vocabulary/types";

const CHIP: Record<WordStatus, string> = {
  decouvert: "border-border text-muted-foreground",
  en_route: "border-secondary/50 bg-secondary/10 text-foreground",
  presque: "border-primary/40 bg-primary/10 text-foreground",
  a_revoir: "border-amber-500/40 bg-amber-500/10 text-foreground",
  maitrise: "border-emerald-500/50 bg-emerald-500/15 text-foreground",
  ancre: "border-emerald-600 bg-emerald-600 text-white",
};

/** "Mon trésor de mots" (roadmap 2026-10 B.3, D.7): grouped by interest, each word with where it was first met. */
export function WordTreasure({ groups }: { groups: TreasureGroup[] }) {
  if (!groups.length) return <p className="border-y border-border py-10 text-center text-sm text-muted-foreground">{copy.treasureEmpty}</p>;
  return <div className="space-y-10">
    {groups.map((group) => {
      const interest = group.interest ? INTEREST_BY_KEY[group.interest] : null;
      return <section key={group.interest ?? "other"} aria-labelledby={`treasure-${group.interest ?? "other"}`}>
        <h2 id={`treasure-${group.interest ?? "other"}`} className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          {interest && <span aria-hidden>{interest.emoji}</span>}{interest?.labelFr ?? copy.otherInterests}
          <span className="text-sm font-normal text-muted-foreground">· {group.words.length}</span>
        </h2>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {group.words.map((word) => <li key={word.itemId} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-lg font-semibold">{word.word}</p>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${CHIP[word.status] ?? CHIP.decouvert}`}>{word.statusLabel}</span>
            </div>
            {word.definition && <p className="mt-1 text-sm text-muted-foreground">{word.definition}</p>}
            {word.firstMet && <p className="mt-2 border-l-2 border-border pl-3 text-sm italic"><span className="not-italic text-muted-foreground">{copy.firstMet} </span>{word.firstMet}</p>}
          </li>)}
        </ul>
      </section>;
    })}
  </div>;
}
