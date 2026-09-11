import {checksum} from "@/lib/taxonomy/validate";
import type {AssessmentBundle} from "./service";

/** Conservative content preflight, not authorization or a session mutation.
 * Callers must independently validate live releases and publication permission.
 * Retaining an old observation requires identical target and item semantics. */
export function inspectLearningReleaseCompatibility(source:AssessmentBundle,target:AssessmentBundle){
 const changed=<T>(left:readonly T[],right:readonly T[],key:(value:T)=>string)=>{
  const next=new Map(right.map(value=>[key(value),checksum(value)]));
  return left.filter(value=>next.get(key(value))!==checksum(value)).map(key);
 };
 const sourceScope=source.assessment.releaseScope?.assessmentSkillIds??source.assessment.skills.map(skill=>skill.id);
 const targetScope=new Set(target.assessment.releaseScope?.assessmentSkillIds??target.assessment.skills.map(skill=>skill.id));
 const report={
  taxonomyUnchanged:source.taxonomyId===target.taxonomyId&&source.assessment.taxonomyChecksum===target.assessment.taxonomyChecksum,
  facetsUnchanged:source.assessment.facetChecksum===target.assessment.facetChecksum,
  changedSkills:changed(source.assessment.skills,target.assessment.skills,skill=>skill.id),
  changedItems:changed(source.bank.items,target.bank.items,item=>item.itemKey),
  changedProbes:changed(source.assessment.probes,target.assessment.probes,probe=>probe.id),
  changedTeaching:changed(source.teachingContent??[],target.teachingContent??[],lesson=>lesson.id),
  changedActivities:changed(source.activities??[],target.activities??[],activity=>activity.id),
  removedScopeTargets:sourceScope.filter(id=>!targetScope.has(id)),
  addedScopeTargets:[...targetScope].filter(id=>!sourceScope.includes(id)),
 };
 return {...report,compatible:report.taxonomyUnchanged&&report.facetsUnchanged&&[
  report.changedSkills,report.changedItems,report.changedProbes,report.changedTeaching,report.changedActivities,report.removedScopeTargets,
 ].every(changes=>changes.length===0)};
}
