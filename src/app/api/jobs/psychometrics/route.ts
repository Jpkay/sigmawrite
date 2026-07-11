import{authorizeJob,runPsychometricAnalysis,withJobRun}from"@/lib/jobs";
export async function GET(request:Request){if(!authorizeJob(request))return Response.json({error:"unauthorized"},{status:401});const processed=await withJobRun("psychometrics",async db=>{const count=await runPsychometricAnalysis(db);return{result:count,processed:count};});return Response.json({ok:true,processed});}
