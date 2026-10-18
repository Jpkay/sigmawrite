"use client";
import {homePlanSummary,homePlanEntryText,homeStreakText,homeXpText,homeGoalText} from "@/lib/diagnostic/granular/home-display-text";
import type {HOME_COPY} from "./home-copy";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Snowflake } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {homeFallbackText,homeReadingCardText,visibleHomeRecommendations,type HomeRecommendations} from "@/lib/diagnostic/granular/home-recommendation-display";
import { hasStudentBackend, useStudentState } from "@/lib/student-store";
import { loadStudentHome, markBadgesSeen, type ClassLeague, type SessionPlanEntry, type StudentMotivation } from "@/lib/actions/student";
import { BadgeShelf, ClassGoalCard, WeekStrip, WeeklyRecapCard, type WeeklyRecap } from "@/components/motivation";
import { LeagueCard } from "@/components/league";
import { StudentAssignments } from "@/components/student-assignments";
import type {Assignment} from "@/lib/diagnostic/granular/assignment-display";
import { track } from "@/lib/analytics";
import { interestEmoji } from "@/lib/content/interest-matching";
import { studentSchoolGradeLabel } from "@/lib/school-grade";

export default function StudentHome({copy,assignments=[]}:{copy:typeof HOME_COPY;assignments?:Assignment[]}) {
  const state = useStudentState();
  const fallback = homeFallbackText(state.interests);
  const recommendationKey=JSON.stringify(state.interests);
  const [recommendations,setRecommendations]=useState<HomeRecommendations|null>(null);
  const [plan, setPlan] = useState<SessionPlanEntry[]>([]);
  const [motivation,setMotivation]=useState<StudentMotivation|null>(null);
  const [recap,setRecap]=useState<WeeklyRecap|null>(null);
  const [league,setLeague]=useState<ClassLeague>(null);
  const [classGoal,setClassGoal]=useState<{className:string;targetXp:number;earnedXp:number;activeMembers:number;members:number}|null>(null);
  const [resume,setResume]=useState<{textKey:string;title:string;phase:string}|null>(null);
  const [assessment,setAssessment]=useState<{required:boolean;kind:string;reason:string}|null>(null);
  const [interestNote,setInterestNote]=useState<string|null>(null);

  useEffect(() => {
    if (!hasStudentBackend || !state.hydrated || (!state.diagnostic && !state.granularDiagnosticReady)) return;
    let active = true;
    loadStudentHome({}).then((home) => {
      if (!active) return;
      setRecommendations({key:recommendationKey,texts:home.texts??[]});
      if (home.plan) setPlan(home.plan.slice(0, 6));
      else if (home.fallbackPlan) setPlan(home.fallbackPlan.slice(0, 3).map((step) => ({
        type: "practice", role: "new", nodeId: step.nodeId, label: step.label,
        mastery: step.mastery, estimatedMinutes: 7, href: `/student/practice/${step.nodeId}`,
      })));
      setMotivation(home.motivation); setResume(home.resume); setAssessment(home.assessment); setRecap(home.recap); setClassGoal(home.classGoal); setLeague(home.league); setInterestNote(home.interestNote ?? null);
    }).catch(() => { if (active) setRecommendations(null); });
    return () => { active = false; };
  }, [state.hydrated, state.diagnostic, state.granularDiagnosticReady, state.interests,recommendationKey]);

  const displayedRecommendations=useMemo(()=>visibleHomeRecommendations(hasStudentBackend?recommendations:null,recommendationKey,fallback),[recommendations,recommendationKey,fallback]);
  const displayedRecommendation=displayedRecommendations[0];
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
        <Card className="border-border-strong bg-card">
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
        <Card className="border-border-strong bg-card">
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
        action={<div className="flex items-center gap-3 border-l border-border pl-4 py-1 font-display text-sm font-medium text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Flame className="size-4" />{homeStreakText(motivation?.streak??0)}</span>{(motivation?.freezesAvailable ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-muted-foreground" title={copy.freeze}><Snowflake className="size-4" />{motivation?.freezesAvailable}</span>}<span className="text-foreground">{homeXpText(motivation?.totalXp??0)}</span></div>}
      />

      {studentSchoolGradeLabel(state.grade, state.frenchBackground) && <p className="mb-5 text-sm font-medium text-muted-foreground">{studentSchoolGradeLabel(state.grade, state.frenchBackground)}</p>}

      <StudentAssignments assignments={assignments}/>

      <div className="mb-8 flex flex-wrap gap-x-7 gap-y-2 text-sm font-semibold"><Link href="/student/lessons" className="inline-flex min-h-11 items-center gap-2 text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-brand">{copy.lessons} <ArrowRight className="size-4" /></Link><Link href="/student/diagnostic" className="inline-flex min-h-11 items-center text-muted-foreground underline decoration-border-strong underline-offset-4 hover:decoration-brand">{copy.results}</Link></div>

      {assessment?.required && assessment.kind === "reentry" && assessment.reason === "inactivity" && <Card className="mb-6 border-border-strong bg-card"><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-medium">{copy.updateTitle}</p><p className="text-sm text-muted-foreground">{copy.updateHelp}</p></div><Link href="/student/diagnostic?restart=1" className={buttonVariants()}>{copy.update} <ArrowRight /></Link></CardContent></Card>}

      <section className="mb-10 grid gap-8 border-b border-border-strong pb-9 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-12">
        <div>
          <p className="app-eyebrow">{copy.mission}</p>
          <h2 className="mt-4 max-w-xl font-display text-[clamp(1.875rem,3vw,2.5rem)] font-bold leading-[1.08] tracking-[-0.055em]">{resume ? copy.resumeTitle : motivation?.goalCompleted ? copy.goalDone : copy.step}</h2>
          <p className="mt-4 max-w-lg text-[15px] leading-7 text-muted-foreground">{resume ? resume.title : copy.missionHelp}</p>
          <div className="mt-6">{resume ? <Link href={`/student/read/${resume.textKey}`} className={buttonVariants({size:"lg"})}>{copy.resume} <ArrowRight /></Link> : <Link href={`/student/read/${displayedRecommendation.id}`} className={buttonVariants({size:"lg"})}>{copy.beginToday} <ArrowRight /></Link>}</div>
        </div>
        <div className="grid grid-cols-2 gap-6 border-t border-border pt-6 lg:grid-cols-1 lg:gap-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <div className="flex flex-col justify-center"><p className="font-display text-3xl font-bold tabular-nums tracking-[-0.04em]">{dailyGoalText[0]}<span className="text-sm font-medium text-muted-foreground"> / {dailyGoalText[1]}</span></p><div className="mt-3 h-0.5 w-full overflow-hidden bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={motivation?.goalXp ?? 10} aria-valuenow={Math.min(motivation?.todayXp ?? 0, motivation?.goalXp ?? 10)} aria-label={copy.dailyGoal}><div className="h-full bg-brand transition-[width]" style={{width:`${Math.min(100,Math.round(((motivation?.todayXp ?? 0)/(motivation?.goalXp ?? 10))*100))}%`}} /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{copy.dailyGoal} · <Link href="/student/settings" className="underline underline-offset-2">{copy.modify}</Link></p></div>
          <div className="flex flex-col justify-center border-l border-border pl-6 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-5"><p className="font-display text-3xl font-bold tracking-[-0.04em]">{completed}</p><p className="mt-2 text-xs text-muted-foreground">{copy.finished}</p></div>
        </div>
      </section>

      {motivation && <section className="mb-10 border-b border-border-strong pb-8">
        <div className="grid items-start gap-7 lg:grid-cols-2 lg:gap-10">
          <div className="min-w-0 space-y-6">
            <WeekStrip week={motivation.week} goalXp={motivation.goalXp} freezeAppliedFor={motivation.freezeAppliedFor} />
            <BadgeShelf badges={motivation.badges} onSeen={() => { setMotivation((current) => current ? { ...current, badges: current.badges.map((badge) => ({ ...badge, isNew: false })) } : current); void markBadgesSeen({}).catch(() => undefined); }} />
          </div>
          {recap && <div className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0"><WeeklyRecapCard recap={recap} /></div>}
        </div>
        {(league || classGoal) && <div className="mt-7 grid items-start gap-6 md:grid-cols-2">{league && <LeagueCard league={league} />}{classGoal && <ClassGoalCard goal={classGoal} />}</div>}
      </section>}

      {plan.length > 0 && <section className="mb-10"><div className="mb-4 flex items-end justify-between"><div><p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-success">{copy.plan}</p><h2 className="mt-1 text-xl font-semibold">{copy.planHelp}</h2></div><span className="text-sm text-muted-foreground">{homePlanSummary(plan.length,planMinutes)}</span></div><div className="border-y border-border">{plan.map((entry, index) => {const isReview=entry.role==="review";return <div key={entry.cardId ?? entry.nodeId ?? index} className="group grid gap-4 border-b border-border py-4 last:border-0 sm:grid-cols-[3rem_1fr_auto] sm:items-center"><span className={`grid size-10 place-items-center rounded-full border-2 font-display text-sm font-bold ${isReview?"border-secondary bg-secondary/15 text-secondary":"border-primary bg-primary text-primary-foreground"}`}>{index + 1}</span><div><p className="font-semibold">{entry.label}</p>{entry.mastery != null && <div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-rail"><div className="h-full rounded-full bg-success" style={{width:`${Math.round(entry.mastery*100)}%`}} /></div>}<p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{homePlanEntryText(entry)}</p></div><Link href={entry.href} className={buttonVariants({variant:index===0?"default":"outline",size:"sm"})}>{entry.type==="review_card"?copy.memory:entry.type==="dictation"?copy.dictation:entry.type==="production"?copy.write:isReview?copy.revise:copy.practice} <ArrowRight /></Link></div>})}</div></section>}

      <section className="mb-10">
        <h2 className="mb-5 text-2xl font-bold tracking-[-0.04em]">{copy.reading}</h2>
        {interestNote && <p className="-mt-3 mb-5 text-sm text-muted-foreground">{interestNote}</p>}
        <div className="divide-y divide-border border-y border-border-strong">
          {displayedRecommendations.map((text, index) => { const card=homeReadingCardText(text,state.interests); const emoji=interestEmoji(text.primaryInterest); return <article key={text.id} className="group grid gap-5 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{index === 0 ? copy.recommended : copy.alternative}</p>
              <h3 className="mt-2 max-w-2xl text-[clamp(1.25rem,2vw,1.65rem)] font-semibold leading-snug tracking-[-0.035em]">{card.title}</h3>
              {card.why && <p className="mt-1.5 text-sm text-muted-foreground">{emoji && <span aria-hidden="true">{emoji} </span>}{card.why}</p>}
              <div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{card.band}</Badge>{card.concepts.map((concept) => <Badge key={concept} variant="secondary">{concept}</Badge>)}</div>
            </div>
            <Link href={`/student/read/${text.id}`} onClick={() => { if (completed === 0) track("first_session_started", { text_id: text.id }); if (index > 0) track("topic_reselected", { text_id: text.id, interest: text.primaryInterest }); }} className="inline-flex min-h-11 items-center justify-between gap-6 font-display text-sm font-bold text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-brand sm:justify-end">{copy.choose} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
          </article>; })}
        </div>
      </section>

      <section><p className="mb-4 font-display text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">{copy.profile}</p><div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-5 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-l border-border pl-4 first:border-l-0 first:pl-0">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div></section>
    </>
  );
}
