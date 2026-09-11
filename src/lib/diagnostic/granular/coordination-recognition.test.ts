import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {COORDINATION_RECOGNITION as rows,COORDINATION_RECOGNITION_TEACHING as lessons} from './coordination-recognition';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
it('contrasts coordinated propositions with subordination, juxtaposition and coordinated noun groups',()=>{
 expect(rows.filter(r=>r.answer===0)).toHaveLength(8);
 expect(rows.filter(r=>r.answer===1)).toHaveLength(3);
 expect(rows.filter(r=>r.answer===2)).toHaveLength(3);
 expect(rows.filter(r=>r.answer===3)).toHaveLength(2);
 expect(rows.find(r=>r.sentence.startsWith('Les élèves et'))?.answer).toBe(3);
 expect(rows.find(r=>r.sentence.startsWith('Cette trousse'))?.answer).toBe(3);
 expect(new Set(rows.map(r=>r.sentence)).size).toBe(16);
});
it('anchors negative examples and excludes taught sentences from independent assessment',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-coordination-recognition-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(16);
 for(const [i,entry] of expansion.items.entries()){
  expect(entry.evidenceKey).toBe('reading-analysis');
  expect(entry.item.nodeKey).toBe('construction_coordination');
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(entry.item.choices?.filter(c=>c.correct)).toHaveLength(1);
  expect(entry.item.validatorConfig?.negativeExample!==undefined).toBe(rows[i].answer!==0);
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys.length).toBeGreaterThan(0);
  expect(keys.some(k=>taught.has(k))).toBe(false);
 }
});
