import { authorizeJob, withJobRun } from "@/lib/jobs";
import { processPassageAutomation } from "@/lib/content/automation/worker";
export const maxDuration = 300;
export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({error:"unauthorized"},{status:401});
  const result = await withJobRun("passage_automation",async db=>{
    const result=await processPassageAutomation(db);
    return {result,processed:result.results.length};
  });
  return Response.json(result);
}
