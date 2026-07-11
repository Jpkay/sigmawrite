import { authorizeJob, refreshRetrievalDue, withJobRun } from "@/lib/jobs";

export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const processed = await withJobRun("retrieval_due", async (db) => { const count = await refreshRetrievalDue(db); return { result: count, processed: count }; });
  return Response.json({ ok: true, processed });
}
