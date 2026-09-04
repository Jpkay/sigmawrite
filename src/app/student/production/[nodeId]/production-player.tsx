"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PenLine } from "lucide-react";
import { AccentTextarea } from "@/components/accent-textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { loadIndependentProductionTask, submitIndependentProduction } from "@/lib/actions/student";

type Task = Awaited<ReturnType<typeof import("@/lib/actions/student").loadIndependentProductionTask>>;
type Result = Awaited<ReturnType<typeof submitIndependentProduction>>;

export function IndependentProductionPlayer({ task: initialTask }: { task: Task }) {
  const [task, setTask] = useState(initialTask);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const ready = words >= task.minimumWords && words <= task.maximumWords;

  async function submit() {
    setBusy(true); setError("");
    try {
      setResult(await submitIndependentProduction({ nodeId: task.nodeId, text, genre: task.genre }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Le texte n’a pas pu être évalué.");
    } finally {
      setBusy(false);
    }
  }

  if (result) return <section className="mx-auto max-w-2xl py-8 sm:py-14">
    <div className="border-y border-border py-10 text-center">
      <CheckCircle2 className={`mx-auto size-10 ${result.demonstrated ? "text-emerald-600" : "text-amber-600"}`} />
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Production enregistrée</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{result.demonstrated ? "Preuve autonome réussie" : "Encore un ajustement"}</h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">{result.feedback}</p>
      {result.matchedForms.length > 0 && <p className="mt-4 text-sm">Formes repérées : <span className="font-medium">{result.matchedForms.join(", ")}</span></p>}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {!result.demonstrated && <Button onClick={() => { setResult(null); setText(""); }}>Écrire un nouveau texte</Button>}
        <Link href="/student" className={buttonVariants({ variant: result.demonstrated ? "default" : "outline" })}>Retour au programme <ArrowRight /></Link>
      </div>
    </div>
  </section>;

  return <section className="mx-auto max-w-3xl pb-28 sm:pb-12">
    <header className="border-b border-border pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Production autonome</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{task.label}</h1>
      {task.description && <p className="mt-3 max-w-2xl text-muted-foreground">{task.description}</p>}
    </header>
    <div className="py-7 sm:py-10">
      {task.genres.length > 1 && <div role="radiogroup" aria-label="Genre du texte" className="mb-5 flex flex-wrap gap-2">{task.genres.map((genre) => <button key={genre.key} type="button" role="radio" aria-checked={task.genre === genre.key} disabled={busy} onClick={() => { void loadIndependentProductionTask({ nodeId: task.nodeId, genre: genre.key }).then((next) => { setTask(next); setResult(null); }).catch(() => undefined); }} className={`rounded-full border px-3 py-1.5 text-sm ${task.genre === genre.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>{genre.label}</button>)}</div>}
      <div className="border-l-2 border-primary pl-4">
        <p className="font-medium leading-7">{task.prompt}</p>
        <p className="mt-2 text-sm text-muted-foreground">Deux textes réussis à des moments différents sont nécessaires pour confirmer la maîtrise.</p>
      </div>
      <div className="mt-7">
        <AccentTextarea value={text} onChange={(value) => { setText(value); setResult(null); }} rows={10} autoCapitalize="sentences" className="w-full rounded-xl border border-input bg-background p-4 text-base leading-7" placeholder="Écris ton paragraphe ici…" />
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className={words > task.maximumWords ? "text-destructive" : "text-muted-foreground"}>{words} mot{words === 1 ? "" : "s"}</span>
          <span className="text-muted-foreground">Objectif : {task.minimumWords}–{task.maximumWords}</span>
        </div>
      </div>
      {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
    </div>
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Button disabled={!ready || busy} onClick={() => void submit()}>{busy ? "Vérification…" : "Faire vérifier mon texte"} <PenLine /></Button>
        {!ready && <span className="text-xs text-muted-foreground">Écris entre {task.minimumWords} et {task.maximumWords} mots.</span>}
      </div>
    </div>
  </section>;
}
