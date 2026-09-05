"use client";

import { useMemo } from "react";
import { syllabify } from "@/lib/linguistic/syllables";

/**
 * Renders a paragraph with alternating syllable colours and an optional
 * spoken-word highlight (roadmap 8.8). Colours come from theme tokens so
 * both themes stay legible; screen readers get the plain text.
 */
export function SyllableText({ text, syllables, spokenCharIndex }: { text: string; syllables: boolean; spokenCharIndex: number | null }) {
  const words = useMemo(() => splitWithOffsets(text), [text]);
  return (
    <span aria-label={text}>
      {words.map(({ word, start }, index) => {
        if (/^\s+$/u.test(word) || word.length === 0) return <span key={index} aria-hidden>{word}</span>;
        const spoken = spokenCharIndex !== null && spokenCharIndex >= start && spokenCharIndex < start + word.length;
        const core = word.replace(/^[«"(\[]+|[.,;:!?»")\]…]+$/gu, "");
        const prefix = word.slice(0, word.indexOf(core)); const suffix = word.slice(prefix.length + core.length);
        const parts = syllables && core.length > 3 ? syllabify(core) : [core];
        return (
          <span key={index} aria-hidden className={spoken ? "rounded bg-primary/20 ring-2 ring-primary/40" : undefined}>
            {prefix}
            {parts.map((part, partIndex) => <span key={partIndex} className={syllables ? (partIndex % 2 === 0 ? "text-[color:var(--syllable-a)]" : "text-[color:var(--syllable-b)]") : undefined}>{part}</span>)}
            {suffix}
          </span>
        );
      })}
    </span>
  );
}

/** Pure helper kept outside the component so render never mutates a local. */
function splitWithOffsets(text: string): { word: string; start: number }[] {
  const out: { word: string; start: number }[] = [];
  let offset = 0;
  for (const word of text.split(/(\s+)/u)) { out.push({ word, start: offset }); offset += word.length; }
  return out;
}
