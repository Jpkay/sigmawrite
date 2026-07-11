import Link from "next/link";
import { ArrowRight, BookOpenCheck, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page";
import { requireActiveReviewer } from "@/lib/auth";
import { getReviewNotifications, getReviewerAccess, getReviewerQueue } from "@/lib/db/reviews";
import { difficultyBandLabel } from "@/lib/scoring/band";

const statusLabel = { assigned: "À commencer", draft: "Brouillon", submitted: "Validée" } as const;

export default async function ReviewQueuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireActiveReviewer();
  const [queue, access, notifications, params] = await Promise.all([getReviewerQueue(), getReviewerAccess(session.id), getReviewNotifications(), searchParams]);
  const filter = typeof params.status === "string" ? params.status : "pending";
  const band = typeof params.band === "string" ? params.band : "";
  const topic = typeof params.topic === "string" ? params.topic : "";
  const competency = typeof params.competency === "string" ? params.competency : "";
  const pending = queue.filter((item) => item.status === "assigned").length;
  const drafts = queue.filter((item) => item.status === "draft").length;
  const submitted = queue.filter((item) => item.status === "submitted").length;
  const durations = queue.flatMap((item) => item.review?.durationSeconds ? [item.review.durationSeconds] : []);
  const averageSeconds = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 8 * 60;
  const remainingMinutes = Math.ceil((pending + drafts) * averageSeconds / 60);
  const filters = queue.filter((item) => {
    if (filter === "pending" && item.status === "submitted") return false;
    if (["assigned", "draft", "submitted"].includes(filter) && item.status !== filter) return false;
    if (band && item.candidate.input.targetReadingBand !== band) return false;
    if (topic && item.candidate.input.topic !== topic) return false;
    if (competency && !item.candidate.input.targetSkills.includes(competency)) return false;
    return true;
  });
  const unique = (values: string[]) => [...new Set(values)].sort();
  const acknowledged = Boolean(access?.acknowledgedAt);

  return <>
    <PageHeader title="Mes textes à évaluer" description="Lisez chaque texte comme si vous le prépariez pour un élève. Votre travail reste indépendant de celui des autres évaluateurs." />
    {!acknowledged && <section className="mb-7 border-l-2 border-primary bg-primary/10 px-4 py-4" aria-label="Consignes requises"><p className="font-medium">Avant de commencer</p><p className="mt-1 text-sm text-muted-foreground">Prenez quelques minutes pour lire les consignes et confirmer que vous les avez comprises.</p><Button asChild className="mt-3"><Link href="/review/instructions">Lire les consignes</Link></Button></section>}
    {notifications.length>0&&<aside aria-label="Notifications" className="mb-7 divide-y divide-border border-y border-border">{notifications.map((notification)=><div key={notification.id} className="py-3"><p className="text-sm font-medium">{notification.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p></div>)}</aside>}

    <section aria-label="Progression" className="mb-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 sm:grid-cols-5">
      {[['Attribués',queue.length],['À commencer',pending],['Brouillons',drafts],['Validés',submitted],['Progression',`${queue.length ? Math.round(submitted/queue.length*100) : 0}%`]].map(([label,value]) => <div key={label}><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}
    </section>

    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><h2 className="text-lg font-semibold">File de travail</h2><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />Environ {remainingMinutes} min restantes</p></div>
      <form className="grid gap-2 sm:grid-cols-4" aria-label="Filtres">
        <select name="status" defaultValue={filter} aria-label="État" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="pending">À faire</option><option value="assigned">À commencer</option><option value="draft">Brouillons</option><option value="submitted">Validés</option><option value="all">Tous</option></select>
        <select name="band" defaultValue={band} aria-label="Niveau" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Tous les niveaux</option>{unique(queue.map((item) => item.candidate.input.targetReadingBand)).map((value) => <option key={value} value={value}>{difficultyBandLabel(value)}</option>)}</select>
        <select name="topic" defaultValue={topic} aria-label="Sujet" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Tous les sujets</option>{unique(queue.map((item) => item.candidate.input.topic)).map((value) => <option key={value}>{value}</option>)}</select>
        <select name="competency" defaultValue={competency} aria-label="Compétence" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Toutes les compétences</option>{unique(queue.flatMap((item) => item.candidate.input.targetSkills)).map((value) => <option key={value}>{value}</option>)}</select>
        <Button type="submit" variant="outline" className="sm:col-start-4">Filtrer</Button>
      </form>
    </div>

    {filters.length === 0 ? <div className="py-14 text-center"><BookOpenCheck className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">Aucun texte dans cette vue</p><p className="mt-1 text-sm text-muted-foreground">Modifiez les filtres ou revenez plus tard.</p></div> : <div className="divide-y divide-border border-y border-border">{filters.map((item) => {
      const words = item.candidate.generated.body.trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.ceil(words / 180));
      const href = acknowledged ? `/review/${item.assignmentId}` : "/review/instructions";
      return <article key={item.assignmentId} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{item.candidate.generated.title}</h3><Badge variant={item.status === "submitted" ? "success" : item.status === "draft" ? "secondary" : "outline"}>{statusLabel[item.status]}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{difficultyBandLabel(item.candidate.input.targetReadingBand)} · {item.candidate.input.topic} · {item.candidate.input.targetSkills[0] ?? "Compréhension"}</p><p className="mt-1 text-xs text-muted-foreground">Lecture ≈ {minutes} min · attribué le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(item.assignedAt))}</p></div>
        <Button asChild variant={item.status === "submitted" ? "outline" : "default"}><Link href={href}>{item.status === "assigned" ? "Commencer" : item.status === "draft" ? "Continuer" : "Consulter"}<ArrowRight /></Link></Button>
      </article>;
    })}</div>}
  </>;
}
