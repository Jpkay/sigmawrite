import {granularActivityHref} from "./activity-navigation";
import {inspectReleaseScope} from "./release-scope";
import type {EvidenceSkill,V3Assessment} from "./v3-adapter";
import type {Mode,SkillResult} from "./engine";
import {buildGranularPriorities} from "./pathway";
export type LearningActivityBinding={
 id:string;nodeKey:string;facetKey?:string;mode:Mode;
 kind:"instruction"|"practice"|"independent_check";
 status:"draft"|"published";titleFr:string;href:string;
 /** Release-pinned, eligible questions reserved for an independent check. */
 probeIds?:string[];
 estimatedMinutes?:number;
 /** Exact reviewed lesson in the same immutable release bundle. */
 contentId?:string;
};
export function availableLearningBindings(assessment:V3Assessment,bindings:readonly LearningActivityBinding[],seen:ReadonlySet<string>){
 return bindings.filter(binding=>binding.kind!=="independent_check"||assessment.probes.some(probe=>{
  const skill=assessment.skills.find(s=>s.id===probe.skillId);
  return probe.usage!=="initial"&&binding.probeIds?.includes(probe.id)&&!seen.has(probe.id)&&probe.mode===binding.mode&&skill?.nodeKey===binding.nodeKey&&(skill.facetKey??null)===(binding.facetKey??null);
 }));
}
/** Availability is checked at the same precision as the diagnostic claim. */
export function planGranularActivities(assessment:V3Assessment,results:readonly SkillResult[],bindings:readonly LearningActivityBinding[],limit=5,completedContentIds:ReadonlySet<string>=new Set()){
 // Approved French v3 advancement readiness is distinct from mastery (0.85).
 // This controls teaching access only; independent verification may discover an
 // advanced strength even while its prerequisite remains unresolved.
 const ready=(id:string)=>{
  const skill=assessment.skills.find(s=>s.id===id),result=results.find(r=>r.skillId===id);
  return Boolean(skill&&result?.evidence==="direct"&&skill.modes.every(mode=>{
   const evidence=result.modes.find(m=>m.mode===mode);
   return evidence&&evidence.distinctItems>0&&Number.isFinite(evidence.probability)&&evidence.probability>=.65;
  }));
 };
 const scope=assessment.releaseScope===undefined?undefined:inspectReleaseScope(assessment.skills,assessment.releaseScope);
 const priorities=buildGranularPriorities(assessment.skills,results,assessment.skills.length);
 const byId=new Map(assessment.skills.map(s=>[s.id,s]));
 const activities:Array<{skillId:string;activityId:string;kind:LearningActivityBinding["kind"];action:"verify"|"learn"|"consolidate";titleFr:string;href:string;estimatedMinutes:number;contentId?:string}>=[];
 const missingActivitySkillIds:string[]=[],blockedSkillIds=new Set<string>(),unavailableSkillIds=new Set<string>();
 const matching=(skill:EvidenceSkill,binding:LearningActivityBinding)=>(!scope||(binding.kind==="independent_check"?scope.assessmentSkillIds:scope.teachingSkillIds).has(skill.id))&&binding.status==="published"&&binding.nodeKey===skill.nodeKey
  &&(binding.facetKey??null)===(skill.facetKey??null)&&skill.modes.includes(binding.mode);
 for(const priority of priorities){
  const skill=byId.get(priority.skillId)!;
  if(scope&&!scope.assessmentSkillIds.has(skill.id))continue;
  if(skill.prerequisites.some(id=>unavailableSkillIds.has(id))){blockedSkillIds.add(skill.id);unavailableSkillIds.add(skill.id);continue;}
  const taught=bindings.some(binding=>matching(skill,binding)&&priority.modes.includes(binding.mode)&&binding.kind==="instruction"&&binding.contentId&&completedContentIds.has(binding.contentId));
  const action=taught?"verify":priority.action;
  if(action!=="verify"&&skill.prerequisites.some(id=>!ready(id))){blockedSkillIds.add(skill.id);continue;}
  const kinds=action==="verify"?["independent_check"]:action==="learn"?["instruction"]:["practice","independent_check"];
  const choices=bindings.filter(b=>matching(skill,b)&&priority.modes.includes(b.mode)&&kinds.includes(b.kind));
  choices.sort((a,b)=>kinds.indexOf(a.kind)-kinds.indexOf(b.kind)||a.id.localeCompare(b.id));
  const activity=choices[0];
  if(!activity){missingActivitySkillIds.push(skill.id);blockedSkillIds.add(skill.id);unavailableSkillIds.add(skill.id);continue;}
  if(!activity.href.startsWith("/student/")||activity.href.includes("\\")||/[\r\n]/.test(activity.href))throw Error("Invalid student activity destination");
  const estimatedMinutes=activity.estimatedMinutes??5;
  if(!Number.isFinite(estimatedMinutes)||estimatedMinutes<=0)throw Error("Invalid activity duration");
  activities.push({skillId:skill.id,activityId:activity.id,kind:activity.kind,action,titleFr:activity.titleFr,href:activity.kind==="independent_check"||activity.contentId?granularActivityHref(activity.id):activity.href,estimatedMinutes,...(activity.contentId?{contentId:activity.contentId}:{})});
 }
 // Keep evidence/prerequisite order within each area, but do not let a large
 // early alphabetical catalogue occupy every visible next-step slot.
 const queues=new Map<string,typeof activities>();
 for(const activity of activities){
  const skill=byId.get(activity.skillId)!;
  const area=skill.domain??skill.samplingGroup??skill.branch;
  queues.set(area,[...(queues.get(area)??[]),activity]);
 }
 // Keep the most recently taught, still-unresolved target visible inside its
 // subject area while fresh checks remain. Domain rotation still applies.
 const taughtOrder=new Map([...completedContentIds].map((id,index)=>[id,index]));
 const continuationRank=(activity:typeof activities[number])=>{
  if(activity.kind!=="independent_check")return -1;
  const skill=byId.get(activity.skillId)!;
  return Math.max(-1,...bindings.filter(b=>matching(skill,b)&&b.kind==="instruction"&&b.contentId&&taughtOrder.has(b.contentId)).map(b=>taughtOrder.get(b.contentId!)!));
 };
 for(const queue of queues.values())queue.sort((a,b)=>continuationRank(b)-continuationRank(a));
 const selected:typeof activities=[];
 for(let round=0;selected.length<limit;round++){
  let added=false;
  for(const queue of queues.values()){
   if(queue[round]&&selected.length<limit){selected.push(queue[round]);added=true;}
  }
  if(!added)break;
 }
 return {activities:selected,missingActivitySkillIds,blockedSkillIds:[...blockedSkillIds]};
}
