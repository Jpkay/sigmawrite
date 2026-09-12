import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {HOMOPHONE_RECOGNITION_DRAFTS as drafts} from './homophone-recognition-drafts';
import {HOMOPHONE_TEACHING} from './homophone-teaching';
import {questionMaterialKeys,teachingMaterialKeys} from './material-annotations';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('balances both answers in original contexts while retaining the fixed-word exposure',()=>{
 const artifact=read('generated/french-v3-homophone-recognition-expansion.json');
 expect(artifact.items).toHaveLength(32);expect(new Set(drafts.map(d=>d.sentence)).size).toBe(32);
 const taught=new Set(HOMOPHONE_TEACHING.flatMap(teachingMaterialKeys));
 for(const pair of ['son_sont','on_ont']){
  const rows=drafts.filter(d=>d.pair===pair);expect(rows).toHaveLength(16);
  for(const answer of rows[0].alternatives)expect(rows.filter(d=>d.answer===answer)).toHaveLength(8);
 }
 for(const entry of artifact.items){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const keys=questionMaterialKeys(entry.item);expect(keys.length).toBeGreaterThanOrEqual(3);
  expect(keys.some(k=>taught.has(k))).toBe(true);
  expect(entry.item.choices.filter((c:{correct:boolean})=>c.correct)).toHaveLength(1);
 }
});
it('does not activate fixed-pair questions by discarding approved novelty requirements',()=>{
 const scoped=read('docs/diagnostic/v3-scoped-review-candidate.json');
 for(const pair of ['son_sont','on_ont'])expect(scoped.assessment.releaseScope.assessmentSkillIds).not.toContain(`distinguer_homophones_${pair}::reading-receptive`);
});
