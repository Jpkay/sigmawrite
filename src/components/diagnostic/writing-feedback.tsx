import {DIAGNOSTIC_COPY,writingCountText} from "./diagnostic-copy";
import type {WritingFeedback} from '@/lib/diagnostic/granular/writing-feedback';
const copy=DIAGNOSTIC_COPY.child;

export function WritingFeedbackCard({feedback}:{feedback:WritingFeedback}){
 return <section aria-labelledby="writing-feedback-title" className="mb-8 rounded-xl border border-border p-5">
  <h2 id="writing-feedback-title" className="text-xl font-semibold">{copy.writingTitle}</h2>
  <p className="mt-2 text-sm text-muted-foreground">{copy.writingSkillPrefix} {feedback.skillLabelFr}</p>
  {!feedback.assessed?<p className="mt-3">{copy.writingUnassessed}</p>:<p className="mt-3">{writingCountText(feedback.checkedCount,feedback.correctCount)}</p>}
  {feedback.assessed&&<p className="mt-2 text-sm text-muted-foreground">{copy.writingScope}</p>}
  <details className="mt-4"><summary className="cursor-pointer font-medium">{copy.reread}</summary><p className="mt-3 whitespace-pre-wrap break-words">{feedback.text}</p></details>
  <ol className="mt-4 space-y-3">{feedback.passages.map(passage=><li key={`${passage.start}:${passage.end}`} className="rounded-lg border border-border p-3">
   <p className="text-sm font-semibold">{passage.correct?copy.passageCorrect:copy.passageReview}</p>
   <blockquote className="my-2 whitespace-pre-wrap break-words">« {passage.text} »</blockquote>
   <p className="text-sm text-muted-foreground">{passage.explanationFr}</p>
  </li>)}</ol>
 </section>;
}
