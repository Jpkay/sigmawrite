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
  const scope = "diagnostic" as const;
  const requestedPage = typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const service = createServiceClient();
  const [items, filteredTotal, progress] = await Promise.all([
    getAssignedCompetencyItems({ reviewerProfileId: reviewer.id, section, difficultyTier, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }, service),
    getDiagnosticItemReviewCount({ section, difficultyTier, reviewerProfileId: reviewer.id }, service),
    getDiagnosticItemReviewProgress(service, reviewer.id),
  ]);
  const pageCount = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  return <>
    <PageHeader
      eyebrow="Qualité pédagogique"
      title="Revue des exercices"
      description="Vérifiez l’énoncé, la réponse, le niveau et les contrôles des exercices de grammaire, conjugaison, orthographe et compréhension."
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
    />
  </>;
}
