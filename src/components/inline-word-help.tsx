"use client";

import { useId, useState } from "react";
import type { SeedVocab } from "@/lib/content/types";

export function InlineWordHelp({ text, vocabulary, onLookup }: { text: string; vocabulary: SeedVocab[]; onLookup?: (word: string) => void }) {
  const [openWord, setOpenWord] = useState<string | null>(null);
  const instanceId = useId().replace(/:/g, "");
  const byWord = new Map(vocabulary.map((entry) => [entry.word.toLocaleLowerCase("fr"), entry]));
  const pattern = vocabulary.length
    ? new RegExp(`(${vocabulary.map((entry) => entry.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).sort((a, b) => b.length - a.length).join("|")})`, "giu")
    : null;
  if (!pattern) return <>{text}</>;
  return <>{text.split(pattern).map((part, index) => {
    const entry = byWord.get(part.toLocaleLowerCase("fr"));
    if (!entry) return <span key={`${index}-${part}`}>{part}</span>;
    const open = openWord === entry.word;
    const helpId = `word-help-${instanceId}-${entry.word.replace(/\W/g, "-")}-${index}`;
    return <span key={`${index}-${part}`} className="relative inline">
      <button type="button" className="rounded-sm border-b border-dotted border-primary/70 font-medium text-foreground underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={open} aria-controls={helpId} onClick={() => { setOpenWord(open ? null : entry.word); if (!open) onLookup?.(entry.word); }}>{part}<span className="sr-only">, afficher l’explication</span></button>
      {open && <span id={helpId} role="note" className="my-2 block rounded-md border border-primary/30 bg-background p-3 text-sm leading-6 shadow-sm sm:absolute sm:left-0 sm:top-full sm:z-20 sm:w-80">
        <strong className="block text-foreground">{entry.word}</strong>
        <span className="block text-muted-foreground">{entry.definitionFr}</span>
        <span className="mt-2 block text-xs font-medium uppercase tracking-wide text-primary">Exemples</span>
        {entry.examplesFr.map((example) => <span key={example} className="mt-1 block text-muted-foreground">• {example}</span>)}
      </span>}
    </span>;
  })}</>;
}
