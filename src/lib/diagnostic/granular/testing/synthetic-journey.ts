import type {AssessmentBundle} from "../service";
import {bindAssessmentRelease} from "../release-binding";
import {createSession,transitionSession,sessionView,type AssessmentSession,type SessionEvent} from "../session";
import {DEFAULT_POLICY} from "../engine";

/** Real transitions over test-only content. No authenticated service or grading
 * claim: answers and timestamps below stand in for trusted server inputs. */
export function buildSyntheticPersistenceJourney(bundle:AssessmentBundle){
 const release=bindAssessmentRelease(bundle.assessment,{taxonomyId:bundle.taxonomyId,bankId:bundle.bankId});
 let state=createSession(release),at=Date.parse("2026-09-11T09:00:00Z");
 const states:AssessmentSession[]=[state];
 const apply=(event:SessionEvent)=>{
  state=transitionSession({state,release,expectedRevision:state.revision,event,skills:bundle.assessment.skills,bank:bundle.assessment.probes});
  states.push(state);
 };
 apply({type:"resume",at});
 for(let index=0;index<12;index++){
  if(!state.pendingItemId)throw Error("Synthetic journey ended before broad sampling");
  at+=20_000;
  apply(index===3?{type:"skip",at,itemId:state.pendingItemId}:{type:"answer",at,itemId:state.pendingItemId,correct:index%3!==0});
 }
 apply({type:"pause",at});
 const pausedRevision=state.revision,pausedSeconds=state.activeSeconds;
 // An overnight interruption must not spend the active-time budget.
 at+=24*60*60*1000;
 apply({type:"resume",at});
 if(state.activeSeconds!==pausedSeconds)throw Error("Pause consumed assessment time");
 while(state.phase==="assessing"){
  at+=30_000;apply({type:"pulse",at});
  if(states.length>200)throw Error("Synthetic journey did not stop at the time budget");
 }
 if(state.completionReason!=="time_budget"||state.activeSeconds!==DEFAULT_POLICY.activeSeconds)throw Error("Incorrect time-budget handoff");
 const learningRevision=state.revision;
 const probe=bundle.assessment.probes.find(item=>item.usage==="learning"&&item.mode!=="independent_production"&&!state.observations.some(observation=>observation.itemId===item.id));
 if(!probe)throw Error("No fresh independent check in the full-graph fixture");
 apply({type:"issue_check",check:{id:"synthetic-check",activityId:`check:${probe.skillId}`,itemId:probe.id,occasionId:"learning-day:2026-09-12"}});
 const issuedRevision=state.revision;
 apply({type:"answer_check",checkId:"synthetic-check",correct:true});
 const view=sessionView(state,bundle.assessment.skills);
 if(!view.provisional||!view.priorities.length||state.refinements.length!==1)throw Error("Missing provisional pathway or independent evidence");
 return {states,pausedRevision,learningRevision,issuedRevision,results:view.results,priorities:view.priorities};
}
