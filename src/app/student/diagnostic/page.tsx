import LegacyDiagnostic from "./legacy-diagnostic";
import {GranularDiagnostic} from "@/components/diagnostic/granular-diagnostic";
export default async function DiagnosticPage({searchParams}:{searchParams:Promise<{activity?:string|string[]}>}){
 const params=await searchParams;
 const activityId=typeof params.activity==="string"?params.activity:undefined;
 return process.env.GRANULAR_DIAGNOSTIC_ENABLED==="true"?<GranularDiagnostic initialActivityId={activityId}/>:<LegacyDiagnostic/>;
}
