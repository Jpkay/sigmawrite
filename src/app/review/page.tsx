import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpenCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireActiveReviewer } from "@/lib/auth";
import { getReviewerAccess, getReviewerQueue } from "@/lib/db/reviews";
import { targetLevelProfile } from "@/lib/scoring/band";

export default async function ReviewHomePage() {
  const session = await requireActiveReviewer();
  const [queue, access] = await Promise.all([getReviewerQueue(session.id), getReviewerAccess(session.id)]);
  const unfinished = queue.find((item) => item.status === "draft") ?? queue.find((item) => item.status === "assigned");

  if (access?.acknowledgedAt && unfinished) redirect(`/review/${unfinished.assignmentId}`);

  if (access?.acknowledgedAt) return <div className="mx-auto max-w-2xl py-14 text-center">
    <CheckCircle2 className="mx-auto size-10 text-[color:var(--success)]" />
    <h1 className="mt-5 text-3xl font-semibold tracking-tight">Toutes vos évaluations sont terminées</h1>
    <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Merci {session.displayName ?? ""}. Vos réponses ont bien été enregistrées et restent confidentielles.</p>
  </div>;

  const first = unfinished ?? queue[0];
  const level = targetLevelProfile(first?.candidate.input.targetReadingBand);
  const excerpt = first?.candidate.generated.body.trim().split(/\s+/).slice(0, 48).join(" ");

  return <div className="mx-auto max-w-3xl py-5 sm:py-10">
    <p className="text-sm font-medium text-primary">Bienvenue {session.displayName ?? ""}</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Votre première évaluation est prête</h1>
    <p className="mt-3 max-w-2xl text-muted-foreground">Lisez comme si vous prépariez ce texte pour un élève. Trois repères suffisent pour commencer.</p>

    <ol className="mt-8 grid gap-4 border-y border-border py-5 sm:grid-cols-3">
      {["Le français est-il naturel et clair ?", `Le texte convient-il à la ${level.gradeLabel} ?`, "Les questions ont-elles une réponse correcte ?"].map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span><span>{item}</span></li>)}
    </ol>

    {first ? <section className="mt-9 border-l-2 border-primary pl-5 sm:pl-7">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><span className="font-semibold text-primary">Niveau cible · {level.gradeLabel}</span><span className="text-muted-foreground">{level.readerLabel}</span></div>
      <h2 className="mt-3 text-2xl font-semibold">{first.candidate.generated.title}</h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{excerpt}{excerpt ? "…" : ""}</p>
    </section> : <div className="mt-10 text-center"><BookOpenCheck className="mx-auto size-8 text-muted-foreground" /><p className="mt-3">Aucun texte ne vous est encore attribué.</p></div>}

    <div className="mt-9 flex flex-wrap items-center gap-4">
      {first && <Button asChild><Link href="/review/instructions">Lire les consignes et commencer <ArrowRight /></Link></Button>}
      {first && <p className="text-xs text-muted-foreground">Une seule confirmation est nécessaire avant votre première évaluation.</p>}
    </div>
  </div>;
}
