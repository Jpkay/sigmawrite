import { authorizeJob, withJobRun } from "@/lib/jobs";
import { runFsrsCalibration } from "@/lib/vocabulary/jobs";

export const maxDuration = 300;

/** Offline FSRS parameter fitting and calibration report (roadmap 2026-10 C.3). */
export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const processed = await withJobRun("fsrs_calibration", async (db) => {
    const { processed: count } = await runFsrsCalibration(db);
    return { result: count, processed: count };
  });
  return Response.json({ ok: true, processed });
}
