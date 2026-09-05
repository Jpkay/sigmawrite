import { PageHeader } from "@/components/page";
import { loadAdminDictations } from "@/lib/actions/dictations-admin";
import { DictationReviewTable } from "./review-table";

export default async function Page() {
  const rows = await loadAdminDictations();
  return <><PageHeader eyebrow="Contenu" title="Dictées" description="Relecture humaine des textes, puis rendu de l’audio. Un texte n’est visible des élèves qu’une fois approuvé et sonorisé." /><DictationReviewTable rows={rows} /></>;
}
