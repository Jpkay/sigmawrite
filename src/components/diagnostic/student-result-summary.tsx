import {STUDENT_RESULT_SUMMARY_COPY as copy,studentPointCount,studentResultSummary} from "@/lib/diagnostic/granular/student-results-display";
import type {SkillResult} from "@/lib/diagnostic/granular/engine";

export function StudentResultSummary({results}:{results:readonly Pick<SkillResult,"status">[]}){
 const summary=studentResultSummary(results);
 const rows=[
  {label:copy.mastered,count:summary.mastered},
  {label:copy.needsWork,count:summary.needsWork},
  {label:copy.checking,count:summary.checking},
  {label:copy.notChecked,count:summary.notChecked},
 ];
 return <section className="mb-8" aria-labelledby="student-result-summary-title">
  <h2 id="student-result-summary-title" className="text-xl font-semibold">{copy.title}</h2>
  <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{rows.map(row=><div key={row.label} className="rounded-lg border border-border p-4"><dt className="text-sm text-muted-foreground">{row.label}</dt><dd className="mt-1 font-display text-2xl font-semibold">{studentPointCount(row.count)}</dd></div>)}</dl>
  <p className="mt-3 text-sm text-muted-foreground">{copy.notCheckedHelp}</p>
 </section>;
}
