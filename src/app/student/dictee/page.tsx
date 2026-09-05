import { PageHeader } from "@/components/page";
import { DictationCatalog } from "./catalog-client";

export default function Page() {
  return <><PageHeader eyebrow="Orthographe" title="Dictées" description="Écoute, écris, puis justifie chaque correction. Cinq à dix minutes suffisent." /><DictationCatalog /></>;
}
