import LegacyDiagnostic from "./legacy-diagnostic";
import {GranularDiagnostic} from "@/components/diagnostic/granular-diagnostic";
import {requireRole} from "@/lib/auth";
import {createClient,createServiceClient} from "@/lib/supabase/server";
import {getCurrentStudentId} from "@/lib/db/student";
import {DIAGNOSTIC_PROTOCOL_VERSION} from "@/lib/diagnostic/protocol";
import {selectGranularRuntime} from "@/lib/diagnostic/granular/runtime-selection";
export default async function DiagnosticPage({searchParams}:{searchParams:Promise<{activity?:string|string[];restart?:string|string[]}>}){
 if(process.env.GRANULAR_DIAGNOSTIC_ENABLED!=="true")return <LegacyDiagnostic/>;
 await requireRole(["student"]);
 const params=await searchParams,client=await createClient();
 const studentId=await getCurrentStudentId(client);
 const [legacy,granular]=await Promise.all([
  client.from("diagnostic_runs").select("id").eq("student_id",studentId).eq("status","completed").eq("protocol_version",DIAGNOSTIC_PROTOCOL_VERSION).limit(1).maybeSingle(),
  createServiceClient().from("granular_assessment_sessions").select("id,granular_assessment_releases!inner(status)").eq("student_id",studentId).eq("granular_assessment_releases.status","published").limit(1).maybeSingle(),
 ]);
 if(legacy.error||granular.error)throw Error("Impossible de retrouver ton diagnostic. Réessaie.");
 const selected=selectGranularRuntime({enabled:true,hasLegacyResult:!!legacy.data,hasGranularSession:!!granular.data,restart:params.restart==="1"});
 const activityId=typeof params.activity==="string"?params.activity:undefined;
 return selected?<GranularDiagnostic initialActivityId={activityId}/>:<LegacyDiagnostic/>;
}
