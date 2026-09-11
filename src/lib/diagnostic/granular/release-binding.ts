import {inspectReleaseScope} from "./release-scope";
import {checksum} from "@/lib/taxonomy/validate";
import type {V3Assessment} from "./v3-adapter";
import type {Release} from "./session";
/** Facet metadata changes what an answer proves, so it must be pinned with the bank. */
export function bindAssessmentRelease(assessment:V3Assessment,ids:{taxonomyId:string;bankId:string}):Release{
 const scope=assessment.releaseScope!==undefined?inspectReleaseScope(assessment.skills,assessment.releaseScope).scope:undefined;
 const sampling=assessment.skills.some(skill=>skill.samplingGroup!==undefined||skill.challengeOrder!==undefined)
  ?{sampling:assessment.skills.map(skill=>({id:skill.id,domain:skill.domain??skill.branch,group:skill.samplingGroup??skill.domain??skill.branch,branch:skill.branch,...(skill.challengeOrder===undefined?{}:{challengeOrder:skill.challengeOrder})})).sort((a,b)=>a.id.localeCompare(b.id))}:{};
 // Callers may pass a structurally compatible bundle. Never copy its answer
 // keys and lessons into every persisted session's release identity.
 return {taxonomyId:ids.taxonomyId,bankId:ids.bankId,checksum:checksum({taxonomy:assessment.taxonomyChecksum,bank:assessment.bankChecksum,facets:assessment.facetChecksum??null,...(scope?{releaseScope:checksum(scope)}:{}),...(assessment.reviewPolicy?{reviewPolicy:checksum(assessment.reviewPolicy)}:{}),...(assessment.poolChecksum?{pools:assessment.poolChecksum}:{}),...sampling})};
}
