"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { submitNodePractice } from "@/lib/actions/student";
import type { getNodePractice } from "@/lib/db/practice";
import { AccentTextarea } from "@/components/accent-textarea";
import { buildHintLadder } from "@/lib/practice/hints";
import { workedExample } from "@/lib/practice/scaffolding";

type Practice = Awaited<ReturnType<typeof getNodePractice>>;
type Remediation = { nodeId: string; label: string } | null;

export function PracticePlayer({ practice }: { practice: Practice }) {
  const [index, setIndex] = useState(0); const [choice, setChoice] = useState<string | null>(null); const [answer, setAnswer] = useState(""); const [busy, setBusy] = useState(false); const [feedback, setFeedback] = useState<{ correct: boolean; text: string | null; mastery: number } | null>(null); const [done, setDone] = useState(false); const [error, setError] = useState("");
  const [scaffoldLevel,setScaffoldLevel]=useState(practice.scaffoldLevel);
  const [hintsShown, setHintsShown] = useState(Math.min(2,scaffoldLevel));
  const [remediation, setRemediation] = useState<Remediation>(null);
  const [attemptsOnItem,setAttemptsOnItem]=useState(0);
  const item = practice.items[index];
  const hints = useMemo(() => item ? buildHintLadder({
    nodeLabel: practice.node.label,
    nodeDescription: practice.node.description,
    validatorType: item.validatorType,
    validatorConfig: item.validatorConfig,
    choiceCount: item.choices.length,
  }) : [], [item, practice.node.label, practice.node.description]);
  const support = item ? [...hints, workedExample(practice.node.label,item.validatorType)] : hints;
  async function submit() { if (!item) return; setBusy(true); setError(""); try { const result = await submitNodePractice({ nodeId: practice.node.id, itemId: item.id, selectedChoiceId: choice ?? undefined, answerText: choice ? undefined : answer, startedAt: new Date().toISOString(), hintsUsed: hintsShown }); setFeedback({ correct: result.correct, text: result.feedbackFr, mastery: result.mastery }); setRemediation(result.remediation ?? null); setScaffoldLevel(result.scaffoldLevel);setAttemptsOnItem(value=>value+1);if(result.correct&&(result.mastered||index+1>=Math.min(8,practice.items.length)))setDone(true); } catch { setError("La réponse n’a pas pu être enregistrée."); } finally { setBusy(false); } }
  function next() { setIndex((value) => value + 1); setChoice(null); setAnswer(""); setFeedback(null); setHintsShown(Math.min(2,scaffoldLevel)); setRemediation(null);setAttemptsOnItem(0); }
  function retry(){setChoice(null);setAnswer("");setFeedback(null);setHintsShown(value=>Math.min(support.length,Math.max(value+1,scaffoldLevel)));}
  if (!item) return <p className="text-sm text-muted-foreground">Aucun exercice approuvé pour cette compétence.</p>;
  if (done) return <Card><CardContent className="space-y-4 pt-6"><h2 className="text-xl font-semibold">Étape terminée</h2><p className="text-sm text-muted-foreground">Maîtrise estimée : {Math.round((feedback?.mastery ?? 0) * 100)} %. Ta frontière a été mise à jour.</p>{remediation && <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm"><p className="font-medium">On consolide d’abord un prérequis.</p><p className="mt-1 text-muted-foreground">Reprends « {remediation.label} » avant de retenter cette étape.</p><Link href={`/student/practice/${remediation.nodeId}`} className={`${buttonVariants({ size: "sm" })} mt-3`}>Consolider <ArrowRight /></Link></div>}<Link href="/student/frontier" className={buttonVariants({ variant: remediation ? "outline" : "default" })}>Voir la suite <ArrowRight /></Link></CardContent></Card>;
  return <Card><CardContent className="space-y-4 pt-6"><div className="flex justify-between text-sm text-muted-foreground"><span>Exercice {index + 1} / {Math.min(8, practice.items.length)}</span><span>Maîtrise {Math.round((feedback?.mastery ?? 0) * 100)}%</span></div>{item.instructionsFr && <p className="text-sm text-muted-foreground">{item.instructionsFr}</p>}<p className="text-lg font-medium">{item.promptFr}</p>{item.choices.length ? <div role="radiogroup" aria-label="Choix de réponse" className="grid gap-2">{item.choices.map((option) => <button type="button" role="radio" aria-checked={choice===option.id} key={option.id} disabled={!!feedback} onClick={() => setChoice(option.id)} className={`min-h-11 rounded-md border p-3 text-left text-sm ${choice === option.id ? "border-primary bg-primary/10" : "border-border"}`}>{option.text}</button>)}</div> : <AccentTextarea disabled={!!feedback} value={answer} onChange={setAnswer} className="w-full rounded-md border border-input bg-background p-3 text-sm" />}{hintsShown > 0 && <div className="space-y-2">{support.slice(0, hintsShown).map((hint, hintIndex) => <div key={hintIndex} className="flex gap-2 rounded-md border border-secondary/40 bg-secondary/10 p-3 text-sm"><Lightbulb className="mt-0.5 size-4 shrink-0 text-secondary" /><p>{hint}</p></div>)}</div>}{feedback && <div className={`rounded-md border p-3 text-sm ${feedback.correct ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"}`}><p className="font-medium">{feedback.correct ? "Bonne réponse." : "Pas encore — voici l’indice utile."}</p>{feedback.text && <p className="mt-1 text-muted-foreground">{feedback.text}</p>}</div>}{feedback && remediation && <div className="rounded-md border border-secondary/40 bg-secondary/10 p-3 text-sm"><p className="font-medium">Deux essais difficiles — on renforce la base.</p><p className="mt-1 text-muted-foreground">Un détour par « {remediation.label} » rendra cette étape plus facile.</p><Link href={`/student/practice/${remediation.nodeId}`} className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-3`}>Consolider ce prérequis <ArrowRight /></Link></div>}<div className="flex items-center gap-2">{feedback?(feedback.correct?<Button onClick={next}>Question suivante <ArrowRight /></Button>:remediation?<span className="text-sm text-muted-foreground">Consolide le prérequis avant de continuer.</span>:<Button onClick={retry}>Réessayer avec un nouvel indice</Button>):<><Button disabled={busy || (!choice && !answer.trim())} onClick={submit}>{busy ? "Vérification…" : attemptsOnItem?"Valider la correction":"Valider"}</Button>{hintsShown < support.length && <Button variant="outline" onClick={() => setHintsShown((value) => value + 1)}><Lightbulb /> Indice {hintsShown + 1}/{support.length}</Button>}</>}</div>{error && <p className="text-sm text-destructive">{error}</p>}</CardContent></Card>;
}
