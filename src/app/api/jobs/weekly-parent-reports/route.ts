import { authorizeJob, generateWeeklyParentReports, withJobRun } from "@/lib/jobs";

export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const processed = await withJobRun("weekly_parent_reports", async (db) => { const count = await generateWeeklyParentReports(db); return { result: count, processed: count }; });
  return Response.json({ ok: true, processed });
}
