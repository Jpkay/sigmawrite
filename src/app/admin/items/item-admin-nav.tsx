import Link from "next/link";

export function ItemAdminNav() {
  return <nav aria-label="Qualité des exercices" className="mb-7 flex flex-wrap gap-2 border-b border-border pb-4 text-sm">
    <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/items/review">File à examiner</Link>
    <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/items/reviews">Avis des évaluateurs</Link>
    <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/admin/items">Banque d’exercices</Link>
  </nav>;
}
