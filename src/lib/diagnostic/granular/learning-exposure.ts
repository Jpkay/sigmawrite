import type {Probe} from "./engine";
import type {AssessmentSession} from "./session";
import type {ReleasedTeachingContent} from './teaching-content';
import {teachingMaterialKeys} from './material-annotations';
/** Known passage exposure includes shown/unanswered texts and tracked history
 * loaded from other sessions. It does not establish complete historical capture. */
export function learningSeenQuestionIds(state:AssessmentSession,bank:readonly Probe[],teaching:readonly ReleasedTeachingContent[]=[]):Set<string>{
 const seen=new Set([...state.observations,...state.refinements].map(observation=>observation.itemId).concat(state.exposedLearningItemIds));
 const known=new Set(state.exposedMaterialKeys??[]);
 for(const lesson of teaching){
  const completed=state.completedTeachingIds?.includes(lesson.id);
  if(!completed&&!known.size)continue;
  const keys=completed?[]:teachingMaterialKeys(lesson);
  // Starting a lesson records all its material, including exercises not yet
  // reached. Reapply expanded overlap bindings without fabricating receipts.
  if(completed||(keys.length>0&&keys.every(key=>known.has(key)))){
   for(const id of lesson.assessmentExposureIds)seen.add(id);
  }
 }
 const contexts=new Set(state.exposedReadingContexts??[]);
 for(const probe of bank)if(seen.has(probe.id)||probe.id===state.pendingItemId){
  if(probe.contextId.startsWith("passage-content:"))contexts.add(probe.contextId);
 }
 for(const probe of bank)if(contexts.has(probe.contextId))seen.add(probe.id);
 return seen;
}
