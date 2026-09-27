import type {V3Assessment} from "./v3-adapter";
import type {LearningActivityBinding} from "./activity-plan";
import {inspectReleaseScope} from "./release-scope";

/** Reject malformed release bindings before exposing any pathway. */
export function validateActivityBindings(assessment:V3Assessment,bindings:readonly LearningActivityBinding[]){
 const scope=assessment.releaseScope===undefined?undefined:inspectReleaseScope(assessment.skills,assessment.releaseScope);
 const ids=new Set<string>();
 for(const binding of bindings){
  if(ids.has(binding.id))throw Error("Duplicate learning activity binding");
  ids.add(binding.id);
  const targets=assessment.skills.filter(skill=>skill.nodeKey===binding.nodeKey&&(skill.facetKey??null)===(binding.facetKey??null)&&skill.modes.includes(binding.mode));
  if(!targets.length)throw Error("Learning activity has no exact target");
  if(scope&&!targets.some(skill=>(binding.kind==="independent_check"?scope.assessmentSkillIds:scope.teachingSkillIds).has(skill.id)))throw Error("Learning activity outside release scope");
  if(binding.kind==="independent_check"){
   if(!binding.probeIds?.length||new Set(binding.probeIds).size!==binding.probeIds.length)throw Error("Invalid learning check question list");
   for(const id of binding.probeIds){
    const probe=assessment.probes.find(item=>item.id===id);
    if(!probe||probe.usage==="initial"||probe.mode!==binding.mode||!targets.some(skill=>skill.id===probe.skillId))throw Error("Learning check question targets another skill or pool");
   }
  }else if(!binding.contentId)throw Error("Learning activity has no teaching content");
 }
}
