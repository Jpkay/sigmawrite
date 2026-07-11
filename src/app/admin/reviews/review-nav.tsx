import Link from "next/link";

export function ReviewAdminNav() {
  return <nav aria-label="Administration des évaluations" className="mb-7 flex flex-wrap gap-2 border-b border-border pb-4 text-sm">
    <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/reviews">Vue d’ensemble</Link>
    <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/reviews/assign">Attribution</Link>
    <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/reviews/disagreements">Désaccords</Link>
    <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/reviews/reviewers">Évaluateurs</Link>
    <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/benchmarks">Références</Link>
    <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/reviews/export">Exporter CSV</Link>
  </nav>;
}
