import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PASSIVE_RECOGNITION as rows,PASSIVE_RECOGNITION_TEACHING as lessons} from './passive-recognition';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
it('distinguishes passive voice from active compound tenses and adjective descriptions',()=>{
 expect(rows.filter(r=>r.answer===0)).toHaveLength(8);
 expect(rows.filter(r=>r.answer===0&&!r.sentence.includes(' par '))).toHaveLength(2);
 expect(rows.filter(r=>r.answer===2)).toHaveLength(3);
 expect(rows.find(r=>r.sentence.includes('est arrivée'))?.answer).toBe(2);
 expect(rows.find(r=>r.sentence.includes('sont parties'))?.answer).toBe(2);
 expect(rows.find(r=>r.sentence.includes('a été distribué'))?.answer).toBe(0);
 expect(rows.filter(r=>r.answer===3)).toHaveLength(2);
 expect(new Set(rows.map(r=>r.sentence)).size).toBe(16);
});
it('uses the approved recognition target with negative evidence and separate teaching material',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-passive-recognition-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(16);expect(lessons[0].practice).toHaveLength(6);
 for(const [i,entry] of expansion.items.entries()){
  expect(entry.evidenceKey).toBe('reading-analysis');expect(entry.item.nodeKey).toBe('construction_voix_passive');
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(entry.item.choices?.filter(c=>c.correct)).toHaveLength(1);
  expect(entry.item.validatorConfig?.negativeExample!==undefined).toBe(rows[i].answer!==0);
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys.length).toBeGreaterThan(0);
  expect(keys.some(k=>taught.has(k))).toBe(false);
 }
});
