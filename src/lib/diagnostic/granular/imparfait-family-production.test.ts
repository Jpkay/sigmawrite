import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {IMPARFAIT_FAMILY_APPLICATIONS as rows,IMPARFAIT_FAMILY_TEACHING as lessons} from './imparfait-family-production';
import {conjugationFacet} from './facets';
import {PERSONS} from '../../linguistic/conjugation';
import {validateAnswer} from '../../linguistic/validator';
import {writtenGuessingFloor} from './response-space';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('covers four patterns and all persons with independently specified spelling contrasts',async()=>{
 const expansion=read('generated/french-v3-imparfait-family-production-expansion.json') as DraftExpansion;
 expect(rows).toHaveLength(48);expect(lessons).toHaveLength(4);
 const facet=(r:typeof rows[number])=>conjugationFacet('produire_imparfait',{verb:r.verb,tense:'imparfait',person:r.person});
 expect(new Set(rows.map(facet)).size).toBe(4);
 for(const key of new Set(rows.map(facet))){const cases=rows.filter(r=>facet(r)===key);expect(cases).toHaveLength(12);expect(new Set(cases.map(r=>r.person))).toEqual(new Set(PERSONS));}
 const pairs=[['manger','1s','mangeais','mangais'],['manger','1p','mangions','mangeions'],['nager','2p','nagiez','nageiez'],['commencer','1s','commençais','commencais'],['commencer','1p','commencions','commençions'],['lancer','2p','lanciez','lançiez'],['finir','1s','finissais','finisais']] as const;
 for(const [verb,person,right,wrong] of pairs){
  const i=rows.findIndex(r=>r.verb===verb&&r.person===person);expect(i).toBeGreaterThanOrEqual(0);expect(rows[i].answer).toBe(right);
  const item=expansion.items[i].item,spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,config:item.validatorConfig};
  expect((await validateAnswer(right,spec)).pass).toBe(true);expect((await validateAnswer(wrong,spec)).pass).toBe(false);
 }
 for(const entry of expansion.items)expect(writtenGuessingFloor(entry.item)).toBeCloseTo(1/5);
});
it('keeps each guided verb and distinguishes sound-preserving adjustments from endings',()=>{
 expect(lessons.find(l=>l.facetKey?.endsWith('regular_er'))!.practice.map(p=>p.answerFr)).toEqual(['dessinais','collais','portait','écoutions','visitiez','filmaient']);
 expect(lessons.find(l=>l.facetKey?.endsWith('regular_ir'))!.practice.map(p=>p.answerFr)).toEqual(['nourrissais','remplissais','ralentissait','réfléchissions','obéissiez','applaudissaient']);
 expect(lessons.find(l=>l.facetKey?.endsWith('spelling_ger'))!.practice.map(p=>p.answerFr)).toEqual(['nageais','mangeais','voyageait','bougions','mélangions','partagions','rangiez','chargeaient']);
 expect(lessons.find(l=>l.facetKey?.endsWith('spelling_cer'))!.practice.map(p=>p.answerFr)).toEqual(['avançais','lançais','commençait','placions','annoncions','remplacions','effaciez','traçaient']);
 for(const lesson of lessons){expect(lesson.status).toBe('draft_requires_review');expect(lesson.mode).toBe('production');expect(lesson.boundaryFr).toContain('pas le choix');}
});
it('provides teaching and fresh checks without reusing taught sentences',()=>{
 const expansion=read('generated/french-v3-imparfait-family-production-expansion.json') as DraftExpansion;
 const scoped=read('docs/diagnostic/v3-scoped-review-candidate.json');
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 for(const entry of expansion.items){expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);}
 for(const lesson of lessons){const skill=scoped.assessment.skills.find((s:{nodeKey:string;facetKey:string})=>s.nodeKey===lesson.nodeKey&&s.facetKey===lesson.facetKey);expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(skill.id);for(const prerequisite of skill.prerequisites)expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(prerequisite);}
});
