import { authorizeJob, withJobRun } from "@/lib/jobs";
import { runDailyAudit } from "@/lib/content/editorial/audit-runner";
import { editorialLLM } from "@/lib/content/editorial/runtime";

export const maxDuration = 300;

/** Daily H.15 audit: sample + reported chapters, alerts, automatic switch to library texts. */
export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const result = await withJobRun("editorial_audit", async (db) => {
    const result = await runDailyAudit(db, editorialLLM());
    return { result, processed: result.audited };
  });
  return Response.json(result);
}
