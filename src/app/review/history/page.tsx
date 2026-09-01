import Link from "next/link";
import { ArrowLeft, BookOpenCheck, CheckCircle2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireActiveReviewer } from "@/lib/auth";
import { getReviewerExerciseHistory } from "@/lib/db/items";
import { getReviewerQueue } from "@/lib/db/reviews";
import { createServiceClient } from "@/lib/supabase/server";

const sectionLabels: Record<string, string> = { reading_comprehension: "Compréhension", grammar: "Grammaire", spelling: "Orthographe", conjugation: "Conjugaison" };
const decisionLabels: Record<string, string> = { approve: "Approuvé", approve_minor: "Approuvé avec réserves", needs_revision: "À réviser", reject: "Rejeté", human_approved: "Approuvé", rejected: "Rejeté" };

export default async function ReviewHistoryPage() {
  const reviewer = await requireActiveReviewer();
  const service = createServiceClient();
  const [passages, exercises] = await Promise.all([getReviewerQueue(reviewer.id, service), getReviewerExerciseHistory(reviewer.id, service)]);
  const rows = [
    ...passages.filter((item) => item.status === "submitted").map((item) => ({ id: item.assignmentId, type: "Texte", title: item.candidate.generated.title, decision: item.review?.decision ?? "", at: item.submittedAt ?? "", href: `/review/${item.assignmentId}`, editable: ["in_review", "review_complete"].includes(item.workflowStatus), icon: "passage" as const })),
    ...exercises.map((item) => ({ id: item.itemId, type: sectionLabels[item.sectionKey] ?? "Exercice", title: item.nodeLabel, decision: item.decision, at: item.submittedAt, href: `/review/exercises?item=${item.itemId}`, editable: true, icon: "exercise" as const })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return <div className="mx-auto max-w-3xl pb-12 pt-3 sm:pt-7">
    <Button asChild variant="ghost" size="sm"><Link href="/review"><ArrowLeft />Retour à ma mission</Link></Button>
    <header className="mt-5 border-b border-border pb-6"><p className="font-display text-xs font-semibold uppercase tracking-[0.15em] text-primary">Votre contribution</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Historique des revues</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Retrouvez vos décisions. Vous pouvez corriger un avis tant que le contenu n’a pas été définitivement publié.</p></header>
    {rows.length ? <ol className="divide-y divide-border">{rows.map((row) => <li key={`${row.icon}-${row.id}`} className="py-5"><Link href={row.href} className="group flex items-start gap-4"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">{row.icon === "passage" ? <BookOpenCheck className="size-4" /> : <Languages className="size-4" />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">{row.type}</span><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("fr", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Kigali" }).format(new Date(row.at))}</span></span><span className="mt-1 block font-semibold leading-6">{row.title}</span><span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="size-3.5 text-[color:var(--success)]" />{decisionLabels[row.decision] ?? row.decision} · {row.editable ? "Voir ou modifier" : "Voir en lecture seule"}</span></span></Link></li>)}</ol> : <p className="py-14 text-center text-sm text-muted-foreground">Votre première revue apparaîtra ici après validation.</p>}
  </div>;
}
