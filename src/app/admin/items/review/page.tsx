import { PageHeader } from "@/components/page";
import { requireActiveReviewer, requireRole } from "@/lib/auth";
import { getCompetencyItems, getDiagnosticItemAssignmentOverview, getDiagnosticItemReviewCount, getDiagnosticItemReviewProgress, getTaxonomyV3PracticeReviewData } from "@/lib/db/items";
import { ItemReviewQueue } from "./review-queue";
import { ItemAssignmentManager } from "./item-assignment-manager";
import { ItemAdminNav } from "../item-admin-nav";

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
  const scope = query.scope === "practice-v3" ? "practice-v3" : "diagnostic";
  const requestedPage = typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const reviewData = scope === "practice-v3"
    ? await getTaxonomyV3PracticeReviewData({ section, difficultyTier, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
    : null;
  const [items, filteredTotal, progress] = reviewData
    ? [reviewData.items, reviewData.filteredTotal, reviewData.progress]
    : await Promise.all([
      getCompetencyItems({ status: "needs_human_review", promptVersion: "diagnostic-bank-v2", section, difficultyTier, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
      getDiagnosticItemReviewCount({ section, difficultyTier }),
      getDiagnosticItemReviewProgress(),
    ]);
  const pageCount = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const assignmentOverview = reviewer.role === "platform_admin" && scope === "diagnostic"
    ? await getDiagnosticItemAssignmentOverview()
    : null;
  return <><PageHeader title={scope === "practice-v3" ? "Validation de la pratique v3" : "Revue du diagnostic v2"} description={scope === "practice-v3" ? "Valide uniquement les exercices nécessaires pour ouvrir chaque compétence contrôlée aux élèves." : "Vérifie l’énoncé, la réponse, le niveau et les contrôles avant toute publication aux élèves."} /><ItemAdminNav />{assignmentOverview && <ItemAssignmentManager overview={assignmentOverview} />}<ItemReviewQueue scope={scope} initialItems={items} progress={progress} filters={{ section: section ?? "", tier: difficultyTier ?? "" }} pagination={{ page: Math.min(page, pageCount), pageCount, filteredTotal }} /></>;
}
