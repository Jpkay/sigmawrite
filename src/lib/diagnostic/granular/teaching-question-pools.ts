import {allocateQuestionPools,isQuestionPoolSufficient} from './question-pools';
import {teachingMaterialKeys} from './material-annotations';
import type {TargetTeachingContent} from './teaching-content';
import type {V3Assessment} from './v3-adapter';

/** Preparation only: preserve successful partitions. If teaching would exhaust a
 * reserve, try allocating that target solely from untaught applications. Accept
 * the replacement only when both pools still satisfy the unchanged contract.
 * No stored release, student evidence or graph requirement is modified. */
export function allocateTeachingQuestionPools(source:V3Assessment,lessons:readonly TargetTeachingContent[]){
 const original=allocateQuestionPools(source);
 const attempts=lessons.flatMap(lesson=>{
  const skill=source.skills.find(s=>s.nodeKey===lesson.nodeKey&&s.facetKey===lesson.facetKey&&s.modes.includes(lesson.mode));
  if(!skill)return [];
  const taught=new Set(teachingMaterialKeys(lesson));
  const excluded=new Set(source.probes.filter(p=>p.skillId===skill.id&&p.mode===lesson.mode&&(p.assessedMaterialKeys??p.materialKeys??[]).some(k=>taught.has(k))).map(p=>p.id));
  const remaining=original.assessment.probes.filter(p=>p.skillId===skill.id&&p.mode===lesson.mode&&p.usage==='learning'&&!excluded.has(p.id));
  if(!excluded.size||isQuestionPoolSufficient(remaining,skill,lesson.mode,true))return [];
  return [{lessonId:lesson.id,skill,mode:lesson.mode,excluded}];
 });
 if(!attempts.length)return {...original,teachingPoolRepairs:[]};
 const omitted=new Set(attempts.flatMap(a=>[...a.excluded]));
 const trial=allocateQuestionPools({...source,probes:source.probes.filter(p=>!omitted.has(p.id))});
 const accepted=attempts.filter(a=>trial.coverage.some(c=>c.skillId===a.skill.id&&c.mode===a.mode&&c.status==='allocated')&&isQuestionPoolSufficient(trial.assessment.probes.filter(p=>p.skillId===a.skill.id&&p.mode===a.mode&&p.usage==='learning'),a.skill,a.mode,true));
 if(!accepted.length)return {...original,teachingPoolRepairs:[]};
 const excluded=new Set(accepted.flatMap(a=>[...a.excluded]));
 const result=allocateQuestionPools({...source,probes:source.probes.filter(p=>!excluded.has(p.id))});
 for(const a of accepted){
  if(!result.coverage.some(c=>c.skillId===a.skill.id&&c.mode===a.mode&&c.status==='allocated')||!isQuestionPoolSufficient(result.assessment.probes.filter(p=>p.skillId===a.skill.id&&p.mode===a.mode&&p.usage==='learning'),a.skill,a.mode,true))throw Error(`Teaching pool repair lost sufficiency: ${a.lessonId}`);
 }
 return {...result,teachingPoolRepairs:accepted.map(a=>({lessonId:a.lessonId,skillId:a.skill.id,excludedTaughtQuestionIds:[...a.excluded].sort()}))};
}
