import {getGranularAnswerReview} from "@/lib/actions/granular-diagnostic";
import {DiagnosticAnswerReviewPanel} from "@/components/diagnostic/answer-review";
export default async function ReviewPage({searchParams}:{searchParams:Promise<{session?:string}>}){
 const {session}=await searchParams;
 if(!session)return <p>Ouvre la revue depuis les résultats de ton diagnostic.</p>;
 const review=await getGranularAnswerReview(session);
 return <DiagnosticAnswerReviewPanel review={review}/>;
}
