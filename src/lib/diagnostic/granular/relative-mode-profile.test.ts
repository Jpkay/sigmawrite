import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {assessSkills,type Observation,type Probe} from './engine';
import {planGranularActivities,type LearningActivityBinding} from './activity-plan';
import type {V3Assessment} from './v3-adapter';
const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
const assessment=candidate.assessment as V3Assessment;

const observation=(probe:Probe,correct:boolean):Observation=>({itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct,guessProbability:probe.guessProbability,activeSeconds:probe.expectedSeconds,unaided:true,occasionId:'synthetic-diagnostic-day',negativeExampleAssessed:probe.negativeExampleAssessed,materialReceipt:{presentationId:`synthetic:${probe.id}`,sourceChecksum:'test-only',historyComplete:true,firstRecordedKeys:probe.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:probe.assessedMaterialKeys}});

// Prescribed synthetic evidence checks aggregation and routing, not whether
// an initial adaptive sitting samples every one of these targets.
it.each([true,false])('keeps relative recognition=%s separate from production',recognitionCorrect=>{
 const recognitionId='construction_subordonnee_relative::reading-analysis',productionId='construction_subordonnee_relative::writing-controlled-production';
 const knownId=recognitionCorrect?recognitionId:productionId,weakId=recognitionCorrect?productionId:recognitionId;
 const targets=[knownId,weakId].map(id=>assessment.skills.find(skill=>skill.id===id)!);
 expect(targets.every(Boolean)).toBe(true);
 const prerequisiteIds=new Set<string>();
 const include=(id:string)=>{if(prerequisiteIds.has(id))return;prerequisiteIds.add(id);assessment.skills.find(s=>s.id===id)!.prerequisites.forEach(include);};
 targets.forEach(target=>target.prerequisites.forEach(include));
 // Previously established foundations are an explicit fixture assumption.
 const prior:Observation[]=[...prerequisiteIds].filter(id=>id!==knownId&&id!==weakId).flatMap(id=>{
  const skill=assessment.skills.find(s=>s.id===id)!;
  return Array.from({length:8},(_,i)=>({itemId:`prior:${id}:${i}`,skillId:id,mode:skill.modes[0],contextId:`prior:${i}`,correct:true,guessProbability:.01,activeSeconds:0,unaided:true,occasionId:`prior-day-${i%2}`,negativeExampleAssessed:true,materialReceipt:{presentationId:`prior:${id}:${i}`,sourceChecksum:'synthetic-foundation',historyComplete:true,firstRecordedKeys:[`sentence:sha256:${i.toString().padStart(64,'0')}`],previouslySeenKeys:[]}}));
 });
 const answers=targets.flatMap(target=>{
  const pool=assessment.probes.filter(p=>p.skillId===target.id&&p.usage==='initial');
  expect(pool.length).toBeGreaterThanOrEqual(3);
  return pool.map(probe=>observation(probe,target.id===knownId));
 });
 const results=assessSkills(assessment.skills,[...prior,...answers]);
 const known=results.find(r=>r.skillId===knownId)!,weak=results.find(r=>r.skillId===weakId)!;
 expect(known.modes[0].probability).toBeGreaterThan(.85);
 expect(weak.modes[0].provisionalGap).toBe(true);
 expect(known.modes[0].confirmed).toBe(false);
 expect(weak.modes[0].confirmed).toBe(false);
 const bindings:LearningActivityBinding[]=candidate.activities.map((a:LearningActivityBinding)=>({...a,status:'published'}));
 const plan=planGranularActivities(assessment,results,bindings,20);
 expect(plan.activities.some(a=>a.skillId===weakId&&a.kind==='instruction')).toBe(true);
 expect(plan.activities.some(a=>a.skillId===knownId&&a.kind==='instruction')).toBe(false);
 const firstLesson=plan.activities.find(a=>a.skillId===weakId&&a.kind==='instruction')!;
 expect(firstLesson.contentId).toBe(recognitionCorrect?'french-v3-teaching:relative-clause:production':'french-v3-teaching:relative-clause:recognition');
 const withoutFoundations=planGranularActivities(assessment,assessSkills(assessment.skills,answers),bindings,20);
 expect(withoutFoundations.activities.some(a=>a.skillId===weakId&&a.kind==='instruction')).toBe(false);
 // Guided work is not an independent success and must not erase the gap.
 const guided=answers.filter(a=>a.skillId===weakId).map(a=>({...a,itemId:`guided:${a.itemId}`,source:'learning' as const,correct:true,unaided:false,occasionId:'later-guided-day'}));
 expect(assessSkills(assessment.skills,[...prior,...answers,...guided]).find(r=>r.skillId===weakId)?.modes[0].provisionalGap).toBe(true);
 const assistedErrors=answers.filter(a=>a.skillId===knownId).map(a=>({...a,itemId:`assisted-error:${a.itemId}`,source:'learning' as const,correct:false,unaided:false,occasionId:'later-guided-day'}));
 expect(assessSkills(assessment.skills,[...prior,...answers,...assistedErrors]).find(r=>r.skillId===knownId)).toEqual(known);
 const later=assessment.probes.filter(p=>p.skillId===weakId&&p.usage==='learning').map((p,index)=>({...observation(p,true),source:'learning' as const,occasionId:`fresh-check-day-${index%2}`}));
 expect(later.length).toBeGreaterThanOrEqual(3);
 const refined=assessSkills(assessment.skills,[...prior,...answers,...later]);
 expect(refined.find(r=>r.skillId===weakId)).toMatchObject({status:'mastered',resolved:true});
 expect(refined.find(r=>r.skillId===knownId)).toEqual(known);
 expect(planGranularActivities(assessment,refined,bindings,20).activities.some(a=>a.skillId===weakId&&a.kind==='instruction')).toBe(false);
 const untouched='construction_subordonnee_completive::writing-controlled-production';
 expect(results.find(r=>r.skillId===untouched)).toMatchObject({status:'unknown',evidence:'untested'});
});
