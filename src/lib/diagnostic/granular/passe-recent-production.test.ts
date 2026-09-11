import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PASSE_RECENT_APPLICATIONS as rows,PASSE_RECENT_PRODUCTION_TEACHING as lessons} from './passe-recent-production';
import {conjugationFacet} from './facets';
import {PERSONS} from '../../linguistic/conjugation';
import {validateAnswer} from '../../linguistic/validator';
import {writtenGuessingFloor} from './response-space';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const venir={'1s':'viens','2s':'viens','3s':'vient','1p':'venons','2p':'venez','3p':'viennent'};
it('assesses four families and all persons, requiring venir plus de or d’ and an infinitive',async()=>{
 const expansion=read('generated/french-v3-passe-recent-production-expansion.json') as DraftExpansion;
 expect(rows).toHaveLength(48);expect(lessons).toHaveLength(4);
 const facet=(r:typeof rows[number])=>conjugationFacet('produire_passe_recent',{verb:r.verb,tense:'passe_recent',person:r.person});
 expect(new Set(rows.map(facet)).size).toBe(4);
 for(const key of new Set(rows.map(facet))){const cases=rows.filter(r=>facet(r)===key);expect(cases).toHaveLength(12);expect(new Set(cases.map(r=>r.person))).toEqual(new Set(PERSONS));}
 for(const [i,row] of rows.entries()){
  expect(row.answer).toBe(`${venir[row.person]} ${/^[aeioué]/.test(row.verb)?'d’':'de '}${row.verb}`);
  const item=expansion.items[i].item,spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,config:item.validatorConfig};
  expect((await validateAnswer(row.answer,spec)).pass).toBe(true);
  expect((await validateAnswer(`${venir[row.person]} ${row.verb}`,spec)).pass).toBe(false);
  expect((await validateAnswer(`${venir[row.person]} de terminé`,spec)).pass).toBe(false);
  // Je and tu share viens: five distinct surface responses, not six.
  expect(writtenGuessingFloor(item)).toBeCloseTo(1/5);
 }
});
it('keeps guided exposure out of independent applications and releases the complete prerequisite chain',()=>{
 const expansion=read('generated/french-v3-passe-recent-production-expansion.json') as DraftExpansion;
 const scoped=read('docs/diagnostic/v3-scoped-review-candidate.json');
 const known=new Set(lessons.flatMap(teachingMaterialKeys));
 for(const entry of expansion.items){expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();expect(questionAssessedMaterialKeys(entry.item).some(k=>known.has(k))).toBe(false);}
 for(const lesson of lessons){
  const skill=scoped.assessment.skills.find((s:{nodeKey:string;facetKey:string})=>s.nodeKey===lesson.nodeKey&&s.facetKey===lesson.facetKey);
  expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(skill.id);
  for(const prerequisite of skill.prerequisites)expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(prerequisite);
 }
});
