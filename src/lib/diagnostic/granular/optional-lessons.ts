import type {SkillResult} from './engine';
import type {V3Assessment} from './v3-adapter';
import type {LearningActivityBinding} from './activity-plan';
import {inspectReleaseScope} from './release-scope';
import {granularActivityHref} from './activity-navigation';

/** Learning access is not an assessment claim. These choices never alter evidence. */
export function optionalLessons(assessment:V3Assessment,results:readonly SkillResult[],bindings:readonly LearningActivityBinding[],completed:ReadonlySet<string>,recommended:ReadonlySet<string>,limit=3){
 const scope=assessment.releaseScope===undefined?undefined:inspectReleaseScope(assessment.skills,assessment.releaseScope);
 const ready=(id:string)=>{
  const skill=assessment.skills.find(s=>s.id===id),result=results.find(r=>r.skillId===id);
  return Boolean(skill&&result?.evidence==='direct'&&skill.modes.every(mode=>{
   const observed=result.modes.find(m=>m.mode===mode);
   return observed&&observed.distinctItems>0&&Number.isFinite(observed.probability)&&observed.probability>=.65;
  }));
 };
 const choices=assessment.skills.flatMap(skill=>{
  const result=results.find(r=>r.skillId===skill.id);
  if(result?.resolved||scope&&!scope.teachingSkillIds.has(skill.id)||skill.prerequisites.some(id=>!ready(id)))return [];
  const binding=bindings.find(b=>b.status==='published'&&b.kind==='instruction'&&b.contentId&&!completed.has(b.contentId)&&!recommended.has(b.id)&&b.nodeKey===skill.nodeKey&&(b.facetKey??null)===(skill.facetKey??null)&&skill.modes.includes(b.mode));
  return binding?[{skillId:skill.id,activityId:binding.id,kind:"instruction" as const,contentId:binding.contentId!,titleFr:binding.titleFr,href:granularActivityHref(binding.id),area:skill.domain??skill.samplingGroup??skill.branch}]:[];
 });
 const selected:typeof choices=[];
 const areas=[...new Set(choices.map(c=>c.area))];
 for(let round=0;selected.length<limit;round++){
  let added=false;
  for(const area of areas){const next=choices.filter(c=>c.area===area)[round];if(next&&selected.length<limit){selected.push(next);added=true;}}
  if(!added)break;
 }
 return selected.map(({area,...choice})=>choice);
}
