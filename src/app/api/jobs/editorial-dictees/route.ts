import { authorizeJob, withJobRun } from "@/lib/jobs";
import { getAIProvider } from "@/lib/ai";
import { loadDictationStudentContext, loadPickerDictations } from "@/lib/dictation/picker-data";
import { speechToTextFromEnv } from "@/lib/content/editorial/audio-check";
import { dayBeforeSpentToday, DAY_BEFORE_DEFAULTS, loadActiveStudentIds, runDayBeforeDictations } from "@/lib/content/editorial/day-before";
import { LIBRARY_DEFAULTS } from "@/lib/content/editorial/library";
import { runLibraryJob } from "@/lib/content/editorial/library-runner";
import { editorialGateDeps, editorialLLM } from "@/lib/content/editorial/runtime";

export const maxDuration = 300;

/**
 * Day-before personalised dictées (roadmap H.16), once a day in the
 * afternoon so the hourly dictation-audio job renders the audio before the
 * next session. Off unless EDITORIAL_DICTEE_JOB=true (it spends model budget);
 * capped by EDITORIAL_DICTEE_DAILY_BUDGET_USD (default 3) and
 * EDITORIAL_DICTEE_DAILY_MAX (default 4 dictées). Skips students for whom the
 * library pool already fits.
 */
export async function GET(request: Request) {
  if (!authorizeJob(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (process.env.EDITORIAL_DICTEE_JOB !== "true") return Response.json({ skipped: "EDITORIAL_DICTEE_JOB is not enabled" });
  const llm = editorialLLM();
  if (!llm) return Response.json({ skipped: "editorial provider not configured" });
  const result = await withJobRun("editorial_dictees", async (db) => {
    const now = Date.now();
    const report = await runDayBeforeDictations({
      activeStudents: () => loadActiveStudentIds(db, now),
      loadPool: () => loadPickerDictations(db, false),
      loadContext: (studentId, pool) => loadDictationStudentContext(db, studentId, now, pool),
      spentToday: () => dayBeforeSpentToday(db, now),
      runJob: (job, options) => runLibraryJob(db, job, { llm, gates: editorialGateDeps(), speech: getAIProvider(), stt: speechToTextFromEnv(), targetWords: options.targetWords, costCapUsd: options.costCapUsd, runTag: DAY_BEFORE_DEFAULTS.runTag }),
      perJobCapUsd: LIBRARY_DEFAULTS.costCapUsd,
      now: () => now,
    });
    return { result: report, processed: report.jobs.length };
  });
  return Response.json(result);
}
