"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { startAdaptiveDiagnostic, submitAdaptiveDiagnosticProbe } from "@/lib/actions/student";
import { track } from "@/lib/analytics";
import type { LiveDiagnosticItem } from "@/lib/diagnostic/live";
import type { FrontierReport } from "@/lib/diagnostic/report";
import type { GoalScope } from "@/lib/graph/types";
import { AccentTextarea } from "@/components/accent-textarea";

type Run = { runId: string; startedAt: string; item: LiveDiagnosticItem };
type Frontier = { report: FrontierReport; labels: Record<string, { key: string; label: string }>; scope: GoalScope };

export default function DiagnosticPage() {
  const started = useRef(false);
  const [run, setRun] = useState<Run | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [probeCount, setProbeCount] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [frontier, setFrontier] = useState<Frontier | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return; started.current = true;
    track("diagnostic_started", {});
    startAdaptiveDiagnostic({}).then(setRun).catch(() => setError("Le diagnostic ne peut pas démarrer. Vérifie d’abord ton profil.")).finally(() => setPending(false));
  }, []);

  async function submit() {
    if (!run) return; setPending(true); setError("");
    try {
      const result = await submitAdaptiveDiagnosticProbe({ runId: run.runId, itemId: run.item.id, selectedChoiceId: choice ?? undefined, answerText: choice ? undefined : answer, startedAt: run.startedAt });
      setFeedback(result.correct); setProbeCount(result.probeCount);
      await new Promise((resolve) => setTimeout(resolve, 450));
      if (result.done) {
        setFrontier(result.frontier as Frontier); setRun(null);
        track("diagnostic_completed", { goal: "active", duration_seconds: Math.round((Date.now() - Date.parse(run.startedAt)) / 1000), probes_count: result.probeCount });
      } else {
        setRun((current) => current ? { ...current, item: result.item } : current); setChoice(null); setAnswer(""); setFeedback(null);
      }
    } catch { setError("Ta réponse n’a pas pu être enregistrée. Réessaie."); }
    finally { setPending(false); }
  }

  if (frontier) return <><PageHeader title="Ta frontière d’apprentissage" description="Le diagnostic a localisé ce que tu maîtrises et la prochaine étape utile." /><div className="grid gap-4 sm:grid-cols-4">{([['mastered','Maîtrisé'],['fragile','À consolider'],['missing','À construire'],['readyToLearn','Prêt à apprendre']] as const).map(([key,label]) => <Card key={key}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-semibold">{frontier.report[key].length}</p></CardContent></Card>)}</div><Link href="/student/frontier" className={`${buttonVariants()} mt-6`}>Voir le détail et mon parcours <ArrowRight /></Link></>;
  if (pending && !run) return <PageHeader title="Diagnostic adaptatif" description="Préparation de la première question…" />;
  if (!run) return <><PageHeader title="Diagnostic adaptatif" />{error && <p className="text-sm text-destructive">{error}</p>}<Link href="/student/onboarding" className={`${buttonVariants({ variant: "outline" })} mt-4`}>Revoir mon profil</Link></>;
  const item = run.item; const canSubmit = item.choices.length ? !!choice : !!answer.trim();
  return <><PageHeader title="Diagnostic adaptatif" description="Les questions s’ajustent à tes réponses. Tu peux simplement faire de ton mieux." /><div className="mb-4 flex items-center justify-between text-sm text-muted-foreground"><span>Question {probeCount + 1} · maximum 15</span><Badge variant="secondary">{item.nodeLabel}</Badge></div><div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${Math.max(5, ((probeCount + 1) / 15) * 100)}%` }} /></div><Card><CardContent className="space-y-4 pt-6">{item.instructionsFr && <p className="text-sm text-muted-foreground">{item.instructionsFr}</p>}<p className="text-lg font-medium">{item.promptFr}</p>{item.choices.length ? <div className="grid gap-2">{item.choices.map((option) => <button key={option.id} onClick={() => setChoice(option.id)} className={`min-h-11 rounded-md border px-4 py-3 text-left text-sm ${choice === option.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>{option.text}</button>)}</div> : <AccentTextarea aria-label="Ta réponse" value={answer} onChange={setAnswer} rows={3} className="w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="Écris ta réponse…" />}{feedback !== null && <p className={`flex items-center gap-2 text-sm ${feedback ? "text-[color:var(--success)]" : "text-muted-foreground"}`}>{feedback ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}{feedback ? "Bonne réponse." : "Cette réponse nous aide à trouver la bonne base à travailler."}</p>}<Button onClick={submit} disabled={pending || !canSubmit}>{pending ? "Analyse…" : "Valider"} <ArrowRight /></Button>{error && <p className="text-sm text-destructive">{error}</p>}</CardContent></Card></>;
}
