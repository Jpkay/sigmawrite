"use client";
import {homePlanSummary,homePlanEntryText,homeStreakText,homeXpText,homeGoalText} from "@/lib/diagnostic/granular/home-display-text";
import type {HOME_COPY} from "./home-copy";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Snowflake, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SEED_TEXT_BY_ID } from "@/lib/content/texts";
import { recommendTextId } from "@/lib/content/recommend";
import type { SeedText } from "@/lib/content/types";
import { hasStudentBackend, useStudentState } from "@/lib/student-store";
import { loadStudentHome, markBadgesSeen, type ClassLeague, type SessionPlanEntry, type StudentMotivation } from "@/lib/actions/student";
import { BadgeShelf, ClassGoalCard, WeekStrip, WeeklyRecapCard, type WeeklyRecap } from "@/components/motivation";
import { LeagueCard } from "@/components/league";
import { StudentAssignments } from "@/components/student-assignments";
import { track } from "@/lib/analytics";
import { difficultyBandLabel } from "@/lib/scoring/band";

export default function StudentHome({copy}:{copy:typeof HOME_COPY}) {
  const state = useStudentState();
  const fallback = SEED_TEXT_BY_ID[recommendTextId(state.interests)];
  const [recommended, setRecommended] = useState<SeedText>(fallback);
  const [recommendations, setRecommendations] = useState<SeedText[]>([fallback]);
  const [plan, setPlan] = useState<SessionPlanEntry[]>([]);
  const [motivation,setMotivation]=useState<StudentMotivation|null>(null);
  const [recap,setRecap]=useState<WeeklyRecap|null>(null);
  const [league,setLeague]=useState<ClassLeague>(null);
  const [classGoal,setClassGoal]=useState<{className:string;targetXp:number;earnedXp:number;activeMembers:number;members:number}|null>(null);
  const [resume,setResume]=useState<{textKey:string;title:string;phase:string}|null>(null);
  const [assessment,setAssessment]=useState<{required:boolean;kind:string;reason:string}|null>(null);

  useEffect(() => {
    const local = SEED_TEXT_BY_ID[recommendTextId(state.interests)];
    if (!hasStudentBackend || !state.hydrated || (!state.diagnostic && !state.granularDiagnosticReady)) return;
    let active = true;
    loadStudentHome({}).then((home) => {
      if (!active) return;
      if (home.texts?.length) { setRecommended(home.texts[0]); setRecommendations(home.texts); } else setRecommended(local);
      if (home.plan) setPlan(home.plan.slice(0, 6));
      else if (home.fallbackPlan) setPlan(home.fallbackPlan.slice(0, 3).map((step) => ({
        type: "practice", role: "new", nodeId: step.nodeId, label: step.label,
        mastery: step.mastery, estimatedMinutes: 7, href: `/student/practice/${step.nodeId}`,
      })));
      setMotivation(home.motivation); setResume(home.resume); setAssessment(home.assessment); setRecap(home.recap); setClassGoal(home.classGoal); setLeague(home.league);
    }).catch(() => { if (active) setRecommended(local); });
    return () => { active = false; };
  }, [state.hydrated, state.diagnostic, state.granularDiagnosticReady, state.interests]);

  const displayedRecommendation = hasStudentBackend ? recommended : fallback;
  const displayedRecommendations = useMemo(()=>recommendations.length ? recommendations : [displayedRecommendation],[recommendations,displayedRecommendation]);
  const planMinutes = plan.reduce((total, entry) => total + entry.estimatedMinutes, 0);
  const dailyGoalText=homeGoalText(motivation?.todayXp??0,motivation?.goalXp??10).split(" / ");
  useEffect(()=>{
    if(!state.hydrated||typeof navigator==="undefined"||!navigator.serviceWorker?.controller)return;
    const controller=new AbortController();
    const urls=[...displayedRecommendations.map(text=>`/student/read/${text.id}`),...plan.filter(entry=>entry.type!=="review_card").map(entry=>entry.href)];
    // The worker alone writes owner-verified responses into the private pack.
    void Promise.all(urls.map(url=>fetch(url,{headers:{"X-Plume-Offline-Prefetch":"1"},signal:controller.signal}).catch(()=>undefined)));
    return()=>controller.abort();
  },[state.hydrated,displayedRecommendations,plan]);

  if (!state.hydrated) {
    return <PageHeader title={copy.greeting} description={copy.loading} />;
  }

  if (!state.onboarded) {
    return (
      <>
        <PageHeader
          title={copy.greeting}
          description={copy.onboarding}
        />
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-lg font-medium">{copy.knowYou}</p>
            <Link href="/student/onboarding" className={buttonVariants()}>
              {copy.start} <ArrowRight />
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!state.diagnostic && !state.granularDiagnosticReady) {
    return (
      <>
        <PageHeader title={copy.greeting} description={copy.oneStep} />
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-lg font-medium">
              {copy.diagnosticHelp}
            </p>
            <Link href="/student/diagnostic" className={buttonVariants()}>
              {copy.diagnostic} <ArrowRight />
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
  const band = state.diagnostic?.overallReadingBand;

  const stats = [
    {
      label: state.granularDiagnosticReady ? copy.skillProfile : copy.readingBand,
      value: state.granularDiagnosticReady ? copy.available : band ? `${band.minGrade.toFixed(1)}–${band.maxGrade.toFixed(1)}` : "—",
    },
    { label: copy.completed, value: String(completed) },
    { label: copy.average, value: completed ? `${avg}%` : "—" },
    { label: copy.target, value: copy.targetValue },
  ];

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.greeting}
        description={copy.description}
        action={<div className="flex items-center gap-3 rounded-full bg-secondary/15 px-4 py-2 font-display text-sm font-semibold text-secondary"><span className="inline-flex items-center gap-1.5"><Flame className="size-4" />{homeStreakText(motivation?.streak??0)}</span>{(motivation?.freezesAvailable ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-secondary" title={copy.freeze}><Snowflake className="size-4" />{motivation?.freezesAvailable}</span>}<span className="text-foreground">{homeXpText(motivation?.totalXp??0)}</span></div>}
      />

      <StudentAssignments />

      <div className="mb-6 flex flex-wrap gap-3"><Link href="/student/lessons" className={buttonVariants()}>{copy.lessons} <ArrowRight /></Link><Link href="/student/diagnostic" className={buttonVariants({variant:"outline"})}>{copy.results}</Link></div>

      {assessment?.required && assessment.kind === "reentry" && assessment.reason === "inactivity" && <Card className="mb-6 border-primary/40 bg-accent/40"><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-medium">{copy.updateTitle}</p><p className="text-sm text-muted-foreground">{copy.updateHelp}</p></div><Link href="/student/diagnostic?restart=1" className={buttonVariants()}>{copy.update} <ArrowRight /></Link></CardContent></Card>}

      <section className="mb-8 grid overflow-hidden rounded-xl border border-border-strong bg-card-elevated shadow-[0_8px_30px_rgba(60,50,30,.06)] dark:bg-[linear-gradient(145deg,var(--card-elevated),var(--card))] lg:grid-cols-[1fr_18rem]">
        <div className="relative p-7 sm:p-9">
          <div className="absolute right-0 top-0 size-48 bg-[radial-gradient(circle,rgba(255,63,142,.16),transparent_68%)]" />
          <p className="relative font-display text-xs font-semibold uppercase tracking-[0.16em] text-primary">{copy.mission}</p>
          <h2 className="relative mt-3 max-w-xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em]">{resume ? copy.resumeTitle : motivation?.goalCompleted ? copy.goalDone : copy.step}</h2>
          <p className="relative mt-3 max-w-lg text-[15px] leading-6 text-muted-foreground">{resume ? resume.title : copy.missionHelp}</p>
          <div className="relative mt-7">{resume ? <Link href={`/student/read/${resume.textKey}`} className={buttonVariants({size:"lg"})}>{copy.resume} <ArrowRight /></Link> : <Link href={`/student/read/${displayedRecommendation.id}`} className={buttonVariants({size:"lg"})}>{copy.beginToday} <ArrowRight /></Link>}</div>
        </div>
        <div className="grid grid-cols-2 border-t border-border bg-muted/35 lg:grid-cols-1 lg:border-l lg:border-t-0">
          <div className="flex flex-col justify-center p-6 sm:p-7"><Target className="mb-3 size-5 text-success" /><p className="font-display text-2xl font-bold tabular-nums">{dailyGoalText[0]}<span className="text-base font-semibold text-muted-foreground"> / {dailyGoalText[1]}</span></p><div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={motivation?.goalXp ?? 10} aria-valuenow={Math.min(motivation?.todayXp ?? 0, motivation?.goalXp ?? 10)} aria-label={copy.dailyGoal}><div className="h-full rounded-full bg-success transition-[width]" style={{width:`${Math.min(100,Math.round(((motivation?.todayXp ?? 0)/(motivation?.goalXp ?? 10))*100))}%`}} /></div><p className="mt-1 text-xs text-muted-foreground">{copy.dailyGoal} · <Link href="/student/settings" className="underline-offset-2 hover:underline">{copy.modify}</Link></p></div>
          <div className="flex flex-col justify-center border-l border-border p-6 sm:p-7 lg:border-l-0 lg:border-t"><BookOpen className="mb-3 size-5 text-secondary" /><p className="font-display text-2xl font-bold">{completed}</p><p className="mt-1 text-xs text-muted-foreground">{copy.finished}</p></div>
        </div>
      </section>

      {motivation && <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_20rem]"><WeekStrip week={motivation.week} goalXp={motivation.goalXp} freezeAppliedFor={motivation.freezeAppliedFor} /><div className="grid gap-4">{league && <LeagueCard league={league} />}{classGoal && <ClassGoalCard goal={classGoal} />}{recap && <WeeklyRecapCard recap={recap} />}<BadgeShelf badges={motivation.badges} onSeen={() => { setMotivation((current) => current ? { ...current, badges: current.badges.map((badge) => ({ ...badge, isNew: false })) } : current); void markBadgesSeen({}).catch(() => undefined); }} /></div></section>}

      {plan.length > 0 && <section className="mb-10"><div className="mb-4 flex items-end justify-between"><div><p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-success">{copy.plan}</p><h2 className="mt-1 text-xl font-semibold">{copy.planHelp}</h2></div><span className="text-sm text-muted-foreground">{homePlanSummary(plan.length,planMinutes)}</span></div><div className="border-y border-border">{plan.map((entry, index) => {const isReview=entry.role==="review";return <div key={entry.cardId ?? entry.nodeId ?? index} className="group grid gap-4 border-b border-border py-4 last:border-0 sm:grid-cols-[3rem_1fr_auto] sm:items-center"><span className={`grid size-10 place-items-center rounded-full border-2 font-display text-sm font-bold ${isReview?"border-secondary bg-secondary/15 text-secondary":"border-primary bg-primary text-primary-foreground"}`}>{index + 1}</span><div><p className="font-semibold">{entry.label}</p>{entry.mastery != null && <div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-rail"><div className="h-full rounded-full bg-success" style={{width:`${Math.round(entry.mastery*100)}%`}} /></div>}<p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{homePlanEntryText(entry)}</p></div><Link href={entry.href} className={buttonVariants({variant:index===0?"default":"outline",size:"sm"})}>{entry.type==="review_card"?copy.memory:entry.type==="dictation"?copy.dictation:entry.type==="production"?copy.write:isReview?copy.revise:copy.practice} <ArrowRight /></Link></div>})}</div></section>}

      <section className="mb-10"><div className="mb-5 flex items-center gap-3"><Sparkles className="size-5 text-primary"/><h2 className="text-xl font-semibold">{copy.reading}</h2></div><div className="grid gap-4 lg:grid-cols-3">{displayedRecommendations.map((text, index) => <article key={text.id} className={`group flex min-h-64 flex-col justify-between rounded-lg border p-6 transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(60,50,30,.08)] ${index === 0 ? "border-primary/40 bg-accent" : "border-border bg-card"}`}><div><p className={`font-display text-[11px] font-semibold uppercase tracking-[.14em] ${index===0?"text-primary":"text-muted-foreground"}`}>{index === 0 ? copy.recommended : copy.alternative}</p><h3 className="mt-4 text-xl font-semibold leading-snug">{text.title}</h3><div className="mt-4 flex flex-wrap gap-2"><Badge>{difficultyBandLabel(text.difficultyBand)}</Badge>{text.concepts.slice(0,2).map((concept) => <Badge key={concept} variant="secondary">{concept}</Badge>)}</div></div><Link href={`/student/read/${text.id}`} onClick={() => { if (completed === 0) track("first_session_started", { text_id: text.id }); if (index > 0) track("topic_reselected", { text_id: text.id, interest: text.primaryInterest }); }} className="mt-8 flex items-center justify-between border-t border-current/10 pt-4 font-display text-sm font-bold text-foreground hover:text-primary">{copy.choose} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></article>)}</div></section>

      <section><p className="mb-4 font-display text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">{copy.profile}</p><div className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
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
