import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {assessSkills,type Observation,type Probe} from './engine';
import {planGranularActivities,type LearningActivityBinding} from './activity-plan';
import type {V3Assessment} from './v3-adapter';
const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
const assessment=candidate.assessment as V3Assessment;
const skillId=(tense:string,verb:string)=>`produire_${tense}::writing-controlled-production::verb:${verb}`;
const observation=(probe:Probe,correct:boolean):Observation=>({itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct,guessProbability:probe.guessProbability,activeSeconds:probe.expectedSeconds,unaided:true,occasionId:'synthetic-diagnostic-day',negativeExampleAssessed:probe.negativeExampleAssessed,materialReceipt:{presentationId:`synthetic:${probe.id}`,sourceChecksum:'test-only',historyComplete:true,firstRecordedKeys:probe.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:probe.assessedMaterialKeys}});

// Prescribed synthetic evidence checks aggregation and routing, not whether
// an initial adaptive sitting samples every one of these targets.
it.each([
 ['present_indicatif','être','present_indicatif','avoir'],
 ['present_indicatif','avoir','present_indicatif','être'],
 ['imparfait','aller','futur_simple','aller'],
 ['futur_simple','aller','imparfait','aller'],
 ['futur_simple','prendre','futur_simple','venir'],
 ['imparfait','voir','imparfait','faire'],
 ['futur_simple','aller','conditionnel_present','aller'],
 ['conditionnel_present','aller','futur_simple','aller'],
])('separates %s/%s success from %s/%s difficulty', (knownTense,knownVerb,weakTense,weakVerb)=>{
 const knownId=skillId(knownTense,knownVerb),weakId=skillId(weakTense,weakVerb);
 const targets=[knownId,weakId].map(id=>assessment.skills.find(skill=>skill.id===id)!);
 expect(targets.every(Boolean)).toBe(true);
 const prerequisiteIds=new Set<string>();
 const include=(id:string)=>{if(prerequisiteIds.has(id))return;prerequisiteIds.add(id);assessment.skills.find(s=>s.id===id)!.prerequisites.forEach(include);};
 targets.forEach(target=>target.prerequisites.forEach(include));
 // Previously established foundations are an explicit fixture assumption.
 const prior:Observation[]=[...prerequisiteIds].filter(id=>id!==knownId&&id!==weakId).flatMap(id=>{
  const skill=assessment.skills.find(s=>s.id===id)!;
  return Array.from({length:8},(_,i)=>({itemId:`prior:${id}:${i}`,skillId:id,mode:skill.modes[0],contextId:`prior:${i}`,correct:true,guessProbability:.01,activeSeconds:0,unaided:true,occasionId:`prior-day-${i%2}`,negativeExampleAssessed:true}));
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
 const untouched=skillId('futur_simple','savoir');
 expect(results.find(r=>r.skillId===untouched)).toMatchObject({status:'unknown',evidence:'untested'});
});
