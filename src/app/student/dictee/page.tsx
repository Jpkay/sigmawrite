import {StudentPageHeader as PageHeader} from "@/components/student-page-header";
import { DictationCatalog } from "./catalog-client";

export default function Page() {
  return <><PageHeader boundary="student:dictation-header" eyebrow="Orthographe" title="Dictées" description="Écoute, écris, puis justifie chaque correction. Cinq à dix minutes suffisent." /><DictationCatalog /></>;
}
