"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Headphones, Play, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { AccentTextarea } from "@/components/accent-textarea";
import { FRENCH_ACCENTS } from "@/components/accent-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { startDictation, submitDictation, submitDictationJustifications, type DictationResult, type DictationSession } from "@/lib/actions/student";
import type { ErrorCategory } from "@/lib/dictation/classify";
import { cn } from "@/lib/utils";

type Phase = "loading" | "intro" | "write" | "scoring" | "justify" | "result";

/**
 * Dictée player (roadmap 1.4–1.6): listen to the whole text, then replay and
 * transcribe segment by segment. After scoring, the learner justifies each
 * error before the correction is revealed (dictée négociée).
 */
export function DictationPlayer({ dictationId }: { dictationId: string }) {
  const [session, setSession] = useState<DictationSession | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const [segment, setSegment] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [fills, setFills] = useState<Record<number, string>[]>([]);
  const [replays, setReplays] = useState(0);
  const [result, setResult] = useState<DictationResult | null>(null);
  const [justifications, setJustifications] = useState<Record<number, ErrorCategory>>({});
  const [justificationOutcome, setJustificationOutcome] = useState<{ correct: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [focusedBlank, setFocusedBlank] = useState<number | null>(null);
  const requestId = useMemo(() => crypto.randomUUID(), []);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    startDictation({ dictationId, clientRequestId: requestId }).then((value) => {
      if (!active) return;
      setSession(value); setAnswers(value.segments.map(() => "")); setFills(value.segments.map(() => ({}))); setPhase("intro");
    }).catch((caught) => { if (active) { setError(caught instanceof Error ? caught.message : "La dictée n’a pas pu démarrer."); setPhase("intro"); } });
    return () => { active = false; };
  }, [dictationId, requestId]);

  const play = useCallback((url: string | null, browserText: string | null) => {
    if (url) {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url; void audioRef.current.play().catch(() => undefined);
    } else if (browserText && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(browserText); utterance.lang = "fr-FR"; utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => () => { audioRef.current?.pause(); if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  if (phase === "loading") return <p className="text-sm text-muted-foreground">Préparation de la dictée…</p>;
  if (!session) return <div><p role="alert" className="text-sm text-destructive">{error || "Dictée indisponible."}</p><Link href="/student/dictee" className={`${buttonVariants({ variant: "outline" })} mt-4`}><ArrowLeft className="size-4" />Toutes les dictées</Link></div>;

  const current = session.segments[segment];
  const total = session.segments.length;
  const withTemplate = current.template !== null;
  const canSubmit = session.segments.every((entry, index) => entry.template ? entry.template.blanks.every((blank) => (fills[index]?.[blank.index] ?? "").trim().length > 0) : answers[index].trim().length > 0);

  async function submit() {
    setBusy(true); setError(""); setPhase("scoring");
    try {
      const value = await submitDictation({ attemptId: session!.attemptId, answers, fills: fills.map((entry) => Object.fromEntries(Object.entries(entry).map(([k, v]) => [String(k), v]))), replays });
      setResult(value); setPhase(value.justification.length > 0 ? "justify" : "result");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "La dictée n’a pas pu être corrigée."); setPhase("write"); }
    finally { setBusy(false); }
  }

  async function sendJustifications() {
    if (!result) return;
    setBusy(true); setError("");
    try {
      const outcome = await submitDictationJustifications({ attemptId: result.attemptId, choices: result.justification.map((entry) => ({ errorIndex: entry.errorIndex, category: justifications[entry.errorIndex] ?? "" })) });
      setJustificationOutcome(outcome); setPhase("result");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Les justifications n’ont pas pu être enregistrées."); }
    finally { setBusy(false); }
  }

  const header = (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Dictée · {session.mode === "brevet" ? "type brevet" : session.mode === "trous" ? "à trous" : session.mode === "choix" ? "à choix" : session.mode === "negociee" ? "négociée" : "flash"}</p><h1 className="mt-1 font-display text-2xl font-semibold">{session.title}</h1></div>
      <Link href="/student/dictee" className="text-sm text-muted-foreground underline-offset-4 hover:underline">Quitter</Link>
    </div>
  );

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl">
        {header}
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-lg leading-8">{session.wordCount} mots en {total} segments.{session.focus ? ` Point travaillé : ${session.focus.toLocaleLowerCase("fr")}.` : ""}</p>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Écoute la dictée en entier sans écrire.</li>
            <li>Écris chaque segment ; tu peux le réécouter autant que nécessaire.</li>
            <li>Relis, puis valide. Tu justifieras chaque correction avant de la voir.</li>
          </ol>
          {session.audioMode === "browser" && <p className="mt-4 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">Voix de secours du navigateur (environnement de développement).</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => play(session.fullAudioUrl, session.audioMode === "browser" ? session.segments.map((entry) => entry.browserText ?? "").join(" ") : null)}><Headphones className="size-4" />Écouter en entier</Button>
            <Button onClick={() => { setPhase("write"); play(current.audioUrl, current.browserText); }}>Commencer à écrire <ArrowRight /></Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "write" || phase === "scoring") {
    return (
      <div className="mx-auto max-w-2xl pb-28 sm:pb-0">
        {header}
        <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground"><span>Segment {segment + 1} / {total}</span><span aria-live="polite">{replays} réécoute(s)</span></div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.round(((segment + 1) / total) * 100)}%` }} /></div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => { setReplays((n) => n + 1); play(current.audioUrl, current.browserText); }}><Play className="size-4" />Réécouter le segment</Button>
          </div>
          {withTemplate ? (
            <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5 gap-y-3 text-lg leading-9">
              {current.template!.tokens.map((token, position) => {
                if (token !== null) return <span key={position}>{token}</span>;
                const blank = current.template!.blanks.find((entry) => entry.index === position)!;
                const value = fills[segment]?.[position] ?? "";
                if (blank.choices) return (
                  <span key={position} role="radiogroup" aria-label={`Mot ${position + 1}`} className="inline-flex gap-1 rounded-md border border-dashed border-primary/60 p-1">
                    {blank.choices.map((choice) => <button key={choice} type="button" role="radio" aria-checked={value === choice} onClick={() => setFills((current) => current.map((entry, index) => index === segment ? { ...entry, [position]: choice } : entry))} className={cn("rounded px-2 py-0.5 text-base", value === choice ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent")}>{choice}</button>)}
                  </span>
                );
                return <input key={position} aria-label={`Mot ${position + 1}`} value={value} autoComplete="off" spellCheck={false} onFocus={() => setFocusedBlank(position)} onChange={(event) => setFills((current) => current.map((entry, index) => index === segment ? { ...entry, [position]: event.target.value } : entry))} className="inline-block h-9 w-28 rounded-md border border-dashed border-primary/60 bg-background px-2 text-base" />;
              })}
            </p>
          ) : (
            <AccentTextarea value={answers[segment]} onChange={(value) => setAnswers((current) => current.map((entry, index) => index === segment ? value : entry))} rows={3} spellCheck={false} autoCorrect="off" autoCapitalize="sentences" aria-label={`Segment ${segment + 1}`} placeholder="Écris exactement ce que tu entends, avec la ponctuation." className="mt-5 w-full rounded-md border border-input bg-background p-3 text-lg leading-8" />
          )}
          {withTemplate && current.template!.blanks.some((blank) => !blank.choices) && (
            <div className="mt-3 flex flex-wrap gap-1" aria-label="Caractères français">
              {FRENCH_ACCENTS.map((char) => <button type="button" key={char} disabled={focusedBlank === null} onClick={() => { if (focusedBlank === null) return; setFills((current) => current.map((entry, index) => index === segment ? { ...entry, [focusedBlank]: (entry[focusedBlank] ?? "") + char } : entry)); }} className="min-h-9 min-w-9 rounded-md border border-border bg-muted px-2 text-sm hover:border-primary disabled:opacity-40">{char}</button>)}
            </div>
          )}
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:static sm:mt-5 sm:border-0 sm:bg-transparent sm:p-0">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <Button type="button" variant="ghost" disabled={segment === 0} onClick={() => setSegment((n) => n - 1)}><ArrowLeft className="size-4" />Précédent</Button>
            {segment + 1 < total
              ? <Button type="button" onClick={() => { const next = segment + 1; setSegment(next); play(session.segments[next].audioUrl, session.segments[next].browserText); }}>Segment suivant <ArrowRight /></Button>
              : <Button type="button" disabled={!canSubmit || busy} onClick={() => void submit()}>{busy ? "Correction…" : "Valider ma dictée"} <CheckCircle2 className="size-4" /></Button>}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "justify" && result) {
    const pending = result.justification.filter((entry) => !justifications[entry.errorIndex]).length;
    const allErrors = result.segments.flatMap((entry) => entry.errors);
    return (
      <div className="mx-auto max-w-2xl">
        {header}
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Dictée négociée</p>
          <h2 className="mt-2 text-xl font-semibold">{allErrors.length} correction(s) à justifier avant de voir la réponse</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pour chaque mot signalé, choisis la règle qui explique l’erreur. Une justification correcte compte comme une réussite aidée.</p>
          <ol className="mt-6 space-y-6">
            {result.justification.map((entry) => {
              const item = allErrors[entry.errorIndex];
              return (
                <li key={entry.errorIndex} className="border-t border-border pt-5">
                  <p className="text-sm text-muted-foreground">Segment {item.segment + 1} · tu as écrit <span className="font-semibold text-foreground">« {item.actual ?? "(mot manquant)"} »</span></p>
                  <div role="radiogroup" aria-label={`Règle pour le mot ${entry.errorIndex + 1}`} className="mt-3 grid gap-2 sm:grid-cols-2">
                    {entry.options.map((option) => <button key={option.key} type="button" role="radio" aria-checked={justifications[entry.errorIndex] === option.key} onClick={() => setJustifications((current) => ({ ...current, [entry.errorIndex]: option.key as ErrorCategory }))} className={cn("rounded-md border px-3 py-2 text-left text-sm", justifications[entry.errorIndex] === option.key ? "border-primary bg-accent" : "border-border hover:border-primary/60")}>{option.label}</button>)}
                  </div>
                </li>
              );
            })}
          </ol>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          <div className="mt-6 flex justify-end"><Button disabled={pending > 0 || busy} onClick={() => void sendJustifications()}>{busy ? "Enregistrement…" : "Voir la correction"} <ArrowRight /></Button></div>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    const categories = (Object.keys(result.categoryLabels) as ErrorCategory[]).filter((category) => result.profile[category] > 0);
    return (
      <div className="mx-auto max-w-2xl">
        {header}
        <section className="rounded-xl border border-border bg-card-elevated p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Score</p><p className="font-display text-5xl font-bold tabular-nums">{result.score}<span className="text-2xl text-muted-foreground"> / 10</span></p></div>
            {result.xp && <p className="flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-2 font-display text-sm font-semibold text-secondary"><Sparkles className="size-4" />+{result.xp.xp} XP{result.xp.goalCompleted ? " · objectif du jour atteint" : ""}</p>}
          </div>
          {justificationOutcome && <p className="mt-3 text-sm text-muted-foreground">Justifications : {justificationOutcome.correct} / {justificationOutcome.total} règles bien identifiées.</p>}
          {categories.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">{categories.map((category) => <li key={category} className="rounded-full border border-border px-3 py-1 text-xs">{result.categoryLabels[category]} · <span className="font-semibold tabular-nums">{result.profile[category]}</span></li>)}</ul>
          ) : <p className="mt-4 flex items-center gap-2 text-sm text-success"><CheckCircle2 className="size-4" />Sans faute. Bravo.</p>}
        </section>
        <ol className="mt-6 space-y-4">
          {result.segments.map((entry) => (
            <li key={entry.index} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Segment {entry.index + 1}</p>
              <p className="mt-2 text-lg leading-8">{entry.expected}</p>
              {entry.errors.length === 0 ? <p className="mt-1 flex items-center gap-1.5 text-sm text-success"><CheckCircle2 className="size-4" />Exact.</p> : (
                <ul className="mt-3 space-y-3">
                  {entry.errors.map((item, index) => (
                    <li key={index} className="flex gap-3 border-l-2 border-amber-500 pl-3 text-sm">
                      <XCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                      <div>
                        <p><span className="line-through decoration-amber-600">{item.actual ?? "(oublié)"}</span> → <span className="font-semibold">{item.expected || "(en trop)"}</span> <span className="ml-1 text-xs text-muted-foreground">{result.categoryLabels[item.category]}</span></p>
                        <p className="mt-1 text-muted-foreground">{item.explanationFr}</p>
                        <Link href={`/student/reference/regle/${encodeURIComponent(item.nodeKey)}`} className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline">Voir la règle</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/student/dictee" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="size-4" />Autres dictées</Link>
          <Link href={`/student/dictee/${dictationId}`} className={buttonVariants({ variant: "outline" })} onClick={() => window.location.reload()}><RotateCcw className="size-4" />Refaire</Link>
          <Link href="/student" className={buttonVariants()}>Retour au plan du jour <ArrowRight /></Link>
        </div>
      </div>
    );
  }
  return null;
}
