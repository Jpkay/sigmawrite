"use client";
import { useRef } from "react";

export const FRENCH_ACCENTS = ["é", "è", "ê", "ë", "à", "â", "î", "ï", "ô", "ù", "û", "ü", "ç", "œ", "’"] as const;

/** Single-line counterpart of AccentTextarea for recall inputs (roadmap 8.6). */
export function AccentInput({ value, onChange, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  function insert(char: string) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + char + value.slice(end));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + char.length, start + char.length); });
  }
  return (
    <div>
      <input ref={ref} value={value} onChange={(event) => onChange(event.target.value)} {...props} />
      <div className="mt-2 flex flex-wrap gap-1" aria-label="Caractères français">
        {FRENCH_ACCENTS.map((char) => <button type="button" key={char} onClick={() => insert(char)} className="min-h-9 min-w-9 rounded-md border border-border bg-muted px-2 text-sm hover:border-primary">{char}</button>)}
      </div>
    </div>
  );
}
