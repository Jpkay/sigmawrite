import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {CONDITIONNEL_PRODUCTION_TEACHING} from './conditionnel-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const forms:Record<string,string[]>={
 être:['serais','serais','serait','serions','seriez','seraient'],avoir:['aurais','aurais','aurait','aurions','auriez','auraient'],
 aller:['irais','irais','irait','irions','iriez','iraient'],faire:['ferais','ferais','ferait','ferions','feriez','feraient'],
 prendre:['prendrais','prendrais','prendrait','prendrions','prendriez','prendraient'],venir:['viendrais','viendrais','viendrait','viendrions','viendriez','viendraient'],
 partir:['partirais','partirais','partirait','partirions','partiriez','partiraient'],sortir:['sortirais','sortirais','sortirait','sortirions','sortiriez','sortiraient'],
 dire:['dirais','dirais','dirait','dirions','diriez','diraient'],voir:['verrais','verrais','verrait','verrions','verriez','verraient'],
 pouvoir:['pourrais','pourrais','pourrait','pourrions','pourriez','pourraient'],vouloir:['voudrais','voudrais','voudrait','voudrions','voudriez','voudraient'],
 savoir:['saurais','saurais','saurait','saurions','sauriez','sauraient'],devoir:['devrais','devrais','devrait','devrions','devriez','devraient'],
};
it('teaches each exact verb with its own six independently specified conditional forms',()=>{
 expect(CONDITIONNEL_PRODUCTION_TEACHING).toHaveLength(14);
 for(const lesson of CONDITIONNEL_PRODUCTION_TEACHING){
  const verb=lesson.facetKey!.split('::verb:')[1];
  expect(lesson.nodeKey).toBe('produire_conditionnel_present');expect(lesson.mode).toBe('production');
  expect(lesson.status).toBe('draft_requires_review');
  expect(lesson.practice.map(p=>p.answerFr),verb).toEqual(forms[verb]);
  expect(teachingMaterialKeys(lesson).length).toBeGreaterThan(6);
  expect(lesson.steps.map(s=>s.exampleFr).join(' ')).not.toMatch(/\b[Jj]e (aurais|irais)/);
 }
});
it('keeps initial and follow-up questions distinct from taught sentences',()=>{
 const expansion=read('generated/french-v3-conjugation-expansion.json') as DraftExpansion;
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json');
 const persons=['1s','2s','3s','1p','2p','3p'];
 for(const lesson of CONDITIONNEL_PRODUCTION_TEACHING){
  const verb=lesson.facetKey!.split('::verb:')[1],keys=teachingMaterialKeys(lesson);
  const items=expansion.items.filter(i=>i.itemKey.startsWith(`v3-granular-forms:conditionnel_present-application-context:${verb}:`));
  expect(items).toHaveLength(12);
  for(const item of items){
   expect(item.item.correctAnswer).toBe(forms[verb][persons.indexOf(String(item.item.validatorConfig!.person))]);
   expect(item.item.nodeKey).toBe('produire_conditionnel_present');
   expect(String(item.item.validatorConfig!.sentenceApplication).replace('___',item.item.correctAnswer!)).not.toMatch(/\b[Jj]e (aurais|irais)/);
   expect(item.reviewStatus).toBe('needs_human_review');expect(item.review).toBeUndefined();
   expect(questionAssessedMaterialKeys(item.item).some(key=>keys.includes(key))).toBe(false);
  }
  const ready=candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id);
  expect(ready.freshCheckAvailable,verb).toBe(true);
 }
});

it('provides recognition instruction before admitting the dependent verb forms',()=>{
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json');
 expect(candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId==='french-v3-teaching:conditionnel:recognition')?.freshCheckAvailable).toBe(true);
 const assessment=candidate.assessment;
 for(const lesson of CONDITIONNEL_PRODUCTION_TEACHING){
  const skill=assessment.skills.find((s:{facetKey:string})=>s.facetKey===lesson.facetKey);
  expect(skill.prerequisites).toContain('reconnaitre_conditionnel_present::reading-receptive');
 }
});
