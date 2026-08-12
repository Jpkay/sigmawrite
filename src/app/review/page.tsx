import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, History, Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireActiveReviewer } from "@/lib/auth";
import { getReviewerExerciseHistory, getDiagnosticItemReviewProgress } from "@/lib/db/items";
import { getReviewNotifications, getReviewerAccess, getReviewerQueue } from "@/lib/db/reviews";
import { createServiceClient } from "@/lib/supabase/server";
import { targetLevelProfile } from "@/lib/scoring/band";

type ReviewHomeProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ReviewHomePage({ searchParams }: ReviewHomeProps) {
  const session = await requireActiveReviewer();
  const service = createServiceClient();
  const [queue, access, exerciseProgress, exerciseHistory, notifications, query] = await Promise.all([
    getReviewerQueue(session.id, service),
    getReviewerAccess(session.id, service),
    getDiagnosticItemReviewProgress(service, session.id),
    getReviewerExerciseHistory(session.id, service),
    getReviewNotifications(undefined, true, session.id),
    searchParams,
  ]);
  const unfinishedPassages = queue.filter((item) => item.status !== "submitted");
  const passageHistory = queue.filter((item) => item.status === "submitted");
  const draft = unfinishedPassages.find((item) => item.status === "draft");

  if (!access?.acknowledgedAt) {
    const first = draft ?? unfinishedPassages[0] ?? queue[0];
    const level = targetLevelProfile(first?.candidate.input.targetReadingBand);
    const excerpt = first?.candidate.generated.body.trim().split(/\s+/).slice(0, 48).join(" ");
    return <div className="mx-auto max-w-3xl py-5 sm:py-10">
      <p className="text-sm font-medium text-primary">Bienvenue {session.displayName ?? ""}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Votre première évaluation est prête</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Textes, grammaire, orthographe et conjugaison seront alternés dans une même mission.</p>
      <ol className="mt-8 grid gap-4 border-y border-border py-5 sm:grid-cols-3">{["Le français est-il naturel et clair ?", `Le contenu convient-il à la ${level.gradeLabel} ?`, "La réponse indiquée est-elle exacte ?"].map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span><span>{item}</span></li>)}</ol>
      {first ? <section className="mt-9 border-l-2 border-primary pl-5 sm:pl-7"><div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><span className="font-semibold text-primary">Niveau cible · {level.gradeLabel}</span><span className="text-muted-foreground">{level.readerLabel}</span></div><h2 className="mt-3 text-2xl font-semibold">{first.candidate.generated.title}</h2><p className="mt-3 text-base leading-7 text-muted-foreground">{excerpt}{excerpt ? "…" : ""}</p></section> : <div className="mt-10 text-center"><BookOpenCheck className="mx-auto size-8 text-muted-foreground" /><p className="mt-3">Votre file d’évaluation est en préparation.</p></div>}
      <div className="mt-9 flex flex-wrap items-center gap-4"><Button asChild><Link href="/review/instructions">Lire les consignes et commencer <ArrowRight /></Link></Button><p className="text-xs text-muted-foreground">Une seule confirmation est nécessaire.</p></div>
    </div>;
  }

  const latestPassageAt = passageHistory.map((item) => item.submittedAt ?? "").sort().at(-1) ?? "";
  const latestExerciseAt = exerciseHistory[0]?.submittedAt ?? "";
  const hasPassage = unfinishedPassages.length > 0;
  const hasExercise = exerciseProgress.needsReview > 0;
  const recommendExercise = hasExercise && (!hasPassage || latestPassageAt >= latestExerciseAt);
  const nextPassage = draft ?? unfinishedPassages[0];
  const nextHref = recommendExercise ? "/review/exercises" : nextPassage ? `/review/${nextPassage.assignmentId}` : "/review/history";
  const completed = passageHistory.length + exerciseHistory.length;
  const total = queue.length + exerciseProgress.total;
  const remaining = unfinishedPassages.length + exerciseProgress.needsReview;
  const nextMilestone = Math.max(5, Math.ceil((completed + 1) / 5) * 5);
  const thanks = typeof query.thanks === "string";
  const recentNotification = notifications.find((item) => item.notification_type === "review_thanks");

  return <div className="mx-auto max-w-4xl pb-12 pt-3 sm:pt-7">
    {thanks && <div role="status" className="animate-in fade-in slide-in-from-top-2 mb-6 flex gap-3 border-l-2 border-[color:var(--success)] bg-[color:var(--success)]/8 px-4 py-4"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[color:var(--success)]" /><div><p className="font-semibold">Merci pour votre revue.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Votre regard aide Plume à proposer un français plus juste aux enfants. Chaque avis compte réellement.</p></div></div>}

    <header className="border-b border-border pb-7">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.15em] text-primary">Votre mission</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Bonjour {session.displayName?.split(" ")[0] ?? ""}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Une file variée, un contenu à la fois.</p></div><Button asChild variant="outline" size="sm"><Link href="/review/history"><History />Voir mon historique</Link></Button></div>
    </header>

    <section className="py-7" aria-label="Progression globale">
      <div className="flex items-end justify-between gap-4"><div><p className="text-3xl font-semibold tracking-tight">{completed}</p><p className="mt-1 text-sm text-muted-foreground">revue{completed === 1 ? "" : "s"} terminée{completed === 1 ? "" : "s"}</p></div><div className="text-right"><p className="text-sm font-semibold text-primary">{remaining} à découvrir</p><p className="mt-1 text-xs text-muted-foreground">sur {total} contenus attribués</p></div></div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${total ? Math.round(completed / total * 100) : 100}%` }} /></div>
      <p className="mt-3 text-xs font-medium text-primary">Encore {nextMilestone - completed} revue{nextMilestone - completed === 1 ? "" : "s"} avant votre prochain cap de {nextMilestone}.</p>
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-5"><ProgressLabel label="Textes" done={passageHistory.length} /><ProgressLabel label="Compréhension" done={exerciseHistory.filter((item) => item.sectionKey === "reading_comprehension").length} /><ProgressLabel label="Grammaire" done={exerciseHistory.filter((item) => item.sectionKey === "grammar").length} /><ProgressLabel label="Orthographe" done={exerciseHistory.filter((item) => item.sectionKey === "spelling").length} /><ProgressLabel label="Conjugaison" done={exerciseHistory.filter((item) => item.sectionKey === "conjugation").length} /></div>
    </section>

    {remaining > 0 ? <section className="border-y border-border py-7">
      <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">{recommendExercise ? <Languages /> : <BookOpenCheck />}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Prochaine revue recommandée</p><h2 className="mt-2 text-2xl font-semibold">{recommendExercise ? "Un exercice de français" : "Un texte et ses questions"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendExercise ? "La catégorie change au fil de la file : compréhension, grammaire, orthographe puis conjugaison." : draft ? "Votre brouillon vous attend exactement là où vous l’avez laissé." : "Lisez le passage comme un élève, puis évaluez sa clarté et ses questions."}</p><Button asChild className="mt-5"><Link href={nextHref}>{draft && !recommendExercise ? "Reprendre mon brouillon" : "Commencer cette revue"}<ArrowRight /></Link></Button></div></div>
    </section> : <section className="border-y border-border py-10 text-center"><CheckCircle2 className="mx-auto size-10 text-[color:var(--success)]" /><h2 className="mt-4 text-2xl font-semibold">Tout est terminé</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Merci. Votre contribution protège la qualité du français proposé aux enfants.</p></section>}

    <section className="mt-7 flex gap-3 rounded-lg bg-primary/7 px-4 py-4"><Sparkles className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Message de Plume</p><p className="mt-1 text-sm font-semibold">{recentNotification?.title ?? "Votre expertise a un impact concret"}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{recentNotification?.body ?? "Quelques minutes de votre temps peuvent éviter qu’une erreur soit répétée par des centaines d’enfants. Merci de continuer."}</p></div></section>
  </div>;
}

function ProgressLabel({ label, done }: { label: string; done: number }) {
  return <div><p className="font-semibold">{done}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}
