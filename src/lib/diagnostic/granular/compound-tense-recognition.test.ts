import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {COMPOUND_RECOGNITION_DRAFTS,COMPOUND_RECOGNITION_TEACHING} from './compound-tense-recognition';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
import type {V3Assessment} from './v3-adapter';
import {assessSkills,type Observation,type Probe} from './engine';
import {planGranularActivities,type LearningActivityBinding} from './activity-plan';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));

it('contrasts complete compound forms, including être, avoir, negation and pronominal verbs',()=>{
 const expected={
  'passe-compose':['ai photographié','as rempli','est sortie','avons écrit','avez vu','sont arrivés','ai pas reçu','as déjà entendu','a été','avons eu','êtes levés','ont fait'],
  'plus-que-parfait':['avais réservé','avais perdu','était descendue','avions lu','aviez pris','étaient rentrés','avais pas ouvert','avais déjà réparé','avait été','avions eu','étiez couchés','avaient fait'],
 };
 for(const [prefix,forms] of Object.entries(expected)){
  const questions=COMPOUND_RECOGNITION_DRAFTS.filter(d=>d.key.startsWith(prefix));
  expect(questions).toHaveLength(12);
  for(const [index,q] of questions.entries()){
   expect(q.answer).toContain(forms[index]);
   expect(new Set([q.answer,...q.distractors]).size).toBe(4);
   expect(q.assessedTexts).toEqual([q.answer,...q.distractors]);
  }
 }
 expect(COMPOUND_RECOGNITION_DRAFTS.filter(d=>d.nodeKey==='reconnaitre_auxiliaire')).toHaveLength(12);
 const auxiliary=COMPOUND_RECOGNITION_DRAFTS.filter(d=>d.nodeKey==='reconnaitre_auxiliaire');
 const lengths=auxiliary.map(d=>({answer:d.answer.split(/\s+/).length,others:d.distractors.map(s=>s.split(/\s+/).length)}));
 expect(lengths.filter(x=>x.others.every(n=>x.answer>n)).length).toBeLessThanOrEqual(3);
 expect(lengths.filter(x=>x.others.every(n=>x.answer<n)).length).toBeGreaterThan(0);
});

// Prescribed evidence verifies skill separation and routing. It does not claim
// the selector can sample all of these contrasts in every initial sitting.
it.each([true,false])('routes to the weak compound tense with passé composé correct=%s',passeComposeCorrect=>{
 const candidate=read('docs/diagnostic/v3-scoped-review-candidate.json');
 const assessment=candidate.assessment as V3Assessment;
 const known=`reconnaitre_${passeComposeCorrect?'passe_compose':'plus_que_parfait'}::reading-receptive`;
 const weak=`reconnaitre_${passeComposeCorrect?'plus_que_parfait':'passe_compose'}::reading-receptive`;
 const observation=(p:Probe,correct:boolean,occasionId:string):Observation=>({itemId:p.id,skillId:p.skillId,mode:p.mode,contextId:p.contextId,correct,guessProbability:p.guessProbability,activeSeconds:p.expectedSeconds,unaided:true,occasionId,materialReceipt:{presentationId:`synthetic:${p.id}`,sourceChecksum:'test-only',historyComplete:true,firstRecordedKeys:p.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:p.assessedMaterialKeys}});
 const foundations=assessment.probes.filter(p=>p.skillId==='reconnaitre_auxiliaire::reading-receptive').map((p,i)=>observation(p,true,`previous-day-${i%2}`));
 const answers=assessment.probes.filter(p=>[known,weak].includes(p.skillId)&&p.usage==='initial').map(p=>observation(p,p.skillId===known,'diagnostic-day'));
 const results=assessSkills(assessment.skills,[...foundations,...answers]);
 expect(results.find(r=>r.skillId===known)?.modes[0]).toMatchObject({confirmed:false});
 expect(results.find(r=>r.skillId===known)!.modes[0].probability).toBeGreaterThan(.85);
 expect(results.find(r=>r.skillId===weak)?.modes[0].provisionalGap).toBe(true);
 const bindings=candidate.activities.map((a:LearningActivityBinding)=>({...a,status:'published'}));
 const plan=planGranularActivities(assessment,results,bindings,20);
 const lesson=COMPOUND_RECOGNITION_TEACHING.find(l=>`${l.nodeKey}::reading-receptive`===weak)!;
 expect(plan.activities.find(a=>a.skillId===weak&&a.kind==='instruction')?.contentId).toBe(lesson.id);
 expect(plan.activities.some(a=>a.skillId===known&&a.kind==='instruction')).toBe(false);
 expect(results.find(r=>r.skillId==='produire_passe_compose::writing-controlled-production::verb:avoir')).toMatchObject({status:'unknown',evidence:'untested'});
});

it('keeps independent questions separate from all three lessons and from each other’s pools',()=>{
 const expansion=read('generated/french-v3-tense-recognition-expansion.json') as DraftExpansion;
 const taught=new Set(COMPOUND_RECOGNITION_TEACHING.flatMap(teachingMaterialKeys));
 const materialOwners=new Map<string,string>();
 for(const draft of COMPOUND_RECOGNITION_DRAFTS){
  const entry=expansion.items.find(i=>i.itemKey===`v3-tense-recognition:${draft.key}`)!;
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  for(const key of questionAssessedMaterialKeys(entry.item)){
   expect(taught.has(key),draft.key).toBe(false);
   expect(materialOwners.has(key),`${draft.key} repeats ${materialOwners.get(key)}`).toBe(false);
   materialOwners.set(key,draft.key);
  }
 }
});

it('preserves recognition criteria and the auxiliary prerequisite without claiming verb production',()=>{
 const candidate=read('docs/diagnostic/v3-scoped-review-candidate.json');
 const assessment=candidate.assessment as V3Assessment;
 for(const lesson of COMPOUND_RECOGNITION_TEACHING){
  expect(lesson.mode).toBe('recognition');expect(lesson.practice).toHaveLength(6);
  const id=`${lesson.nodeKey}::reading-receptive`;
  const skill=assessment.skills.find(s=>s.id===id)!;
  expect(skill.evidenceRequirements?.recognition).toMatchObject({minimumItems:3,minimumAccuracy:.8,minimumOccasions:2});
  if(lesson.nodeKey!=='reconnaitre_auxiliaire')expect(skill.prerequisites).toContain('reconnaitre_auxiliaire::reading-receptive');
  const probes=assessment.probes.filter(p=>p.skillId===id);
  const initial=probes.filter(p=>p.usage==='initial'),later=probes.filter(p=>p.usage==='learning');
  expect(initial.length).toBeGreaterThanOrEqual(3);expect(later.length).toBeGreaterThanOrEqual(3);
  expect(later.some(p=>initial.some(q=>q.contextId===p.contextId))).toBe(false);
  expect(probes.every(p=>p.mode==='recognition')).toBe(true);
 }
});
