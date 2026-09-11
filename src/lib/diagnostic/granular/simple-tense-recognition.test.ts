import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {conjugate,type Person} from '@/lib/linguistic/conjugation';
import {SIMPLE_TENSE_RECOGNITION_TEACHING} from './simple-tense-recognition-teaching';
import {TENSE_RECOGNITION_DRAFTS} from './tense-recognition-drafts';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const nodes=['reconnaitre_imparfait','reconnaitre_futur_simple'];
it('checks recognition answers across six persons and keeps production separate',()=>{
 const persons:Person[]=['1s','2s','3s','1p','2p','3p','1s','2s','3s','1p','2p','3p'];
 const explicitForms:Record<string,string>={'imparfait:lire:1p':'lisions','imparfait:écrire:2p':'écriviez','imparfait:dormir:3p':'dormaient','futur_simple:lire:1p':'lirons','futur_simple:écrire:2p':'écrirez','futur_simple:dormir:3p':'dormiront'};
 const verbs={imparfait:['dessiner','choisir','être','avoir','voir','prendre','aller','faire','venir','lire','écrire','dormir'],futur_simple:['porter','finir','être','avoir','voir','prendre','aller','faire','venir','lire','écrire','dormir']};
 for(const tense of ['imparfait','futur_simple'] as const){
  const drafts=TENSE_RECOGNITION_DRAFTS.filter(d=>d.nodeKey===`reconnaitre_${tense}`);
  expect(drafts).toHaveLength(12);
  drafts.forEach((draft,i)=>{
   const expected=explicitForms[`${tense}:${verbs[tense][i]}:${persons[i]}`]??conjugate(verbs[tense][i],tense,persons[i]);
   expect(draft.answer).toContain(expected);
   expect(new Set([draft.answer,...draft.distractors]).size).toBe(4);
  });
 }
 expect(SIMPLE_TENSE_RECOGNITION_TEACHING.map(l=>l.mode)).toEqual(['recognition','recognition']);
});
it('has disjoint question pools after teaching without fabricating review or mastery',()=>{
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json');
 const expansion=read('generated/french-v3-tense-recognition-expansion.json') as DraftExpansion;
 for(const lesson of SIMPLE_TENSE_RECOGNITION_TEACHING){
  expect(lesson.status).toBe('draft_requires_review');
  const teachingKeys=teachingMaterialKeys(lesson);
  const questions=expansion.items.filter(i=>i.item.nodeKey===lesson.nodeKey);
  expect(questions).toHaveLength(12);
  for(const question of questions){
   expect(question.reviewStatus).toBe('needs_human_review');
   expect(question.review).toBeUndefined();
   expect(question.evidenceKey).toBe('reading-receptive');
   expect(questionAssessedMaterialKeys(question.item).some(key=>teachingKeys.includes(key))).toBe(false);
  }
  const ready=candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id);
  expect(ready.freshCheckAvailable).toBe(true);
  const probes=candidate.assessment.probes.filter((p:{skillId:string})=>p.skillId===ready.skillId);
  const initial=probes.filter((p:{usage:string})=>p.usage==='initial').map((p:{id:string})=>p.id);
  const later=probes.filter((p:{usage:string})=>p.usage==='learning').map((p:{id:string})=>p.id);
  expect(initial.length).toBeGreaterThanOrEqual(3);expect(later.length).toBeGreaterThanOrEqual(3);
  expect(initial.some((id:string)=>later.includes(id))).toBe(false);
 }
 expect(nodes.every(node=>candidate.assessment.skills.some((s:{nodeKey:string})=>s.nodeKey===node))).toBe(true);
});
