import { PageHeader } from "@/components/page";
import { requireActiveReviewer, requireRole } from "@/lib/auth";
import { getCompetencyItems, getDiagnosticItemAssignmentOverview, getDiagnosticItemReviewCount, getDiagnosticItemReviewProgress, getTaxonomyV3PracticeReviewData } from "@/lib/db/items";
import { ItemReviewQueue } from "./review-queue";
import { curriculumTagsFor } from "@/lib/curriculum/tags";
import { createClient } from "@/lib/supabase/server";
import { ItemAssignmentManager } from "./item-assignment-manager";
import { ItemAdminNav } from "../item-admin-nav";
import { reviewHourItemIds } from "@/lib/diagnostic/review-hour-plan";

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
  const scope = query.scope === "practice-v3" ? "practice-v3" : "diagnostic";
  const plan = query.plan === "review-hour" && scope === "diagnostic";
  const section = !plan && typeof query.section === "string" && sections.has(query.section) ? query.section : undefined;
  const difficultyTier = !plan && typeof query.tier === "string" && tiers.has(query.tier) ? query.tier : undefined;
  const planIds = plan ? reviewHourItemIds : undefined;
  const requestedPage = typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const reviewData = scope === "practice-v3"
    ? await getTaxonomyV3PracticeReviewData({ section, difficultyTier, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
    : null;
  const [items, filteredTotal, progress] = reviewData
    ? [reviewData.items, reviewData.filteredTotal, reviewData.progress]
    : await Promise.all([
      getCompetencyItems({ status: "needs_human_review", promptVersion: "diagnostic-bank-v2", section, difficultyTier, ids: planIds, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
      getDiagnosticItemReviewCount({ section, difficultyTier, ids: planIds }),
      getDiagnosticItemReviewProgress(undefined, undefined, planIds),
    ]);
  // Reviewers asked "for which level is this?": attach the programme attendus to every item (roadmap 4.2).
  const tagsByNode = await createClient().then((db) => curriculumTagsFor(db, [...new Set(items.map((item) => item.nodeKey))])).catch(() => new Map());
  const taggedItems = items.map((item) => ({ ...item, curriculumTags: tagsByNode.get(item.nodeKey) ?? [] }));
  const pageCount = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const assignmentOverview = reviewer.role === "platform_admin" && scope === "diagnostic"
    ? await getDiagnosticItemAssignmentOverview()
    : null;
  return <>
    <PageHeader eyebrow={plan ? "Priorité lancement · Le parcours prévu pour une heure" : undefined} title={plan ? "Terminer la relecture avant lancement" : scope === "practice-v3" ? "Relire les exercices d’entraînement" : "Relire les exercices du diagnostic"} description={plan ? "Cette sélection couvre le minimum de relecture du diagnostic pour un lancement partiel. Essayez chaque exercice, puis approuvez-le ou signalez un problème." : "Essayez chaque exercice, consultez le corrigé, puis donnez votre avis."} />
    <ItemReviewQueue key={`${scope}:${section}:${difficultyTier}:${plan}:${page}:${query.batch ?? ""}`} scope={scope} initialItems={taggedItems} progress={progress} filters={{ section: section ?? "", tier: difficultyTier ?? "", plan }} pagination={{ page, pageCount, filteredTotal }} />
    <details className="mx-auto mt-6 max-w-3xl border-t border-border py-4"><summary className="cursor-pointer text-sm text-muted-foreground">Gérer la banque et les attributions</summary><ItemAdminNav />{assignmentOverview && <ItemAssignmentManager overview={assignmentOverview} />}</details>
  </>;
}
