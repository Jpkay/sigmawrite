"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { submitNodePractice } from "@/lib/actions/student";
import type { getNodePractice } from "@/lib/db/practice";
import { AccentTextarea } from "@/components/accent-textarea";

type Practice = Awaited<ReturnType<typeof getNodePractice>>;

export function PracticePlayer({ practice }: { practice: Practice }) {
  const [index, setIndex] = useState(0); const [choice, setChoice] = useState<string | null>(null); const [answer, setAnswer] = useState(""); const [busy, setBusy] = useState(false); const [feedback, setFeedback] = useState<{ correct: boolean; text: string | null; mastery: number } | null>(null); const [done, setDone] = useState(false); const [error, setError] = useState("");
  const item = practice.items[index];
  async function submit() { if (!item) return; setBusy(true); setError(""); try { const result = await submitNodePractice({ nodeId: practice.node.id, itemId: item.id, selectedChoiceId: choice ?? undefined, answerText: choice ? undefined : answer, startedAt: new Date().toISOString() }); setFeedback({ correct: result.correct, text: result.feedbackFr, mastery: result.mastery }); if (result.mastered || index + 1 >= Math.min(8, practice.items.length)) setDone(true); } catch { setError("La réponse n’a pas pu être enregistrée."); } finally { setBusy(false); } }
  function next() { setIndex((value) => value + 1); setChoice(null); setAnswer(""); setFeedback(null); }
  if (!item) return <p className="text-sm text-muted-foreground">Aucun exercice approuvé pour cette compétence.</p>;
  if (done) return <Card><CardContent className="space-y-4 pt-6"><h2 className="text-xl font-semibold">Étape terminée</h2><p className="text-sm text-muted-foreground">Maîtrise estimée : {Math.round((feedback?.mastery ?? 0) * 100)} %. Ta frontière a été mise à jour.</p><Link href="/student/frontier" className={buttonVariants()}>Voir la suite <ArrowRight /></Link></CardContent></Card>;
  return <Card><CardContent className="space-y-4 pt-6"><div className="flex justify-between text-sm text-muted-foreground"><span>Exercice {index + 1} / {Math.min(8, practice.items.length)}</span><span>Maîtrise {Math.round((feedback?.mastery ?? 0) * 100)}%</span></div>{item.instructionsFr && <p className="text-sm text-muted-foreground">{item.instructionsFr}</p>}<p className="text-lg font-medium">{item.promptFr}</p>{item.choices.length ? <div className="grid gap-2">{item.choices.map((option) => <button key={option.id} disabled={!!feedback} onClick={() => setChoice(option.id)} className={`min-h-11 rounded-md border p-3 text-left text-sm ${choice === option.id ? "border-primary bg-primary/10" : "border-border"}`}>{option.text}</button>)}</div> : <AccentTextarea disabled={!!feedback} value={answer} onChange={setAnswer} className="w-full rounded-md border border-input bg-background p-3 text-sm" />}{feedback && <div className={`rounded-md border p-3 text-sm ${feedback.correct ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"}`}><p className="font-medium">{feedback.correct ? "Bonne réponse." : "Pas encore — voici l’indice utile."}</p>{feedback.text && <p className="mt-1 text-muted-foreground">{feedback.text}</p>}</div>}<div>{feedback ? <Button onClick={next}>Question suivante <ArrowRight /></Button> : <Button disabled={busy || (!choice && !answer.trim())} onClick={submit}>{busy ? "Vérification…" : "Valider"}</Button>}</div>{error && <p className="text-sm text-destructive">{error}</p>}</CardContent></Card>;
}
