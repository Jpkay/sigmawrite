import { PageHeader } from "@/components/page";
import { requireActiveReviewer, requireRole } from "@/lib/auth";
import { getCompetencyItems, getDiagnosticItemReviewCount, getDiagnosticItemReviewProgress } from "@/lib/db/items";
import { ItemReviewQueue } from "./review-queue";

const PAGE_SIZE = 24;
const sections = new Set(["reading_comprehension", "grammar", "spelling", "conjugation"]);
const tiers = new Set(["foundation", "core", "stretch"]);
type ReviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ItemReviewPage({ searchParams }: ReviewPageProps) {
  const reviewer = await requireRole(["platform_admin", "content_reviewer"]);
  if (reviewer.role === "content_reviewer") await requireActiveReviewer();
  const query = await searchParams;
  const section = typeof query.section === "string" && sections.has(query.section) ? query.section : undefined;
  const difficultyTier = typeof query.tier === "string" && tiers.has(query.tier) ? query.tier : undefined;
  const requestedPage = typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const [items, filteredTotal, progress] = await Promise.all([
    getCompetencyItems({ status: "needs_human_review", promptVersion: "diagnostic-bank-v2", section, difficultyTier, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
    getDiagnosticItemReviewCount({ section, difficultyTier }),
    getDiagnosticItemReviewProgress(),
  ]);
  const pageCount = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  return <><PageHeader title="Revue du diagnostic v2" description="Vérifie l’énoncé, la réponse, le niveau et les contrôles avant toute publication aux élèves." /><ItemReviewQueue initialItems={items} progress={progress} filters={{ section: section ?? "", tier: difficultyTier ?? "" }} pagination={{ page: Math.min(page, pageCount), pageCount, filteredTotal }} /></>;
}
