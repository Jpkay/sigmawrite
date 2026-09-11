import {isFrenchGranularBankKey} from "./bank-family";
import {checksum} from "@/lib/taxonomy/validate";
import type {AssessmentBundle} from "./service";
import {parseParallelReviewPolicy} from "./parallel-review-policy";
import {inspectReleaseBank} from "./release-bank";
import {inspectReleaseScope} from "./release-scope";
import {inspectQuestionPools,isQuestionPoolSufficient} from "./question-pools";
import {validatePublishedTeaching} from "./teaching-content";
import {validateActivityBindings} from "./activity-validation";

/** Trusted publisher preflight. This is release permission, never a review record.
 * It neither writes the database nor changes input statuses/answer provenance. */
export function prepareParallelPublication(bundle:AssessmentBundle){
 const policy=parseParallelReviewPolicy(bundle.assessment.reviewPolicy);
 if(!isFrenchGranularBankKey(bundle.bank.bank.key))throw Error("Parallel publication is restricted to the French v3 bank");
 if(!inspectReleaseBank(bundle))throw Error("Invalid approved graph or canonical bank binding");
 const pools=inspectQuestionPools(bundle.assessment);
 if(!pools.ok)throw Error(`Invalid publication question pools: ${pools.issues.join("; ")}`);
 const scope=inspectReleaseScope(bundle.assessment.skills,bundle.assessment.releaseScope);
 validatePublishedTeaching(bundle.assessment,bundle.teachingContent??[]);
 validateActivityBindings(bundle.assessment,bundle.activities??[]);
 if(bundle.activities?.some(activity=>activity.status!=="published"))throw Error("Publication bundle contains draft activities");
 const instructionGaps:string[]=[],checkGaps:string[]=[];
 for(const skill of bundle.assessment.skills.filter(skill=>scope.assessmentSkillIds.has(skill.id))){
  for(const mode of skill.modes){
   const instruction=bundle.activities?.find(a=>a.kind==="instruction"&&a.nodeKey===skill.nodeKey&&(a.facetKey??null)===(skill.facetKey??null)&&a.mode===mode);
   const lesson=bundle.teachingContent?.find(l=>l.id===instruction?.contentId);
   if(!instruction||!lesson){instructionGaps.push(skill.id);continue;}
   if(lesson.nodeKey!==skill.nodeKey||(lesson.facetKey??null)!==(skill.facetKey??null)||lesson.mode!==mode)throw Error("Instruction references mismatched content");
   const checkIds=new Set(bundle.activities?.filter(a=>a.kind==="independent_check"&&a.nodeKey===skill.nodeKey&&(a.facetKey??null)===(skill.facetKey??null)&&a.mode===mode).flatMap(a=>a.probeIds??[]));
   const fresh=bundle.assessment.probes.filter(p=>p.skillId===skill.id&&p.mode===mode&&p.usage==="learning"&&checkIds.has(p.id)&&!lesson.assessmentExposureIds.includes(p.id));
   if(!isQuestionPoolSufficient(fresh,skill,mode,true))checkGaps.push(skill.id);
  }
 }
 const ready=instructionGaps.length===0&&checkGaps.length===0;
 return {version:"french-granular-parallel-publication-v1" as const,ready,
  authorization:policy.authorization,reviewOwner:policy.reviewOwner,
  bankChecksum:bundle.assessment.bankChecksum,taxonomyChecksum:bundle.assessment.taxonomyChecksum,
  bundleChecksum:checksum(bundle),policyChecksum:checksum(policy),scopeChecksum:checksum(scope.scope),
  bankItemCount:bundle.bank.items.length,
  assessmentTargets:scope.assessmentSkillIds.size,teachingTargets:scope.teachingSkillIds.size,
  instructionGapSkillIds:[...new Set(instructionGaps)].sort(),freshCheckGapSkillIds:[...new Set(checkGaps)].sort()};
}
