import {PageHeader} from "@/components/page";
import {journalCurrentStudentPayload} from "@/lib/diagnostic/granular/server-delivery-journal";
import {StudentSettings} from "./settings-client";
import {settingsCopy} from "./settings-copy";

export default async function Page() {
  // Capture only the fixed copy sent to this client, never password state.
  // Runtime server errors remain a separate capture surface.
  await journalCurrentStudentPayload("student:settings-copy", settingsCopy);
  return <><PageHeader title={settingsCopy.pageTitle} description={settingsCopy.pageDescription}/><StudentSettings copy={settingsCopy}/></>;
}
