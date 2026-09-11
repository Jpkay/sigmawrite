import type {Probe} from "./engine";
import type {AssessmentSession} from "./session";
/** Known passage exposure includes shown/unanswered texts and tracked history
 * loaded from other sessions. It does not establish complete historical capture. */
export function learningSeenQuestionIds(state:AssessmentSession,bank:readonly Probe[]):Set<string>{
 const seen=new Set([...state.observations,...state.refinements].map(observation=>observation.itemId).concat(state.exposedLearningItemIds));
 const contexts=new Set(state.exposedReadingContexts??[]);
 for(const probe of bank)if(seen.has(probe.id)||probe.id===state.pendingItemId){
  if(probe.contextId.startsWith("passage-content:"))contexts.add(probe.contextId);
 }
 for(const probe of bank)if(contexts.has(probe.contextId))seen.add(probe.id);
 return seen;
}
