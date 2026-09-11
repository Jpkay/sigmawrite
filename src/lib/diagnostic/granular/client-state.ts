import type {StudentState} from "@/lib/student-state";
import type {publicAssessmentView} from "./service";
export type AssessmentView=ReturnType<typeof publicAssessmentView>;
export type AssessmentResponse={view?:AssessmentView;error?:string;conflict?:boolean;studentState?:Omit<StudentState,"hydrated">};
const questionIdentity=(view:AssessmentView|null)=>view?.teaching?.exercise?`guided:${view.teaching.contentId}:${view.teaching.exercise.id}:${Boolean(view.teaching.exercise.feedback)}`:view?.learningCheck?`learning:${view.learningCheck.id}`:view?.question?.id;
/** Preserve the draft only while it still belongs to the same question. */
export function reconcileAssessmentResponse(current:AssessmentView|null,draft:string,response:AssessmentResponse){
 const view=response.view??current;
 if(current&&view&&view.sessionId===current.sessionId&&view.revision<current.revision)return {view:current,draft,error:null};
 const sameQuestion=view?.sessionId===current?.sessionId&&questionIdentity(view)===questionIdentity(current);
 return {view,draft:sameQuestion?draft:(view?.learningCheck?.firstDraft??""),
  error:response.error??(response.conflict&&sameQuestion?"Ta réponse est conservée. Tu peux la valider à nouveau.":null)};
}
