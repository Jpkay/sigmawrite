"use client";

import { useMemo, useState } from "react";
import { BookOpen, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { reviewVocabulary, type VocabularyMemory } from "@/lib/actions/vocabulary";
import type { RetrievalResult } from "@/lib/scoring/retrieval";
import { gradeTypedVocabularyRecall } from "@/lib/scoring/vocabulary-recall";

const labels = { new: "Nouveau", review: "Révision", maintenance: "Entretien" } as const;

export function VocabularyPractice({ initial }: { initial: VocabularyMemory[] }) {
  const [rows, setRows] = useState(initial);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<RetrievalResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());
  const due = useMemo(() => rows.filter((row) => !row.dueAt || Date.parse(row.dueAt) <= now), [rows, now]);
  const current = due[0];

  async function record() {
    if (!current) return;
    setBusy(true);
    setError("");
    try {
      const next = await reviewVocabulary({ itemId: current.itemId, answerText: answer });
      setRows((values) => values.map((row) => row.itemId === current.itemId
        ? { ...row, dueAt: next.dueAt, mastery: next.mastery, lastResult: next.result, status: next.status, evidence: next.evidence }
        : row));
      setAnswer("");
      setResult(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Révision impossible.");
    } finally {
      setBusy(false);
    }
  }

  function verify(event: React.FormEvent) {
    event.preventDefault();
    if (current) setResult(gradeTypedVocabularyRecall(answer, current.word));
  }

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
    <Card><CardContent className="pt-6">{current ? <>
      <div className="flex items-center justify-between gap-3"><Badge variant="secondary">{due.length} à réviser</Badge><span className="text-xs text-muted-foreground">{current.exposures} rencontre(s)</span></div>
      {current.definition ? <form onSubmit={verify} className="mt-7">
        <p className="text-center text-lg font-medium">{current.definition}</p>
        {current.examples.length > 0 && <ul className="mx-auto mt-3 max-w-md list-disc pl-5 text-sm text-muted-foreground">{current.examples.map((example) => <li key={example}>{example}</li>)}</ul>}
        <label className="mt-6 block text-sm">Écris le mot français<input autoFocus autoComplete="off" value={answer} onChange={(event) => { setAnswer(event.target.value); setResult(null); }} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-lg" /></label>
        {result && <div role="status" className={`mt-3 rounded-md border p-3 text-sm ${result === "good" ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"}`}>{result === "good" ? "Exact." : <>Réponse attendue : <strong>{current.word}</strong></>}</div>}
        <div className="mt-4 flex gap-2">{result ? <Button type="button" disabled={busy} onClick={() => void record()}>Continuer</Button> : <Button disabled={!answer.trim()}>Vérifier</Button>}</div>
      </form> : <div className="mt-8 text-center"><p className="font-display text-3xl font-semibold">{current.word}</p><p className="mt-4 text-sm text-muted-foreground">Définition en attente de validation : cette carte ne produit pas encore de preuve de rappel.</p></div>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </> : <div className="py-12 text-center"><Brain className="mx-auto size-8 text-primary" /><h2 className="mt-4 font-semibold">Révisions terminées</h2><p className="mt-2 text-sm text-muted-foreground">Les mots reviendront au moment prévu par ta mémoire.</p></div>}</CardContent></Card>
    <Card><CardContent className="pt-6"><h2 className="flex items-center gap-2 font-semibold"><BookOpen className="size-4 text-primary" />Lexique personnel</h2><p className="mt-2 text-xs text-muted-foreground">Voir un mot ou consulter l’aide ne suffit jamais pour le maîtriser.</p><div className="mt-4 space-y-4">{rows.length ? rows.slice().sort((a, b) => b.mastery - a.mastery).map((row) => <div key={row.itemId} className="border-t border-border pt-3 first:border-0 first:pt-0"><div className="flex items-center justify-between gap-3"><span className="font-medium">{row.word}</span><Badge variant={row.status === "maintenance" ? "success" : "secondary"}>{labels[row.status]}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{Math.round(row.mastery * 100)} % · {row.evidence.exposure} vue(s) · {row.evidence.help_lookup} aide(s) · {row.evidence.meaning_recall} rappel(s) · {row.evidence.contextual_use} usage(s) · {row.evidence.correct_spelling} orthographe(s)</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.round(row.mastery * 100)}%` }} /></div></div>) : <p className="text-sm text-muted-foreground">Termine une lecture pour ajouter tes premiers mots.</p>}</div></CardContent></Card>
  </div>;
}
