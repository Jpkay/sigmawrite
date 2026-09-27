import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {IMPARFAIT_TEACHING} from './imparfait-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const forms:Record<string,string[]>={
 être:['étais','étais','était','étions','étiez','étaient'],avoir:['avais','avais','avait','avions','aviez','avaient'],
 aller:['allais','allais','allait','allions','alliez','allaient'],faire:['faisais','faisais','faisait','faisions','faisiez','faisaient'],
 prendre:['prenais','prenais','prenait','prenions','preniez','prenaient'],venir:['venais','venais','venait','venions','veniez','venaient'],
 partir:['partais','partais','partait','partions','partiez','partaient'],sortir:['sortais','sortais','sortait','sortions','sortiez','sortaient'],
 dire:['disais','disais','disait','disions','disiez','disaient'],voir:['voyais','voyais','voyait','voyions','voyiez','voyaient'],
 pouvoir:['pouvais','pouvais','pouvait','pouvions','pouviez','pouvaient'],vouloir:['voulais','voulais','voulait','voulions','vouliez','voulaient'],
 savoir:['savais','savais','savait','savions','saviez','savaient'],devoir:['devais','devais','devait','devions','deviez','devaient'],
};
it('teaches each exact verb with its own six forms and the être exception',()=>{
 expect(IMPARFAIT_TEACHING).toHaveLength(14);
 for(const lesson of IMPARFAIT_TEACHING){
  const verb=lesson.facetKey!.split('::verb:')[1];
  expect(lesson.nodeKey).toBe('produire_imparfait');expect(lesson.mode).toBe('production');
  expect(lesson.status).toBe('draft_requires_review');
  expect(lesson.practice.map(p=>p.answerFr),verb).toEqual(forms[verb]);
  expect(teachingMaterialKeys(lesson).length).toBeGreaterThan(6);
  expect(lesson.steps.map(s=>s.exampleFr).join(' ')).not.toMatch(/\b[Jj]e (étais|avais|allais)/);
 }
 expect(IMPARFAIT_TEACHING.find(l=>l.facetKey?.endsWith('verb:être'))!.steps[1].explanationFr).toContain('Ne pars pas de nous sommes');
});
it('keeps initial and follow-up questions distinct from taught sentences',()=>{
 const expansion=read('generated/french-v3-conjugation-expansion.json') as DraftExpansion;
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json');
 const persons=['1s','2s','3s','1p','2p','3p'];
 for(const lesson of IMPARFAIT_TEACHING){
  const verb=lesson.facetKey!.split('::verb:')[1],keys=teachingMaterialKeys(lesson);
  const items=expansion.items.filter(i=>i.itemKey.startsWith(`v3-granular-forms:imparfait-application-context:${verb}:`));
  expect(items).toHaveLength(12);
  for(const item of items){
   expect(item.item.correctAnswer).toBe(forms[verb][persons.indexOf(String(item.item.validatorConfig!.person))]);
   expect(item.item.nodeKey).toBe('produire_imparfait');
   expect(String(item.item.validatorConfig!.sentenceApplication).replace('___',item.item.correctAnswer!)).not.toMatch(/\b[Jj]e (étais|avais|allais)/);
   expect(item.reviewStatus).toBe('needs_human_review');expect(item.review).toBeUndefined();
   expect(questionAssessedMaterialKeys(item.item).some(key=>keys.includes(key))).toBe(false);
  }
  const ready=candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id);
  expect(ready.freshCheckAvailable,verb).toBe(true);
 }
});
