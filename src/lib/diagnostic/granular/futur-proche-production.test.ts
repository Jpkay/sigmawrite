import {writtenGuessingFloor} from "./response-space";
import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {FUTUR_PROCHE_APPLICATIONS as rows,FUTUR_PROCHE_PRODUCTION_TEACHING as lessons} from './futur-proche-production';
import {PERSONS,conjugate} from '../../linguistic/conjugation';
import {validateAnswer} from '../../linguistic/validator';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const aller={ '1s':'vais','2s':'vas','3s':'va','1p':'allons','2p':'allez','3p':'vont'};
it('assesses each verb and person without accepting a conjugated second verb',async()=>{
 const expansion=read('generated/french-v3-futur-proche-production-expansion.json') as DraftExpansion;
 expect(rows).toHaveLength(168);expect(lessons).toHaveLength(14);
 for(const verb of new Set(rows.map(r=>r.verb))){
  const cases=rows.filter(r=>r.verb===verb);expect(cases).toHaveLength(12);
  expect(new Set(cases.map(r=>r.person))).toEqual(new Set(PERSONS));
 }
 for(const row of rows){
  expect(row.answer).toBe(`${aller[row.person]} ${row.verb}`);
  expect(row.sentence).not.toMatch(/^J[’'] ___/);
  const item=expansion.items.find(e=>e.item.validatorConfig?.verb===row.verb&&e.item.validatorConfig?.person===row.person&&e.item.promptFr.includes(row.sentence))!.item;
  expect(writtenGuessingFloor(item)).toBeCloseTo(1/6);
  const spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,config:item.validatorConfig};
  expect((await validateAnswer(row.answer,spec)).pass).toBe(true);
  expect((await validateAnswer(`${aller[row.person]} ${conjugate(row.verb,'present',row.person)}`,spec)).pass).toBe(false);
 }
});
it('keeps guided material separate and makes all fourteen individual targets available with fresh checks',()=>{
 const expansion=read('generated/french-v3-futur-proche-production-expansion.json') as DraftExpansion;
 const prepared=read('docs/diagnostic/v3-parallel-review-candidate.json');
 const scoped=read('docs/diagnostic/v3-scoped-review-candidate.json');
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 for(const entry of expansion.items){expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);}
 for(const lesson of lessons){
  const ready=prepared.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id);
  expect(ready?.freshCheckAvailable).toBe(true);
  expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(`produire_futur_proche::writing-controlled-production::verb:${lesson.facetKey!.split(':').at(-1)}`);
 }
});
