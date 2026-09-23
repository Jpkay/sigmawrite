import {STUDENT_RESULT_SUMMARY_COPY as copy,studentResultSummary,type StudentResultEntry} from "@/lib/diagnostic/granular/student-results-display";

export function StudentResultSummary({results}:{results:readonly StudentResultEntry[]}){
 const summary=studentResultSummary(results);
 const groups=[{title:copy.mastered,labels:summary.mastered},{title:copy.needsWork,labels:summary.needsWork},{title:copy.checking,labels:summary.checking}].filter(group=>group.labels.length>0);
 const description=!summary.hasDirect?copy.emptyDescription:!summary.hasConfirmed?copy.checkingDescription:copy.description;
 return <section className="mb-8" aria-labelledby="student-result-summary-title">
  <h2 id="student-result-summary-title" className="text-xl font-semibold">{copy.title}</h2>
  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  {groups.length>0&&<dl className="mt-4 grid gap-3 lg:grid-cols-3">{groups.map(group=><div key={group.title} className="rounded-lg border border-border p-4"><dt className="font-semibold">{group.title}</dt><dd><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{group.labels.slice(0,3).map(label=><li key={label}>{label}</li>)}{group.labels.length>3&&<li>{copy.moreInDetails}</li>}</ul></dd></div>)}</dl>}
  {summary.hasUnassessed&&<p className="mt-3 text-sm text-muted-foreground">{copy.notCheckedHelp}</p>}
 </section>;
}
