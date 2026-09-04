"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { AccentTextarea } from "@/components/accent-textarea";
import { cn } from "@/lib/utils";

/**
 * Exercise formats beyond MCQ and free text (roadmap 2.1–2.5). Every widget
 * reports a plain answer string so the existing submit path and validators
 * stay unchanged; the server knows the format from the item's response type.
 */

const tokenizeSentence = (text: string) => text.normalize("NFC").split(/\s+/u).filter(Boolean);

/** Click-the-error: tap the misspelled word. Answer = the tapped word. */
export function ErrorHuntWidget({ sentence, value, onChange, disabled }: { sentence: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const tokens = useMemo(() => tokenizeSentence(sentence), [sentence]);
  return (
    <div role="radiogroup" aria-label="Mot à corriger" className="mt-6 flex flex-wrap gap-x-1.5 gap-y-3 text-xl leading-9">
      {tokens.map((token, index) => {
        const key = `${index}:${token}`;
        const active = value === key;
        return <button key={key} type="button" role="radio" aria-checked={active} disabled={disabled} onClick={() => onChange(key)} className={cn("rounded-md border-b-2 px-1.5 transition-colors", active ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:border-primary/40 hover:bg-muted")}>{token}</button>;
      })}
    </div>
  );
}

/** Ordering: arrange the tokens with move buttons (keyboard and touch friendly). */
export function OrderingWidget({ order, onChange, disabled }: { order: string[]; onChange: (order: string[]) => void; disabled?: boolean }) {
  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const next = [...order]; const [item] = next.splice(from, 1); next.splice(to, 0, item);
    onChange(next);
  }
  return (
    <div className="mt-6">
      <ol className="grid gap-2" aria-label="Éléments à remettre dans l’ordre">
        {order.map((token, index) => (
          <li key={`${token}-${index}`} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <span className="w-6 text-center font-mono text-xs text-muted-foreground">{index + 1}</span>
            <span className="flex-1 text-base">{token}</span>
            <button type="button" aria-label={`Monter « ${token} »`} disabled={disabled || index === 0} onClick={() => move(index, index - 1)} className="grid size-9 place-items-center rounded-md border border-border hover:border-primary disabled:opacity-30"><ArrowUp className="size-4" /></button>
            <button type="button" aria-label={`Descendre « ${token} »`} disabled={disabled || index === order.length - 1} onClick={() => move(index, index + 1)} className="grid size-9 place-items-center rounded-md border border-border hover:border-primary disabled:opacity-30"><ArrowDown className="size-4" /></button>
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-base" aria-live="polite">{order.join(" ")}</p>
    </div>
  );
}

/** Deterministic shuffle that never returns the original order for two or more tokens. */
export function shuffledOrder(tokens: string[], seed: string): string[] {
  let state = 2166136261;
  for (const char of seed) { state ^= char.codePointAt(0)!; state = Math.imul(state, 16777619) >>> 0; }
  const out = [...tokens];
  for (let i = out.length - 1; i > 0; i--) { state = (Math.imul(state, 1103515245) + 12345) >>> 0; const j = state % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  if (out.length > 1 && out.every((token, index) => token === tokens[index])) [out[0], out[1]] = [out[1], out[0]];
  return out;
}

/** Justified answer: choose the form, then the rule that proves it. */
export function JustifiedWidget({ choices, rules, choice, rule, onChoice, onRule, disabled }: { choices: { id: string; text: string }[]; rules: { key: string; label: string }[]; choice: string | null; rule: string; onChoice: (id: string) => void; onRule: (key: string) => void; disabled?: boolean }) {
  return (
    <div className="mt-6 grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">1 · La bonne forme</p>
        <div role="radiogroup" aria-label="Choix de réponse" className="mt-2 grid gap-2">
          {choices.map((option) => <button type="button" role="radio" aria-checked={choice === option.id} key={option.id} disabled={disabled} onClick={() => onChoice(option.id)} className={cn("min-h-12 rounded-lg border px-4 py-3 text-left text-base transition-colors", choice === option.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}>{option.text}</button>)}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">2 · La règle qui le prouve</p>
        <div role="radiogroup" aria-label="Justification" className="mt-2 grid gap-2 sm:grid-cols-2">
          {rules.map((option) => <button type="button" role="radio" aria-checked={rule === option.key} key={option.key} disabled={disabled} onClick={() => onRule(option.key)} className={cn("rounded-lg border px-3 py-2 text-left text-sm transition-colors", rule === option.key ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}>{option.label}</button>)}
        </div>
      </div>
    </div>
  );
}

/** Sentence combining and réécriture: show the source material, collect one sentence. */
export function RewriteWidget({ sources, value, onChange, disabled, placeholder }: { sources: string[]; value: string; onChange: (value: string) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <div className="mt-6">
      <ul className="grid gap-2">{sources.map((source, index) => <li key={index} className="border-l-2 border-secondary pl-3 text-base leading-7">{source}</li>)}</ul>
      <AccentTextarea disabled={disabled} value={value} onChange={onChange} rows={3} autoCapitalize="sentences" autoCorrect="off" placeholder={placeholder} className="mt-4 w-full rounded-lg border border-input bg-background p-4 text-base" />
    </div>
  );
}
