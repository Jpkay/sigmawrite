import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {FUTUR_SIMPLE_TEACHING} from './futur-simple-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const forms:Record<string,string[]>={
 être:['serai','seras','sera','serons','serez','seront'],avoir:['aurai','auras','aura','aurons','aurez','auront'],
 aller:['irai','iras','ira','irons','irez','iront'],faire:['ferai','feras','fera','ferons','ferez','feront'],
 prendre:['prendrai','prendras','prendra','prendrons','prendrez','prendront'],venir:['viendrai','viendras','viendra','viendrons','viendrez','viendront'],
 partir:['partirai','partiras','partira','partirons','partirez','partiront'],sortir:['sortirai','sortiras','sortira','sortirons','sortirez','sortiront'],
 dire:['dirai','diras','dira','dirons','direz','diront'],voir:['verrai','verras','verra','verrons','verrez','verront'],
 pouvoir:['pourrai','pourras','pourra','pourrons','pourrez','pourront'],vouloir:['voudrai','voudras','voudra','voudrons','voudrez','voudront'],
 savoir:['saurai','sauras','saura','saurons','saurez','sauront'],devoir:['devrai','devras','devra','devrons','devrez','devront'],
};
it('teaches each exact verb with its own six independently specified future forms',()=>{
 expect(FUTUR_SIMPLE_TEACHING).toHaveLength(14);
 for(const lesson of FUTUR_SIMPLE_TEACHING){
  const verb=lesson.facetKey!.split('::verb:')[1];
  expect(lesson.nodeKey).toBe('produire_futur_simple');expect(lesson.mode).toBe('production');
  expect(lesson.status).toBe('draft_requires_review');
  expect(lesson.practice.map(p=>p.answerFr),verb).toEqual(forms[verb]);
  expect(teachingMaterialKeys(lesson).length).toBeGreaterThan(6);
  expect(lesson.steps.map(s=>s.exampleFr).join(' ')).not.toMatch(/\b[Jj]e (aurai|irai)/);
 }
});
it('keeps initial and follow-up questions distinct from taught sentences',()=>{
 const expansion=read('generated/french-v3-conjugation-expansion.json') as DraftExpansion;
 const candidate=read('docs/diagnostic/v3-parallel-review-candidate.json');
 const persons=['1s','2s','3s','1p','2p','3p'];
 for(const lesson of FUTUR_SIMPLE_TEACHING){
  const verb=lesson.facetKey!.split('::verb:')[1],keys=teachingMaterialKeys(lesson);
  const items=expansion.items.filter(i=>i.itemKey.startsWith(`v3-granular-forms:futur_simple-application-context:${verb}:`));
  expect(items).toHaveLength(12);
  for(const item of items){
   expect(item.item.correctAnswer).toBe(forms[verb][persons.indexOf(String(item.item.validatorConfig!.person))]);
   expect(item.item.nodeKey).toBe('produire_futur_simple');
   expect(String(item.item.validatorConfig!.sentenceApplication).replace('___',item.item.correctAnswer!)).not.toMatch(/\b[Jj]e (aurai|irai)/);
   expect(item.reviewStatus).toBe('needs_human_review');expect(item.review).toBeUndefined();
   expect(questionAssessedMaterialKeys(item.item).some(key=>keys.includes(key))).toBe(false);
  }
  const ready=candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id);
  expect(ready.freshCheckAvailable,verb).toBe(true);
 }
});
