"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { recommendTextId } from "@/lib/content/recommend";
import type { SeedText } from "@/lib/content/types";
import { hasStudentBackend, useStudentState } from "@/lib/student-store";
import { loadDiagnosticRequirement, loadLatestReadingResume, loadStudentCatchUpPlan, loadStudentMotivation, loadStudentSessionPlan, recommendReadingTexts, type SessionPlanEntry } from "@/lib/actions/student";
import { StudentAssignments } from "@/components/student-assignments";
import { track } from "@/lib/analytics";
import { difficultyBandLabel } from "@/lib/scoring/band";

export default function StudentHome() {
  const state = useStudentState();
  const fallback = SEED_TEXT_BY_ID[recommendTextId(state.interests)];
  const [recommended, setRecommended] = useState<SeedText>(fallback);
  const [recommendations, setRecommendations] = useState<SeedText[]>([fallback]);
  const [plan, setPlan] = useState<SessionPlanEntry[]>([]);
  const [motivation,setMotivation]=useState<{streak:number;today:unknown;week:unknown[];totalXp:number}|null>(null);
  const [resume,setResume]=useState<{textKey:string;title:string;phase:string}|null>(null);
  const [assessment,setAssessment]=useState<{required:boolean;kind:string;reason:string}|null>(null);

  useEffect(() => {
    const local = SEED_TEXT_BY_ID[recommendTextId(state.interests)];
    if (!hasStudentBackend || !state.hydrated || !state.diagnostic) return;
    let active = true;
    recommendReadingTexts({}).then((texts) => {
      if (active && texts.length) {
        setRecommended(texts[0]);
        setRecommendations(texts);
      }
    }).catch(() => { if (active) setRecommended(local); });
    loadStudentSessionPlan({})
      .then((entries) => { if (active) setPlan(entries.slice(0, 6)); })
      .catch(() => {
        // Fallback: raw path steps if the scheduler is unavailable.
        loadStudentCatchUpPlan({}).then((steps) => {
          if (active) setPlan(steps.slice(0, 3).map((step) => ({
            type: "practice", role: "new", nodeId: step.nodeId, label: step.label,
            mastery: step.mastery, estimatedMinutes: 7, href: `/student/practice/${step.nodeId}`,
          })));
        }).catch(() => undefined);
      });
    loadStudentMotivation({}).then(value=>{if(active)setMotivation(value);}).catch(()=>undefined);
    loadLatestReadingResume({}).then(value=>{if(active)setResume(value);}).catch(()=>undefined);
    loadDiagnosticRequirement({}).then(value=>{if(active)setAssessment(value);}).catch(()=>undefined);
    return () => { active = false; };
  }, [state.hydrated, state.diagnostic, state.interests]);

  const displayedRecommendation = hasStudentBackend ? recommended : fallback;
  const displayedRecommendations = useMemo(()=>recommendations.length ? recommendations : [displayedRecommendation],[recommendations,displayedRecommendation]);
  const planMinutes = plan.reduce((total, entry) => total + entry.estimatedMinutes, 0);
  useEffect(()=>{if(typeof window==="undefined"||!("caches"in window))return;const urls=[...displayedRecommendations.map(text=>`/student/read/${text.id}`),...plan.filter(entry=>entry.type!=="review_card").map(entry=>entry.href)];void caches.open("plume-offline-pack-v1").then(cache=>Promise.all(urls.map(url=>cache.add(url).catch(()=>undefined))));},[displayedRecommendations,plan]);

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
              Fais le diagnostic pour construire ton profil en lecture, grammaire, orthographe et conjugaison.
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
        eyebrow="Ton espace de lecture"
        title="Bonjour 👋"
        description="Ta prochaine étape est prête. Avance à ton rythme, une lecture après l’autre."
        action={<div className="flex items-center gap-3 rounded-full bg-secondary/15 px-4 py-2 font-display text-sm font-semibold text-secondary"><span className="inline-flex items-center gap-1.5"><Flame className="size-4" />{motivation?.streak ?? 0} jour(s)</span><span className="text-foreground">{motivation?.totalXp ?? 0} XP</span></div>}
      />

      <StudentAssignments />

      {assessment?.required && assessment.kind === "reentry" && <Card className="mb-6 border-primary/40 bg-accent/40"><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-medium">Mets ton profil à jour</p><p className="text-sm text-muted-foreground">Quelques questions ciblées suffisent. Tes progrès précédents sont conservés.</p></div><Link href="/student/diagnostic" className={buttonVariants()}>Mettre à jour <ArrowRight /></Link></CardContent></Card>}

      <section className="mb-8 grid overflow-hidden rounded-xl border border-border-strong bg-card-elevated shadow-[0_8px_30px_rgba(60,50,30,.06)] dark:bg-[linear-gradient(145deg,var(--card-elevated),var(--card))] lg:grid-cols-[1fr_18rem]">
        <div className="relative p-7 sm:p-9">
          <div className="absolute right-0 top-0 size-48 bg-[radial-gradient(circle,rgba(255,63,142,.16),transparent_68%)]" />
          <p className="relative font-display text-xs font-semibold uppercase tracking-[0.16em] text-primary">Mission du jour</p>
          <h2 className="relative mt-3 max-w-xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em]">{resume ? "Continue là où tu t’es arrêté." : motivation?.today ? "Mission accomplie. Bien joué !" : "Une étape suffit pour avancer."}</h2>
          <p className="relative mt-3 max-w-lg text-[15px] leading-6 text-muted-foreground">{resume ? resume.title : "Lis un texte ou entraîne une compétence. Ton parcours s’ajuste après chaque réponse."}</p>
          <div className="relative mt-7">{resume ? <Link href={`/student/read/${resume.textKey}`} className={buttonVariants({size:"lg"})}>Reprendre la lecture <ArrowRight /></Link> : <Link href={`/student/read/${displayedRecommendation.id}`} className={buttonVariants({size:"lg"})}>Commencer aujourd’hui <ArrowRight /></Link>}</div>
        </div>
        <div className="grid grid-cols-2 border-t border-border bg-muted/35 lg:grid-cols-1 lg:border-l lg:border-t-0">
          <div className="flex flex-col justify-center p-6 sm:p-7"><Target className="mb-3 size-5 text-success" /><p className="font-display text-2xl font-bold">{motivation?.today ? "Fait" : "1 étape"}</p><p className="mt-1 text-xs text-muted-foreground">Objectif quotidien</p></div>
          <div className="flex flex-col justify-center border-l border-border p-6 sm:p-7 lg:border-l-0 lg:border-t"><BookOpen className="mb-3 size-5 text-secondary" /><p className="font-display text-2xl font-bold">{completed}</p><p className="mt-1 text-xs text-muted-foreground">Textes terminés</p></div>
        </div>
      </section>

      {plan.length > 0 && <section className="mb-10"><div className="mb-4 flex items-end justify-between"><div><p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-success">Plan du jour</p><h2 className="mt-1 text-xl font-semibold">Révisions et nouvelles étapes, dans le bon ordre</h2></div><span className="text-sm text-muted-foreground">{plan.length} activité(s) · environ {planMinutes} min</span></div><div className="border-y border-border">{plan.map((entry, index) => {const isReview=entry.role==="review";const isCompression=entry.role==="compression";return <div key={entry.cardId ?? entry.nodeId ?? index} className="group grid gap-4 border-b border-border py-4 last:border-0 sm:grid-cols-[3rem_1fr_auto] sm:items-center"><span className={`grid size-10 place-items-center rounded-full border-2 font-display text-sm font-bold ${isReview?"border-secondary bg-secondary/15 text-secondary":"border-primary bg-primary text-primary-foreground"}`}>{index + 1}</span><div><p className="font-semibold">{entry.label}</p>{entry.mastery != null && <div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-rail"><div className="h-full rounded-full bg-success" style={{width:`${Math.round(entry.mastery*100)}%`}} /></div>}<p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{isReview?`Révision · ${entry.estimatedMinutes} min`:isCompression?`Réactive plusieurs notions · ${entry.estimatedMinutes} min`:entry.mastery!=null?`Nouvelle étape · ${entry.estimatedMinutes} min · maîtrise ${Math.round(entry.mastery*100)}%`:`Nouvelle étape · ${entry.estimatedMinutes} min`}</p></div><Link href={entry.href} className={buttonVariants({variant:index===0?"default":"outline",size:"sm"})}>{entry.type==="review_card"?"Mémoire":entry.type==="production"?"Écrire":isReview?"Réviser":"S’entraîner"} <ArrowRight /></Link></div>})}</div></section>}

      <section className="mb-10"><div className="mb-5 flex items-center gap-3"><Sparkles className="size-5 text-primary"/><h2 className="text-xl font-semibold">Choisis ta prochaine lecture</h2></div><div className="grid gap-4 lg:grid-cols-3">{displayedRecommendations.map((text, index) => <article key={text.id} className={`group flex min-h-64 flex-col justify-between rounded-lg border p-6 transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(60,50,30,.08)] ${index === 0 ? "border-primary/40 bg-accent" : "border-border bg-card"}`}><div><p className={`font-display text-[11px] font-semibold uppercase tracking-[.14em] ${index===0?"text-primary":"text-muted-foreground"}`}>{index === 0 ? "Recommandée pour toi" : "Autre piste"}</p><h3 className="mt-4 text-xl font-semibold leading-snug">{text.title}</h3><div className="mt-4 flex flex-wrap gap-2"><Badge>{difficultyBandLabel(text.difficultyBand)}</Badge>{text.concepts.slice(0,2).map((concept) => <Badge key={concept} variant="secondary">{concept}</Badge>)}</div></div><Link href={`/student/read/${text.id}`} onClick={() => { if (completed === 0) track("first_session_started", { text_id: text.id }); if (index > 0) track("topic_reselected", { text_id: text.id, interest: text.primaryInterest }); }} className="mt-8 flex items-center justify-between border-t border-current/10 pt-4 font-display text-sm font-bold text-foreground hover:text-primary">Choisir ce texte <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></article>)}</div></section>

      <section><p className="mb-4 font-display text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Ton profil en bref</p><div className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-b border-r border-border p-5 last:border-r-0 sm:border-b-0">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div></section>
    </>
  );
}
