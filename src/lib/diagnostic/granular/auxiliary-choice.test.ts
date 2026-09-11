import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {AUXILIARY_CHOICE_DRAFTS,AUXILIARY_CHOICE_TEACHING} from './auxiliary-choice';
import {canonicalProbeMetrics} from './probe-metrics';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {assessSkills,type Observation,type Probe} from './engine';
import type {DraftExpansion} from './assemble-drafts';
import type {V3Assessment} from './v3-adapter';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
it('maps four auxiliary constructions separately and keeps the binary guessing floor',()=>{
 const expansion=read('generated/french-v3-auxiliary-choice-expansion.json') as DraftExpansion;
 expect(expansion.items).toHaveLength(70);
 for(const draft of AUXILIARY_CHOICE_DRAFTS){
  const entry=expansion.items.find(i=>i.itemKey===`v3-auxiliary-choice:${draft.key}`)!;
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.5);
  expect(entry.item.validatorConfig!.finiteResponseSpace).toMatchObject({alternatives:[draft.answer,draft.other]});
  expect(entry.evidenceKey).toBe('writing-controlled-production');
  expect(expansion.annotations.find(a=>a.itemKey===entry.itemKey)?.facetKey).toBe(`choisir_auxiliaire_compose::construction:${draft.kind}`);
 }
});
it('provides disjoint initial, teaching and follow-up material for every construction',()=>{
 const expansion=read('generated/french-v3-auxiliary-choice-expansion.json') as DraftExpansion;
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json');
 const taught=new Set(AUXILIARY_CHOICE_TEACHING.flatMap(teachingMaterialKeys));
 for(const item of expansion.items)expect(questionAssessedMaterialKeys(item.item).some(k=>taught.has(k)),item.itemKey).toBe(false);
 for(const lesson of AUXILIARY_CHOICE_TEACHING){
  const readiness=candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id);
  expect(readiness.freshCheckAvailable,lesson.id).toBe(true);
  const skill=candidate.assessment.skills.find((s:{facetKey:string})=>s.facetKey===lesson.facetKey);
  expect(skill.prerequisites).toEqual(['reconnaitre_auxiliaire::reading-receptive']);
  expect(skill.evidenceRequirements.production).toMatchObject({minimumAccuracy:.8,minimumItems:3,minimumOccasions:2});
  const pools=candidate.assessment.probes.filter((p:Probe)=>p.skillId===skill.id);
  for(const usage of ['initial','learning'])expect(pools.filter((p:Probe)=>p.usage===usage).length).toBeGreaterThanOrEqual(7);
 }
});
it('cannot confirm changing auxiliaries from only direct-object examples',()=>{
 const assessment=read('docs/diagnostic/v3-parallel-review-candidate.json').assessment as V3Assessment;
 const id='choisir_auxiliaire_compose::writing-controlled-production::construction:transitivity';
 const probes=assessment.probes.filter(p=>p.skillId===id);
 const observation=(p:Probe,i:number):Observation=>({itemId:p.id,skillId:p.skillId,mode:p.mode,contextId:p.contextId,correct:true,guessProbability:p.guessProbability,activeSeconds:10,unaided:true,occasionId:`synthetic-day-${i%2}`,evidenceFeatures:p.evidenceFeatures});
 const withObject=probes.filter(p=>p.evidenceFeatures?.includes('direct-object-avoir')).map(observation);
 const onlyOne=assessSkills(assessment.skills,withObject).find(r=>r.skillId===id)!;
 expect(onlyOne.modes[0].confirmed).toBe(false);
 expect(onlyOne.modes[0].unconfirmedFeatures).toContain('no-direct-object-etre');
 const both=assessSkills(assessment.skills,probes.map(observation)).find(r=>r.skillId===id)!;
 expect(both.modes[0].confirmed).toBe(true);
 expect(both.modes[0].unconfirmedFeatures??[]).toHaveLength(0);
 const spelling=read('generated/french-v3-auxiliary-choice-expansion.json') as DraftExpansion;
 // All assessment transitivity examples use masculine-singular participles:
 // a final agreement marker must not reveal the auxiliary choice.
 const transitive=spelling.items.filter(i=>i.itemKey.startsWith('v3-auxiliary-choice:transitivity-'));expect(transitive).toHaveLength(28);
 for(const entry of transitive){expect(entry.item.promptFr).not.toMatch(/___ (sorties|sortis|montés|montées|descendus|descendues)/);}
});
