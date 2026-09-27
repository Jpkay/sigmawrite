import type {AssessmentView} from "./client-state";
type DraftStorage=Pick<Storage,"getItem"|"setItem"|"removeItem">;
export const ASSESSMENT_DRAFT_KEY="plume-assessment-draft-v1";
function active(view:AssessmentView|null){
 if(!view||view.teaching)return null;
 const check=view.learningCheck,question=check?.question??(view.phase==="assessing"?view.question:null);
 if(!question)return null;
 const identity=check?`check:${check.id}:${question.id}:${check.revisionRequired?(check.firstDraft===null?"first":"revision"):"answer"}`:`initial:${question.id}`;
 return {sessionId:view.sessionId,identity,question};
}
function browserStorage(){return typeof window==="undefined"?undefined:window.sessionStorage;}
/** A recoverable tab-local draft, never submitted evidence. Match the server's
 * current session, question/check and writing stage before showing any content. */
export function restoreAssessmentDraft(view:AssessmentView|null,storage?:DraftStorage):{draft:string;supportChoiceId:string|null}|null{
 try{
  const target=active(view);if(!target)return null;
  const raw=(storage??browserStorage())?.getItem(ASSESSMENT_DRAFT_KEY);if(!raw)return null;
  const saved=JSON.parse(raw);
  if(saved?.sessionId!==target.sessionId||saved?.identity!==target.identity||typeof saved.draft!=="string"||saved.draft.length>3000)return null;
  if(target.question.responseType==="mcq"&&saved.draft&&!target.question.choices.some(choice=>choice.id===saved.draft))return null;
  if(saved.supportChoiceId!==null&&(typeof saved.supportChoiceId!=="string"||!target.question.supportChoices?.some(choice=>choice.id===saved.supportChoiceId)))return null;
  return {draft:saved.draft,supportChoiceId:saved.supportChoiceId};
 }catch{return null;}
}
export function persistAssessmentDraft(view:AssessmentView|null,draft:string,supportChoiceId:string|null,storage?:DraftStorage){
 try{
  if(!view)return;
  const target=active(view),cache=storage??browserStorage();if(!cache)return;
  if(!target||draft.length>3000||(!draft&&!supportChoiceId)){cache.removeItem(ASSESSMENT_DRAFT_KEY);return;}
  cache.setItem(ASSESSMENT_DRAFT_KEY,JSON.stringify({sessionId:target.sessionId,identity:target.identity,draft,supportChoiceId}));
 }catch{/* A denied/full storage area cannot prevent answering. */}
}
