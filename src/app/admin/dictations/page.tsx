import { PageHeader } from "@/components/page";
import { loadAdminDictations } from "@/lib/actions/dictations-admin";
import { DictationReviewTable } from "./review-table";

export default async function Page() {
  const rows = await loadAdminDictations();
  return <><PageHeader eyebrow="Contenu" title="Dictées" description="Les dictées sont publiées automatiquement quand elles réussissent les vérifications, puis sonorisées. Cette page sert à l’audit et au retrait immédiat." /><DictationReviewTable rows={rows} /></>;
}
