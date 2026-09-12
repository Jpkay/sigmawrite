import {checksum} from "@/lib/taxonomy/validate";
import type {AssessmentBundle,StoredSession} from "./service";
import {inspectLearningReleaseCompatibility} from "./learning-release-compatibility";
import {bindAssessmentRelease} from "./release-binding";
import type {AssessmentSession} from "./session";
import {teachingMaterialKeys} from './material-annotations';

/** Pure preparation only. Persistence must lock the predecessor revision and
 * create the successor atomically; this function grants no access permission. */
export function prepareLearningSuccessor(session:StoredSession,source:AssessmentBundle,target:AssessmentBundle):AssessmentSession{
 const state=session.state;
 if(state.phase!=="learning"||!state.completionReason||state.completionReason==="coverage_gap"
  ||state.learningCheck||state.teaching||state.pendingItemId||!state.paused){
  throw Error("Only an idle completed diagnostic can receive a learning successor");
 }
 if(checksum(state.release)!==checksum(bindAssessmentRelease(source.assessment,source)))throw Error("Predecessor release binding mismatch");
 const compatibility=inspectLearningReleaseCompatibility(source,target);
 if(!compatibility.compatible)throw Error("Learning release content is incompatible");
 if([...state.observations,...state.refinements].some(observation=>compatibility.newlyScopedStrengthenedSkills.includes(observation.skillId)))throw Error("Newly scoped target already has historical evidence");
 if(compatibility.expandedTeachingExposure.length){
  // Never invent historical receipts to unlock an upgrade. Older sessions
  // without material tracking stay pinned to their existing release.
  if(!state.exposedMaterialKeys)throw Error('Historical teaching material tracking is unavailable');
  const known=new Set(state.exposedMaterialKeys);
  for(const id of compatibility.expandedTeachingExposure){
   const lesson=source.teachingContent!.find(value=>value.id===id)!;
   const possiblyStarted=state.completedTeachingIds?.includes(id)||lesson.assessmentExposureIds.some(item=>state.exposedLearningItemIds.includes(item));
   if(possiblyStarted&&teachingMaterialKeys(lesson).some(key=>!known.has(key)))throw Error('Previous lesson material history is incomplete');
  }
 }
 const release=bindAssessmentRelease(target.assessment,target);
 if(checksum(release)===checksum(state.release))throw Error("Learning release has not changed");
 const probes=new Set(source.assessment.probes.map(probe=>probe.id));
 if([...state.observations,...state.refinements].some(observation=>!probes.has(observation.itemId)))throw Error("Historical observation has no source probe");
 if((state.completedTeachingIds??[]).some(id=>!source.teachingContent?.some(lesson=>lesson.id===id)))throw Error("Completed teaching has no source lesson");
 const next=structuredClone(state);
 next.release=release;next.revision=0;next.lastPulseAt=null;
 next.learningPredecessor={sessionId:session.id,releaseId:session.releaseId,revision:state.revision};
 if(next.diagnosticResponses)next.diagnosticResponses=next.diagnosticResponses.map(response=>({...response,sourceSessionId:response.sourceSessionId??session.id}));
 return next;
}
