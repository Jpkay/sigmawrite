import { PageHeader } from "@/components/page";
import { ItemReviewQueue } from "@/app/admin/items/review/review-queue";
import { requireActiveReviewer } from "@/lib/auth";
import {
  getAssignedCompetencyItems,
  getDiagnosticItemReviewCount,
  getDiagnosticItemReviewProgress,
} from "@/lib/db/items";
import { createServiceClient } from "@/lib/supabase/server";

const PAGE_SIZE = 24;
const sections = new Set(["reading_comprehension", "grammar", "spelling", "conjugation"]);
const tiers = new Set(["foundation", "core", "stretch"]);

type ExerciseReviewPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExerciseReviewPage({ searchParams }: ExerciseReviewPageProps) {
  const reviewer = await requireActiveReviewer();
  const query = await searchParams;
  const section = typeof query.section === "string" && sections.has(query.section) ? query.section : undefined;
  const difficultyTier = typeof query.tier === "string" && tiers.has(query.tier) ? query.tier : undefined;
  const itemId = typeof query.item === "string" ? query.item : undefined;
  const scope = "diagnostic" as const;
  const requestedPage = typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const service = createServiceClient();
  const [items, filteredTotal, progress] = await Promise.all([
    getAssignedCompetencyItems({ reviewerProfileId: reviewer.id, section, difficultyTier, itemId, includeSubmitted: Boolean(itemId), offset: itemId ? 0 : (page - 1) * PAGE_SIZE, limit: itemId ? 1 : PAGE_SIZE }, service),
    getDiagnosticItemReviewCount({ section, difficultyTier, reviewerProfileId: reviewer.id }, service),
    getDiagnosticItemReviewProgress(service, reviewer.id),
  ]);
  const pageCount = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  return <>
    <PageHeader
      eyebrow="Qualité pédagogique"
      title={itemId ? "Revoir ma décision" : "Revue des exercices"}
      description={itemId ? "Corrigez votre avis puis enregistrez-le de nouveau." : "Un exercice à la fois. Vérifiez sa clarté, sa réponse et son niveau, puis passez au suivant."}
    />
    <ItemReviewQueue
      scope={scope}
      initialItems={items}
      progress={progress}
      filters={{ section: section ?? "", tier: difficultyTier ?? "" }}
      pagination={{ page: Math.min(page, pageCount), pageCount, filteredTotal }}
      basePath="/review/exercises"
      showExport={false}
      showScopeSwitch={false}
      reviewerMode
    />
  </>;
}
