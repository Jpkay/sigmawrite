import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PLUS_QUE_PARFAIT_TEACHING} from './plus-que-parfait-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const expansion=JSON.parse(readFileSync('generated/french-v3-conjugation-expansion.json','utf8')) as DraftExpansion;
it('uses the stated subjects and distinguishes leaving from taking something out',()=>{
 const lesson=(verb:string)=>PLUS_QUE_PARFAIT_TEACHING.find(l=>l.id.endsWith(`:${verb}`))!;
 expect(lesson('partir').practice.map(p=>p.answerFr)).toEqual(['étais parti','étais parti','était partie','étions partis','étiez partis','étaient partis']);
 expect(lesson('venir').practice.map(p=>p.answerFr)).toEqual(['étais venu','étais venu','était venu','étions venus','étiez venus','étaient venues']);
 expect(lesson('sortir').practice.map(p=>p.answerFr)).toEqual(['étais sorti','avais sorti','était sorti','avions sorti','étiez sortis','étaient sorties']);
 expect(lesson('partir').practice[3].promptFr).toContain('dix minutes après le concert');
 expect(lesson('partir').practice[2].promptFr).toContain('Sujet féminin singulier');
});
it('assesses feminine and masculine agreements and both auxiliary constructions independently of guided examples',()=>{
 const items=expansion.items.filter(i=>i.itemKey.includes('plus_que_parfait-application-context:'));
 expect(items).toHaveLength(168);
 const sortir=items.filter(i=>i.itemKey.includes(':sortir:'));
 expect(sortir.map(i=>i.item.correctAnswer)).toEqual(['avais sorti','étais sortie','était sortie','étions sortis','aviez sorti','étaient sorties','avais sorti','étais sorti','était sorti','étions sorties','aviez sorti','étaient sortis']);
 const taught=new Set(PLUS_QUE_PARFAIT_TEACHING.flatMap(teachingMaterialKeys));
 for(const entry of items){
  expect(entry.reviewStatus).toBe('needs_human_review');
  expect(entry.review).toBeUndefined();
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k)),entry.itemKey).toBe(false);
 }
 expect(PLUS_QUE_PARFAIT_TEACHING).toHaveLength(14);
 for(const l of PLUS_QUE_PARFAIT_TEACHING){
  expect(l.status).toBe('draft_requires_review');
  expect(l.materialExposure?.sentences?.some(s=>s.includes('___'))).toBe(false);
 }
});

it('does not count the same sentence gap as fresh just because the requested tense changed',()=>{
 const earlier=expansion.items.filter(i=>i.itemKey.includes('passe_compose-application-context:'));
 const later=expansion.items.filter(i=>i.itemKey.includes('plus_que_parfait-application-context:'));
 for(const entry of later){
  const paired=earlier.find(p=>p.itemKey===entry.itemKey.replace('plus_que_parfait','passe_compose'))!;
  expect(paired).toBeDefined();
  const known=new Set(questionAssessedMaterialKeys(paired.item));
  expect(questionAssessedMaterialKeys(entry.item).some(k=>known.has(k)),entry.itemKey).toBe(true);
  expect(entry.item.correctAnswer).not.toBe(paired.item.correctAnswer);
 }
});

it('keeps observed passe compose success separate from an untested plus-que-parfait target',async()=>{
 const {assessSkills}=await import('./engine');
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 const a=candidate.assessment;
 const pc='produire_passe_compose::writing-controlled-production::verb:venir';
 const pqp='produire_plus_que_parfait::writing-controlled-production::verb:venir';
 expect(a.releaseScope.assessmentSkillIds).toContain(pc);
 expect(a.releaseScope.assessmentSkillIds).toContain(pqp);
 const probes=a.probes.filter((p:{skillId:string;usage:string})=>p.skillId===pc&&p.usage==='initial');
 const observations=probes.map((p:import('./engine').Probe)=>({...p,itemId:p.id,correct:true,unaided:true,activeSeconds:30,occasionId:'synthetic-day'}));
 const results=assessSkills(a.skills,observations);
 expect(results.find(r=>r.skillId===pc)?.modes[0].probability).toBeGreaterThan(.85);
 expect(results.find(r=>r.skillId===pqp)).toMatchObject({status:'unknown',evidence:'untested'});
});
