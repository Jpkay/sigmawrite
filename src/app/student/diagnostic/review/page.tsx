import {journalCurrentStudentPayload} from "@/lib/diagnostic/granular/server-delivery-journal";
import {ANSWER_REVIEW_COPY} from "@/lib/diagnostic/granular/answer-review-copy";
import {getGranularAnswerReview} from "@/lib/actions/granular-diagnostic";
import {DiagnosticAnswerReviewPanel} from "@/components/diagnostic/answer-review";
export default async function ReviewPage({searchParams}:{searchParams:Promise<{session?:string}>}){
 const {session}=await searchParams;
 if(!session){
  await journalCurrentStudentPayload("granular:review-missing-session",{message:ANSWER_REVIEW_COPY.missingSession});
  return <p>{ANSWER_REVIEW_COPY.missingSession}</p>;
 }
 const review=await getGranularAnswerReview(session);
 return <DiagnosticAnswerReviewPanel review={review}/>;
}
