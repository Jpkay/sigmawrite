import {checksum} from "@/lib/taxonomy/validate";
import type {AssessmentBundle} from "./service";
import {teachingMaterialKeys} from './material-annotations';

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
 const sourceItems=new Set(source.bank.items.map(item=>item.itemKey));
 const sourceProbes=new Set(source.assessment.probes.map(probe=>probe.id));
 const addedItems=target.bank.items.filter(item=>!sourceItems.has(item.itemKey)).map(item=>item.itemKey);
 const addedProbes=target.assessment.probes.filter(probe=>!sourceProbes.has(probe.id)).map(probe=>probe.id);
 const expandedTeachingExposure:string[]=[];
 const changedTeaching=(source.teachingContent??[]).filter(lesson=>{
  const next=target.teachingContent?.find(value=>value.id===lesson.id);
  if(!next)return true;
  if(checksum(lesson)===checksum(next))return false;
  const {assessmentExposureIds:oldIds,...oldBody}=lesson;
  const {assessmentExposureIds:newIds,...newBody}=next;
  if(checksum(oldBody)!==checksum(newBody)||oldIds.some(id=>!newIds.includes(id)))return true;
  const added=newIds.filter(id=>!oldIds.includes(id));
  const material=new Set(teachingMaterialKeys(lesson));
  // Additions must refer to material already present in the unchanged lesson.
  // Learning exposure resolves these bindings from retained lesson history.
  if(!added.length||new Set(newIds).size!==newIds.length||added.some(id=>{
   const probe=target.assessment.probes.find(value=>value.id===id);
   return !probe||!(probe.materialKeys??[]).some(key=>material.has(key));
  }))return true;
  expandedTeachingExposure.push(lesson.id);return false;
 }).map(lesson=>lesson.id);
 const report={
  addedItems,addedProbes,
  taxonomyUnchanged:source.taxonomyId===target.taxonomyId&&source.assessment.taxonomyChecksum===target.assessment.taxonomyChecksum,
  facetsUnchanged:source.assessment.facetChecksum===target.assessment.facetChecksum,
  changedSkills:changed(source.assessment.skills,target.assessment.skills,skill=>skill.id),
  changedItems:changed(source.bank.items,target.bank.items,item=>item.itemKey),
  changedProbes:changed(source.assessment.probes,target.assessment.probes,probe=>probe.id),
  changedTeaching,expandedTeachingExposure,
  changedActivities:changed(source.activities??[],target.activities??[],activity=>activity.id),
  removedScopeTargets:sourceScope.filter(id=>!targetScope.has(id)),
  addedScopeTargets:[...targetScope].filter(id=>!sourceScope.includes(id)),
 };
 // facetChecksum hashes annotations AND all compiled probes, so legitimate
 // bank expansion changes it. Existing compiled semantics must remain exact.
 const targetItems=new Set(target.bank.items.map(item=>item.itemKey));
 const facetExpansion=addedProbes.length>0&&addedProbes.every(id=>targetItems.has(id));
 return {...report,compatible:report.taxonomyUnchanged&&(report.facetsUnchanged||facetExpansion)&&[
  report.changedSkills,report.changedItems,report.changedProbes,report.changedTeaching,report.changedActivities,report.removedScopeTargets,
 ].every(changes=>changes.length===0)};
}
