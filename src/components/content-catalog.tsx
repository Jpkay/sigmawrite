import Link from "next/link";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { submitTeacherContentFeedback } from "@/lib/actions/teacher-content";
import { getTeacherContent, teacherContentKind, TEACHER_CONTENT_PAGE_SIZE } from "@/lib/db/teacher-content";

const labels = { lesson: "Leçons", passage: "Textes revus", exercise: "Exercices" };

export async function ContentCatalog({ query, audience }: {
  query: Record<string, string | string[] | undefined>;
  audience: "teacher" | "admin";
}) {
  const kind = teacherContentKind(query.kind);
  const requestedPage = typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { rows, count } = await getTeacherContent(kind, page);
  const pageCount = Math.max(1, Math.ceil(count / TEACHER_CONTENT_PAGE_SIZE));
  const basePath = audience === "admin" ? "/admin/catalogue" : "/teacher/content";

  return <>
    <PageHeader eyebrow="Ressources pédagogiques" title={audience === "admin" ? "Catalogue pédagogique" : "Contenus pour enseignants"} description={audience === "admin" ? "Consultez les leçons, textes revus et exercices disponibles pour les enseignants." : "Consultez les contenus disponibles et signalez une observation à l’équipe éditoriale."} />
    {audience === "teacher" && query.sent === "1" && <p role="status" className="mb-5 border-l-2 border-primary bg-primary/5 px-4 py-3 text-sm">Votre observation a été transmise.</p>}
    <nav aria-label="Types de contenus" className="mb-7 flex flex-wrap gap-2">
      {(["lesson", "passage", "exercise"] as const).map((value) => <Link key={value} href={`${basePath}?kind=${value}`} aria-current={kind === value ? "page" : undefined} className={`rounded-md border px-4 py-2 text-sm ${kind === value ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border"}`}>{labels[value]}</Link>)}
    </nav>
    {rows.length ? <div className="space-y-5">{rows.map((row) => <article key={row.id} className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-lg font-semibold">{row.title}</h2><span className="text-xs text-muted-foreground">{row.status === "auto_approved" ? "Validation automatique" : row.status === "published_pending_review" || row.status === "needs_human_review" ? "Publié, revue en cours" : "Revue humaine"}</span></div>
      <details className="mt-3"><summary className="cursor-pointer text-sm font-medium text-primary">Lire le contenu</summary><div className="mt-4 space-y-3 whitespace-pre-wrap text-sm leading-6">{row.body.map((part, index) => <p key={index}>{part}</p>)}</div></details>
      {kind === "passage" && <div className="mt-4 border-l-2 border-border pl-4"><h3 className="text-sm font-semibold">Avis de revue</h3>{row.reviewSummary.length ? <ul className="mt-2 space-y-2 text-sm text-muted-foreground">{row.reviewSummary.map((note, index) => <li key={index} className="whitespace-pre-wrap">{note}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">Aucun commentaire écrit disponible.</p>}</div>}
      {audience === "teacher" && <form action={submitTeacherContentFeedback} className="mt-5 border-t border-border pt-4">
        <input type="hidden" name="kind" value={row.targetKind} /><input type="hidden" name="id" value={row.releaseId ? "" : row.id} />
        <input type="hidden" name="releaseId" value={row.releaseId ?? ""} /><input type="hidden" name="contentKey" value={row.contentKey ?? ""} />
        <label htmlFor={`comment-${row.id}`} className="block text-sm font-medium">Signaler une observation</label>
        <textarea id={`comment-${row.id}`} name="comment" required minLength={3} maxLength={2000} rows={2} className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="Décrivez le point à vérifier ou à améliorer." />
        <Button type="submit" size="sm" variant="outline" className="mt-2">Envoyer l’observation</Button>
      </form>}
    </article>)}</div> : <p className="border-y border-border py-8 text-sm text-muted-foreground">Aucun contenu disponible dans cette catégorie.</p>}
    <nav aria-label="Pages de contenus" className="mt-8 flex items-center justify-between text-sm">
      {page > 1 ? <Link href={`${basePath}?kind=${kind}&page=${page - 1}`} className="text-primary">Précédent</Link> : <span />}
      <span>Page {page} sur {pageCount}</span>
      {page < pageCount ? <Link href={`${basePath}?kind=${kind}&page=${page + 1}`} className="text-primary">Suivant</Link> : <span />}
    </nav>
  </>;
}
