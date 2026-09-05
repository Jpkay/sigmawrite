import { PageHeader } from "@/components/page";
import { StudentInbox } from "./inbox-client";

export default function Page() {
  return <><PageHeader eyebrow="Messages" title="Boîte de réception" description="Rappels de révision, bilans et messages de ton enseignant." /><StudentInbox /></>;
}
