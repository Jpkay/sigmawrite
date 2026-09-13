import {DIAGNOSTIC_COPY} from "@/components/diagnostic/diagnostic-copy";
import {journalStudentPayload} from "@/lib/diagnostic/granular/server-delivery-journal";
import LegacyDiagnostic from "./legacy-diagnostic";
import {GranularDiagnostic} from "@/components/diagnostic/granular-diagnostic";
import {requireRole} from "@/lib/auth";
import {createClient,createServiceClient} from "@/lib/supabase/server";
import {getCurrentStudentId} from "@/lib/db/student";
import {DIAGNOSTIC_PROTOCOL_VERSION} from "@/lib/diagnostic/protocol";
import {selectGranularRuntime} from "@/lib/diagnostic/granular/runtime-selection";
import {legacyDiagnosticFixedDisplay} from "@/lib/diagnostic/granular/legacy-diagnostic-display";
export default async function DiagnosticPage({searchParams}:{searchParams:Promise<{activity?:string|string[];restart?:string|string[]}>}){
 await requireRole(["student"]);
 const params=await searchParams,client=await createClient();
 const studentId=await getCurrentStudentId(client);
 if(process.env.GRANULAR_DIAGNOSTIC_ENABLED!=="true"){
  await journalStudentPayload(studentId,"legacy:diagnostic-ui-copy",legacyDiagnosticFixedDisplay());
  return <LegacyDiagnostic/>;
 }
 const [legacy,granular]=await Promise.all([
  client.from("diagnostic_runs").select("id").eq("student_id",studentId).eq("status","completed").eq("protocol_version",DIAGNOSTIC_PROTOCOL_VERSION).limit(1).maybeSingle(),
  createServiceClient().from("granular_assessment_sessions").select("id,granular_assessment_releases!inner(status)").eq("student_id",studentId).eq("granular_assessment_releases.status","published").limit(1).maybeSingle(),
 ]);
 if(legacy.error||granular.error)throw Error("Impossible de retrouver ton diagnostic. Réessaie.");
 const selected=selectGranularRuntime({enabled:true,hasLegacyResult:!!legacy.data,hasGranularSession:!!granular.data,restart:params.restart==="1"});
 const activityId=typeof params.activity==="string"?params.activity:undefined;
 if(selected)await journalStudentPayload(studentId,"granular:ui-copy",DIAGNOSTIC_COPY);
 else await journalStudentPayload(studentId,"legacy:diagnostic-ui-copy",legacyDiagnosticFixedDisplay());
 return selected?<GranularDiagnostic initialActivityId={activityId}/>:<LegacyDiagnostic/>;
}
