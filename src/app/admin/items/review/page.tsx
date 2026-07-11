import { PageHeader } from "@/components/page";
import { requireRole } from "@/lib/auth";
import { getCompetencyItems } from "@/lib/db/items";
import { ItemReviewQueue } from "./review-queue";

export default async function ItemReviewPage() {
  await requireRole(["platform_admin", "content_reviewer"]);
  const items = await getCompetencyItems({ status: "needs_human_review" });
  return <><PageHeader title="Exceptions des items" description="Contrôle Gate 4 : désaccord du juge, règle du validateur et résultat de chaque porte." /><ItemReviewQueue initialItems={items} /></>;
}
