import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, MessageSquareText, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { getAdminCompetencyReviewResults } from "@/lib/db/items";
import { createServiceClient } from "@/lib/supabase/server";
import { ItemAdminNav } from "../item-admin-nav";

const PAGE_SIZE = 50;
const sectionLabels: Record<string, string> = {
  reading_comprehension: "Compréhension",
  grammar: "Grammaire",
  spelling: "Orthographe",
  conjugation: "Conjugaison",
};
const tierLabels: Record<string, string> = { foundation: "Fondation", core: "Intermédiaire", stretch: "Avancé" };

type ReviewResultsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function resultsHref(filters: { reviewer: string; section: string; decision: string }, page: number) {
  const params = new URLSearchParams();
  if (filters.reviewer) params.set("reviewer", filters.reviewer);
  if (filters.section) params.set("section", filters.section);
  if (filters.decision) params.set("decision", filters.decision);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/items/reviews${query ? `?${query}` : ""}`;
}

export default async function ExerciseReviewResultsPage({ searchParams }: ReviewResultsPageProps) {
  await requireRole(["platform_admin"]);
  const query = await searchParams;
  const reviewer = valueOf(query.reviewer);
  const sectionCandidate = valueOf(query.section);
  const section = Object.hasOwn(sectionLabels, sectionCandidate) ? sectionCandidate : "";
  const decisionCandidate = valueOf(query.decision);
  const decision = decisionCandidate === "human_approved" || decisionCandidate === "rejected" ? decisionCandidate : "";
  const requestedPage = Number.parseInt(valueOf(query.page), 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const service = createServiceClient();
  const [{ rows, total }, { data: reviewerRows, error: reviewerError }] = await Promise.all([
    getAdminCompetencyReviewResults({
      reviewerProfileId: reviewer || undefined,
      section: section || undefined,
      decision: decision || undefined,
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    }, service),
    service.from("content_reviewer_profiles")
      .select("profile_id,profiles!content_reviewer_profiles_profile_id_fkey(display_name)")
      .order("created_at"),
  ]);
  if (reviewerError) throw new Error(reviewerError.message);
  const reviewers = (reviewerRows ?? []).map((row) => ({
    id: row.profile_id as string,
    name: (row.profiles as unknown as { display_name: string | null } | null)?.display_name ?? "Évaluateur",
  }));
  const filters = { reviewer, section, decision };
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return <>
    <PageHeader
      eyebrow="Qualité des exercices"
      title="Avis des évaluateurs"
      description="Consultez qui a validé ou rejeté chaque exercice, avec son commentaire et la version retenue."
      action={<Badge variant="outline">{total} avis</Badge>}
    />
    <ItemAdminNav />

    <form className="grid gap-3 border-b border-border pb-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
      <select name="reviewer" defaultValue={reviewer} aria-label="Évaluateur" className="h-11 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">Tous les évaluateurs</option>
        {reviewers.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
      <select name="section" defaultValue={section} aria-label="Catégorie" className="h-11 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">Toutes les catégories</option>
        {Object.entries(sectionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <select name="decision" defaultValue={decision} aria-label="Décision" className="h-11 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">Toutes les décisions</option>
        <option value="human_approved">Approuvés</option>
        <option value="rejected">Rejetés</option>
      </select>
      <Button type="submit">Filtrer</Button>
      <Button asChild type="button" variant="ghost"><Link href="/admin/items/reviews">Effacer</Link></Button>
    </form>

    {rows.length ? <ol className="divide-y divide-border border-b border-border">
      {rows.map((row) => {
        const approved = row.decision === "human_approved";
        return <li key={row.assignmentId} className="py-6">
          <article className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.55fr)]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={approved ? "success" : "outline"}>{approved ? "Approuvé" : "Rejeté"}</Badge>
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">{sectionLabels[row.sectionKey] ?? "Exercice"}</span>
                <span className="text-xs text-muted-foreground">{tierLabels[row.difficultyTier] ?? row.difficultyTier}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-7">{row.nodeLabel}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Par <span className="font-medium text-foreground">{row.reviewerName}</span> · {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Kigali" }).format(new Date(row.submittedAt))}</p>
              <details className="group mt-4">
                <summary className="cursor-pointer text-sm font-medium text-primary marker:text-muted-foreground">Voir l’exercice retenu</summary>
                <div className="mt-3 border-l-2 border-border pl-4 text-sm leading-6">
                  <p className="whitespace-pre-wrap">{row.promptFr}</p>
                  {row.correctAnswer && <p className="mt-3 text-muted-foreground"><span className="font-medium text-foreground">Réponse attendue :</span> {row.correctAnswer}</p>}
                  <p className="mt-3 font-mono text-[10px] text-muted-foreground">{row.itemId}</p>
                </div>
              </details>
            </div>
            <aside className="border-l-2 border-border pl-4 lg:self-start">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground"><MessageSquareText className="size-4" />Commentaire</p>
              {row.reviewNote ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{row.reviewNote}</p> : <p className="mt-3 text-sm italic leading-6 text-muted-foreground">Aucun commentaire laissé.</p>}
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">{approved ? <CheckCircle2 className="size-4 text-[color:var(--success)]" /> : <XCircle className="size-4 text-destructive" />}{approved ? "Disponible pour les élèves" : "Exclu de la sélection élève"}</p>
            </aside>
          </article>
        </li>;
      })}
    </ol> : <div className="border-b border-border py-16 text-center"><MessageSquareText className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">Aucun avis ne correspond à ces filtres.</p><p className="mt-1 text-sm text-muted-foreground">Les nouvelles revues apparaîtront ici dès leur validation.</p></div>}

    {pageCount > 1 && <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4">
      <Button asChild size="sm" variant="outline"><Link aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""} href={resultsHref(filters, Math.max(1, page - 1))}><ChevronLeft />Précédente</Link></Button>
      <p className="text-sm text-muted-foreground">Page {Math.min(page, pageCount)} sur {pageCount}</p>
      <Button asChild size="sm" variant="outline"><Link aria-disabled={page >= pageCount} className={page >= pageCount ? "pointer-events-none opacity-50" : ""} href={resultsHref(filters, Math.min(pageCount, page + 1))}>Suivante<ChevronRight /></Link></Button>
    </nav>}
  </>;
}
