import {INBOX_COPY} from "@/lib/diagnostic/granular/inbox-display";
import {journalStudentPayload} from "@/lib/diagnostic/granular/server-delivery-journal";
import {requireRole} from "@/lib/auth";
import {getCurrentStudentId} from "@/lib/db/student";
import {createClient,isSupabaseConfigured} from "@/lib/supabase/server";
import {StudentPageHeader as PageHeader} from "@/components/student-page-header";
import { StudentInbox } from "./inbox-client";

export default async function Page() {
  let owner="local";
  if(isSupabaseConfigured){await requireRole(["student"]);owner=await getCurrentStudentId(await createClient());await journalStudentPayload(owner,"student:inbox-copy",INBOX_COPY); }
  return <><PageHeader boundary="student:inbox-header" eyebrow="Messages" title="Boîte de réception" description="Rappels de révision, bilans et messages de ton enseignant." /><StudentInbox key={owner} copy={INBOX_COPY}/></>;
}
