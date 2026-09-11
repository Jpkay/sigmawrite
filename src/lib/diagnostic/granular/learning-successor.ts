import {checksum} from "@/lib/taxonomy/validate";
import type {AssessmentBundle,StoredSession} from "./service";
import {inspectLearningReleaseCompatibility} from "./learning-release-compatibility";
import {bindAssessmentRelease} from "./release-binding";
import type {AssessmentSession} from "./session";

/** Pure preparation only. Persistence must lock the predecessor revision and
 * create the successor atomically; this function grants no access permission. */
export function prepareLearningSuccessor(session:StoredSession,source:AssessmentBundle,target:AssessmentBundle):AssessmentSession{
 const state=session.state;
 if(state.phase!=="learning"||!state.completionReason||state.completionReason==="coverage_gap"
  ||state.learningCheck||state.teaching||state.pendingItemId||!state.paused){
  throw Error("Only an idle completed diagnostic can receive a learning successor");
 }
 if(checksum(state.release)!==checksum(bindAssessmentRelease(source.assessment,source)))throw Error("Predecessor release binding mismatch");
 if(!inspectLearningReleaseCompatibility(source,target).compatible)throw Error("Learning release content is incompatible");
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
