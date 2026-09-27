import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {NEGATION_RECOGNITION,NEGATION_RECOGNITION_TEACHING} from './negation-recognition';
import {assessesNegativeExample} from './negative-examples';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
it('tests absence of the target construction, rather than counting wrong options as counterexamples',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-negation-recognition-expansion.json','utf8')) as DraftExpansion;
 expect(expansion.items).toHaveLength(16);
 expect(expansion.items.filter(i=>assessesNegativeExample(i.item))).toHaveLength(8);
 for(const [index,entry] of expansion.items.entries()){
  expect(assessesNegativeExample(entry.item)).toBe(NEGATION_RECOGNITION[index].answer!==0);
  expect(entry.item.choices?.findIndex(c=>c.correct)).toBe(NEGATION_RECOGNITION[index].answer);
  expect(entry.reviewStatus).toBe('needs_human_review');
 }
 expect(NEGATION_RECOGNITION.find(r=>r.sentence==='Les volets sont fermés.')?.answer).toBe(1);
 expect(NEGATION_RECOGNITION.find(r=>r.sentence==='Cette réponse n’est pas exacte.')?.answer).toBe(0);
 const taught=new Set(NEGATION_RECOGNITION_TEACHING.flatMap(teachingMaterialKeys));
 expect(expansion.items.every(i=>questionAssessedMaterialKeys(i.item).every(k=>!taught.has(k)))).toBe(true);
});
