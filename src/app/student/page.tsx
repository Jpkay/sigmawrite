"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { recommendTextId } from "@/lib/content/recommend";
import type { SeedText } from "@/lib/content/types";
import { hasStudentBackend, useStudentState } from "@/lib/student-store";
import { loadLatestReadingResume, loadStudentCatchUpPlan, loadStudentMotivation, recommendReadingText, recommendReadingTexts } from "@/lib/actions/student";
import type { CatchUpStep } from "@/lib/db/practice";
import { StudentAssignments } from "@/components/student-assignments";
import { track } from "@/lib/analytics";
import { difficultyBandLabel } from "@/lib/scoring/band";

export default function StudentHome() {
  const state = useStudentState();
  const fallback = SEED_TEXT_BY_ID[recommendTextId(state.interests)];
  const [recommended, setRecommended] = useState<SeedText>(fallback);
  const [recommendations, setRecommendations] = useState<SeedText[]>([fallback]);
  const [plan, setPlan] = useState<CatchUpStep[]>([]);
  const [motivation,setMotivation]=useState<{streak:number;today:unknown;week:unknown[]}|null>(null);
  const [resume,setResume]=useState<{textKey:string;title:string;phase:string}|null>(null);

  useEffect(() => {
    const local = SEED_TEXT_BY_ID[recommendTextId(state.interests)];
    if (!hasStudentBackend || !state.hydrated || !state.diagnostic) return;
    let active = true;
    recommendReadingText({})
      .then((text) => { if (active) setRecommended(text); })
      .catch(() => { if (active) setRecommended(local); });
    recommendReadingTexts({}).then((texts) => { if (active && texts.length) setRecommendations(texts); }).catch(() => undefined);
    loadStudentCatchUpPlan({}).then((steps) => { if (active) setPlan(steps.slice(0, 3)); }).catch(() => undefined);
    loadStudentMotivation({}).then(value=>{if(active)setMotivation(value);}).catch(()=>undefined);
    loadLatestReadingResume({}).then(value=>{if(active)setResume(value);}).catch(()=>undefined);
    return () => { active = false; };
  }, [state.hydrated, state.diagnostic, state.interests]);

  const displayedRecommendation = hasStudentBackend ? recommended : fallback;
  const displayedRecommendations = useMemo(()=>recommendations.length ? recommendations : [displayedRecommendation],[recommendations,displayedRecommendation]);
  useEffect(()=>{if(typeof window==="undefined"||!("caches"in window))return;const urls=[...displayedRecommendations.map(text=>`/student/read/${text.id}`),...plan.map(step=>`/student/practice/${step.nodeId}`)];void caches.open("sigmawrite-offline-pack-v1").then(cache=>Promise.all(urls.map(url=>cache.add(url).catch(()=>undefined))));},[displayedRecommendations,plan]);

  if (!state.hydrated) {
    return <PageHeader title="Bonjour 👋" description="Chargement…" />;
  }

  if (!state.onboarded) {
    return (
      <>
        <PageHeader
          title="Bonjour 👋"
          description="Crée ton profil de lecture en quelques minutes."
        />
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-lg font-medium">Commençons par te connaître.</p>
            <Link href="/student/onboarding" className={buttonVariants()}>
              Démarrer <ArrowRight />
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!state.diagnostic) {
    return (
      <>
        <PageHeader title="Bonjour 👋" description="Encore une étape." />
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-lg font-medium">
              Fais le diagnostic pour établir ta bande de lecture.
            </p>
            <Link href="/student/diagnostic" className={buttonVariants()}>
              Diagnostic <ArrowRight />
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  const completed = state.sessions.length;
  const avg = completed
    ? Math.round(
        (state.sessions.reduce((s, r) => s + r.successRate, 0) / completed) * 100
      )
    : 0;
  const band = state.diagnostic.overallReadingBand;

  const stats = [
    {
      label: "Bande de lecture",
      value: `${band.minGrade.toFixed(1)}–${band.maxGrade.toFixed(1)}`,
    },
    { label: "Textes complétés", value: String(completed) },
    { label: "Réussite moyenne", value: completed ? `${avg}%` : "—" },
    { label: "Zone cible", value: "80–85%" },
  ];

  return (
    <>
      <PageHeader
        title="Bonjour 👋"
        description="Voici ta lecture du jour, choisie selon tes intérêts et ton niveau."
      />

      <StudentAssignments />

      <div className="mb-6 grid gap-4 sm:grid-cols-2"><Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Objectif du jour</p><p className="mt-1 text-xl font-semibold">{motivation?.today?"Atteint aujourd’hui":"Une lecture ou une étape"}</p><p className="mt-2 text-sm text-muted-foreground">🔥 Série privée : {motivation?.streak??0} jour(s)</p></CardContent></Card>{resume&&<Card className="border-primary/40"><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="text-sm text-muted-foreground">Reprendre ta lecture</p><p className="font-medium">{resume.title}</p></div><Link href={`/student/read/${resume.textKey}`} className={buttonVariants()}>Reprendre <ArrowRight/></Link></CardContent></Card>}</div>

      {plan.length > 0 && <Card className="mb-6"><CardHeader><CardTitle>Aujourd’hui : {plan.length} étapes</CardTitle></CardHeader><CardContent className="space-y-3">{plan.map((step, index) => <div key={step.nodeId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"><div><p className="font-medium">{index + 1}. {step.label}</p><p className="text-xs text-muted-foreground">Maîtrise actuelle : {Math.round(step.mastery * 100)}%</p></div><Link href={`/student/practice/${step.nodeId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>S’entraîner <ArrowRight /></Link></div>)}</CardContent></Card>}

      <div className="mb-6 grid gap-4 lg:grid-cols-3">{displayedRecommendations.map((text, index) => <Card key={text.id} className={index === 0 ? "border-primary/40 bg-accent/40" : ""}><CardHeader><CardTitle>{index === 0 ? "Lecture recommandée" : "Autre sujet possible"}</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="font-medium">« {text.title} »</p><div className="mt-3 flex flex-wrap gap-2"><Badge>{difficultyBandLabel(text.difficultyBand)}</Badge>{text.concepts.slice(0,2).map((concept) => <Badge key={concept} variant="secondary">{concept}</Badge>)}</div></div><Link href={`/student/read/${text.id}`} onClick={() => { if (completed === 0) track("first_session_started", { text_id: text.id }); if (index > 0) track("topic_reselected", { text_id: text.id, interest: text.primaryInterest }); }} className={buttonVariants({ variant: index === 0 ? "default" : "outline" })}>Choisir <ArrowRight /></Link></CardContent></Card>)}</div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
