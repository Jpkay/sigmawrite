import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PASSE_COMPOSE_FAMILY_APPLICATIONS as rows,PASSE_COMPOSE_FAMILY_TEACHING as lessons} from './passe-compose-family-production';
import {conjugationFacet} from './facets';
import {PERSONS} from '../../linguistic/conjugation';
import {validateAnswer} from '../../linguistic/validator';
import {writtenGuessingFloor} from './response-space';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('separately assesses four patterns and all persons with complete compound answers',async()=>{
 const expansion=read('generated/french-v3-passe-compose-family-production-expansion.json') as DraftExpansion;
 expect(rows).toHaveLength(48);expect(lessons).toHaveLength(4);
 const facet=(r:typeof rows[number])=>conjugationFacet('produire_passe_compose',{verb:r.verb,tense:'passe_compose',person:r.person});
 expect(new Set(rows.map(facet)).size).toBe(4);
 for(const key of new Set(rows.map(facet))){const cases=rows.filter(r=>facet(r)===key);expect(cases).toHaveLength(12);expect(new Set(cases.map(r=>r.person))).toEqual(new Set(PERSONS));}
 const pairs=[['manger','1s','ai mangé','ai mangeé'],['manger','1p','avons mangé','avons mangés'],['nager','2p','avez nagé','avez nager'],['commencer','1s','ai commencé','ai commençé'],['commencer','1p','avons commencé','avons commencer'],['lancer','2p','avez lancé','avez lançé'],['finir','1s','ai fini','ai finis']] as const;
 for(const [verb,person,right,wrong] of pairs){
  const i=rows.findIndex(r=>r.verb===verb&&r.person===person);expect(i).toBeGreaterThanOrEqual(0);expect(rows[i].answer).toBe(right);
  const item=expansion.items[i].item,spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,config:item.validatorConfig};
  expect((await validateAnswer(right,spec)).pass).toBe(true);expect((await validateAnswer(wrong,spec)).pass).toBe(false);expect((await validateAnswer(right.split(' ').slice(1).join(' '),spec)).pass).toBe(false);
 }
 for(const entry of expansion.items)expect(writtenGuessingFloor(entry.item)).toBeCloseTo(1/6);
});
it('uses each guided verb and bounds subject agreement and tense-choice claims',()=>{
 expect(lessons.find(l=>l.facetKey?.endsWith('regular_er'))!.practice.map(p=>p.answerFr)).toEqual(['ai dessiné','as collé','a porté','avons écouté','avez visité','ont filmé']);
 expect(lessons.find(l=>l.facetKey?.endsWith('regular_ir'))!.practice.map(p=>p.answerFr)).toEqual(['ai nourri','as rempli','a ralenti','avons réfléchi','avez obéi','ont applaudi']);
 expect(lessons.find(l=>l.facetKey?.endsWith('spelling_ger'))!.practice.map(p=>p.answerFr)).toEqual(['ai nagé','as mangé','a voyagé','avons bougé','avons mélangé','avons partagé','avez rangé','ont chargé']);
 expect(lessons.find(l=>l.facetKey?.endsWith('spelling_cer'))!.practice.map(p=>p.answerFr)).toEqual(['ai avancé','as lancé','a commencé','avons placé','avons annoncé','avons remplacé','avez effacé','ont tracé']);
 for(const lesson of lessons){expect(lesson.status).toBe('draft_requires_review');expect(lesson.boundaryFr).toContain('ne vérifie pas le choix');expect(lesson.steps.at(-1)!.explanationFr).toContain('sans complément direct placé avant');}
});
it('keeps guided sentences out of fresh applications and provides prerequisite-ready paths',()=>{
 const expansion=read('generated/french-v3-passe-compose-family-production-expansion.json') as DraftExpansion;
 const scoped=read('docs/diagnostic/v3-scoped-review-candidate.json');const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 for(const entry of expansion.items){expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);}
 for(const lesson of lessons){const skill=scoped.assessment.skills.find((s:{nodeKey:string;facetKey:string})=>s.nodeKey===lesson.nodeKey&&s.facetKey===lesson.facetKey);expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(skill.id);for(const p of skill.prerequisites)expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(p);}
});
