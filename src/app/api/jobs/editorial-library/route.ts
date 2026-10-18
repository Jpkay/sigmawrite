import { authorizeJob, withJobRun } from "@/lib/jobs";
import { getAIProvider } from "@/lib/ai";
import { speechToTextFromEnv } from "@/lib/content/editorial/audio-check";
import { planFallbackJobs, runLibraryJob, type LibraryJob } from "@/lib/content/editorial/library-runner";
import { editorialGateDeps, editorialLLM } from "@/lib/content/editorial/runtime";

export const maxDuration = 300;

/**
 * Library mode in small hourly batches (H.14/H.16/H.17). Off unless
 * EDITORIAL_LIBRARY_JOB=true (it spends model budget). Coverage-driven passage
 * and dictée jobs come from scripts/editorial-library.mts (interest-coverage
 * gaps); this job keeps the fallback-chapter pool filled.
 */
export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (process.env.EDITORIAL_LIBRARY_JOB !== "true") return Response.json({ skipped: "EDITORIAL_LIBRARY_JOB is not enabled" });
  const llm = editorialLLM();
  if (!llm) return Response.json({ skipped: "editorial provider not configured" });
  const result = await withJobRun("editorial_library", async (db) => {
    const { data: interests } = await db.from("student_interests").select("interest_key").limit(5000);
    const counts = new Map<string, number>();
    for (const row of interests ?? []) counts.set(row.interest_key as string, (counts.get(row.interest_key as string) ?? 0) + 1);
    const popular = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([key]) => key);
    const { data: existing } = await db.from("editorial_library_items").select("interest,grade_band").eq("kind", "fallback_chapter").eq("status", "published");
    const jobs: LibraryJob[] = planFallbackJobs(popular, (existing ?? []).map((e) => ({ interest: e.interest as string, gradeBand: e.grade_band as string })), 3, Number(process.env.EDITORIAL_LIBRARY_BATCH ?? 2));
    const results = [];
    for (const job of jobs) results.push(await runLibraryJob(db, job, { llm, gates: editorialGateDeps(), speech: getAIProvider(), stt: speechToTextFromEnv() }));
    return { result: results.map((r) => ({ kind: r.job.kind, interest: r.job.interest, decision: r.decision, reason: r.reason, rubricMean: r.rubricMean, costUsd: r.costUsd })), processed: results.length };
  });
  return Response.json(result);
}
