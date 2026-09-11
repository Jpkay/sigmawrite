import type {AssessmentView} from "./client-state";
type DraftStorage=Pick<Storage,"getItem"|"setItem"|"removeItem">;
export const GUIDED_DRAFT_KEY="plume-guided-draft-v1";
function active(view:AssessmentView|null){
 const teaching=view?.teaching,exercise=teaching?.exercise;
 return view&&teaching?.phase==="practice"&&exercise&&!exercise.feedback
  ?{sessionId:view.sessionId,contentId:teaching.contentId,exerciseId:exercise.id,exercise}:null;
}
function browserStorage(){return typeof window==="undefined"?undefined:window.sessionStorage;}
/** One tab-local draft, never evidence. Restore only against the server's current
 * session/exercise and current choice IDs. Storage denial must not break practice. */
export function restoreGuidedDraft(view:AssessmentView|null,storage?:DraftStorage):string|null{
 try{
  const target=active(view);if(!target)return null;
  const raw=(storage??browserStorage())?.getItem(GUIDED_DRAFT_KEY);if(!raw)return null;
  const saved=JSON.parse(raw);
  if(saved?.sessionId!==target.sessionId||saved?.contentId!==target.contentId||saved?.exerciseId!==target.exerciseId
   ||typeof saved.draft!=="string"||saved.draft.length>1000)return null;
  if(target.exercise.choices&&!target.exercise.choices.some(choice=>choice.id===saved.draft))return null;
  return saved.draft;
 }catch{return null;}
}
export function persistGuidedDraft(view:AssessmentView|null,draft:string,storage?:DraftStorage){
 try{
  if(!view)return;
  const target=active(view),cache=storage??browserStorage();if(!cache)return;
  if(!target||!draft||draft.length>1000){cache.removeItem(GUIDED_DRAFT_KEY);return;}
  cache.setItem(GUIDED_DRAFT_KEY,JSON.stringify({sessionId:target.sessionId,contentId:target.contentId,exerciseId:target.exerciseId,draft}));
 }catch{/* Keep in-memory interaction working when browser storage is unavailable. */}
}
