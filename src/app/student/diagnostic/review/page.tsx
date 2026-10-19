import {journalCurrentStudentPayload} from "@/lib/diagnostic/granular/server-delivery-journal";
import {ANSWER_REVIEW_COPY} from "@/lib/diagnostic/granular/answer-review-copy";
import {getGranularAnswerReview} from "@/lib/actions/granular-diagnostic";
import {DiagnosticAnswerReviewPanel} from "@/components/diagnostic/answer-review";
import {DiagnosticReviewUnavailableError} from "@/lib/diagnostic/granular/answer-review";
import {PageHeader} from "@/components/page";
import Link from "next/link";
export default async function ReviewPage({searchParams}:{searchParams:Promise<{session?:string}>}){
 const {session}=await searchParams;
 if(!session){
  await journalCurrentStudentPayload("granular:review-missing-session",{message:ANSWER_REVIEW_COPY.missingSession});
  return <p>{ANSWER_REVIEW_COPY.missingSession}</p>;
 }
 let review;
 try{review=await getGranularAnswerReview(session);}
 catch(error){
  if(!(error instanceof DiagnosticReviewUnavailableError))throw error;
  const display={title:ANSWER_REVIEW_COPY.title,message:error.message,back:ANSWER_REVIEW_COPY.back};
  await journalCurrentStudentPayload("granular:review-unavailable",display);
  return <div><PageHeader title={display.title}/><p role="status" className="mb-6 text-muted-foreground">{display.message}</p><Link href="/student/diagnostic" className="text-primary underline">{display.back}</Link></div>;
 }
 return <DiagnosticAnswerReviewPanel review={review}/>;
}
