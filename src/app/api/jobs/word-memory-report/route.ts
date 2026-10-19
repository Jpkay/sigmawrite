import { authorizeJob, withJobRun } from "@/lib/jobs";
import { runWordMemoryReport } from "@/lib/vocabulary/jobs";

export const maxDuration = 300;

/** Weekly memory-quality report (roadmap 2026-10 C.6). */
export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const processed = await withJobRun("word_memory_report", async (db) => {
    const { processed: count } = await runWordMemoryReport(db);
    return { result: count, processed: count };
  });
  return Response.json({ ok: true, processed });
}
