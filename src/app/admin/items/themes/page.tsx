import { requireRole } from "@/lib/auth";
import { getCompetencyItems } from "@/lib/db/items";
import { PageHeader } from "@/components/page";
import { ItemReviewQueue } from "../review/review-queue";
import { ItemAdminNav } from "../item-admin-nav";

export default async function ThemedExerciseReview() {
  await requireRole(["platform_admin"]);
  const all = await getCompetencyItems({ interestOnly: true, limit: 500 });
  const pending = all.filter((item) => item.reviewStatus === "needs_human_review");
  return <>
    <PageHeader title="Des exercices autour de leurs intérêts" description="Football, musique, jeux vidéo, animaux, espace et cuisine. Après approbation, ces exercices rejoignent l’entraînement adapté au niveau de l’élève." />
    <ItemAdminNav />
    <ItemReviewQueue scope="practice-v3" initialItems={pending} progress={{ total: all.length, needsReview: pending.length, humanApproved: all.filter((item) => item.reviewStatus === "human_approved").length, autoApproved: 0, rejected: all.filter((item) => item.reviewStatus === "rejected").length }} filters={{ section: "", tier: "" }} pagination={{ page: 1, pageCount: 1, filteredTotal: pending.length }} basePath="/admin/items/themes" showExport={false} showScopeSwitch={false} showFilters={false} />
  </>;
}
