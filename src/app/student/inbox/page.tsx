import {StudentPageHeader as PageHeader} from "@/components/student-page-header";
import { StudentInbox } from "./inbox-client";

export default function Page() {
  return <><PageHeader boundary="student:inbox-header" eyebrow="Messages" title="Boîte de réception" description="Rappels de révision, bilans et messages de ton enseignant." /><StudentInbox /></>;
}
