import {ANSWER_REVIEW_COPY as copy,answerReviewDescription,answerReviewRowHeading} from "@/lib/diagnostic/granular/answer-review-copy";
import styles from "./answer-review.module.css";
import Link from "next/link";
import {PageHeader} from "@/components/page";
import {ExercisePrompt} from "@/components/exercise-prompt";
import type {DiagnosticAnswerReview} from "@/lib/diagnostic/granular/answer-review";
export function DiagnosticAnswerReviewPanel({review}:{review:DiagnosticAnswerReview}){
 const wrong=review.rows.filter(row=>row.status==="wrong").length;
 return <div className={styles.review}>
  <PageHeader title={copy.title} description={answerReviewDescription(review.rows.length,wrong)}/>
  <Link href="/student/diagnostic" className="block text-primary underline">{copy.back}</Link>
  <input id="review-errors-only" type="checkbox" className={styles.filter}/><label htmlFor="review-errors-only" className={styles.filterLabel}>{copy.errorsOnly}</label>
  <div className={`${styles.rows} space-y-5`}>{review.rows.map(row=><article key={row.itemId} data-result={row.status} className="rounded-lg border border-border p-5">
   <p className="mb-4 font-semibold">{answerReviewRowHeading(row.number,row.status)}</p>
   <ExercisePrompt promptFr={row.promptFr} instructionsFr={row.instructionsFr}/>
   <dl className="mt-5 space-y-3">
    <div><dt className="font-semibold">{copy.submitted}</dt><dd className="whitespace-pre-wrap">{row.submittedAnswer??(row.status==="skipped"?copy.skipped:copy.missingAnswer)}</dd></div>
    <div><dt className="font-semibold">{copy.expected}</dt><dd className="whitespace-pre-wrap">{row.expectedAnswer??copy.missingExpected}</dd></div>
    {row.expectedSupport&&<><div><dt className="font-semibold">{copy.submittedSupport}</dt><dd>{row.submittedSupport??copy.missingSupport}</dd></div><div><dt className="font-semibold">{copy.expectedSupport}</dt><dd>{row.expectedSupport}</dd></div></>}
   </dl>
  </article>)}</div>
  {wrong===0&&<p className={styles.empty}>{copy.noErrors}</p>}
 </div>;
}
