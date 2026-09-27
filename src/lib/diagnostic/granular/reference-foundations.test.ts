import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {REFERENCE_FOUNDATION_RECOGNITION as recognition,REFERENCE_FOUNDATION_PRODUCTION as production,REFERENCE_FOUNDATION_TEACHING as lessons} from './reference-foundations';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {writtenGuessingFloor} from './response-space';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('includes contrasting grammatical functions and genuine sentence transformations for both nodes',()=>{
 for(const nodeKey of ['construction_pronom_sujet','construction_reprise_demonstrative']){
  const rows=recognition.filter(r=>r.nodeKey===nodeKey);
  expect(rows).toHaveLength(12);expect(rows.filter(r=>r.negative)).toHaveLength(4);
  for(const r of rows){expect(r.sentence).toContain(r.token);expect(new Set([r.answer,...r.others]).size).toBe(4);}
  const written=production.filter(r=>r.nodeKey===nodeKey);expect(written).toHaveLength(12);
  for(const r of written){expect(r.sentence).toContain(r.replace);expect(r.answer).toBe(r.sentence.replace(r.replace,r.pronoun));expect(r.answer).not.toBe(r.sentence);}
 }
});
it('preserves draft status and separates all independent material from lesson exposure',()=>{
 const expansion=read('generated/french-v3-reference-foundations-expansion.json') as DraftExpansion;
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(48);
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
  if(entry.item.responseType==='cloze')expect(writtenGuessingFloor(entry.item)).toBeGreaterThan(0);
 }
});
it('provides complete assessment, teaching and fresh checks for the graph prerequisite chain',()=>{
 const prepared=read('docs/diagnostic/v3-parallel-review-candidate.json');
 const scoped=read('docs/diagnostic/v3-scoped-review-candidate.json');
 for(const lesson of lessons){
  const ready=prepared.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id);
  expect(ready?.poolsAllocated).toBe(true);expect(ready?.freshCheckAvailable).toBe(true);
  expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(ready.skillId);
 }
 const narrative='resoudre_demonstratif::all-receptive::text_type:narrative';
 expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(narrative);
 expect(scoped.blockedTeachingTargets.some((r:{skillId:string})=>r.skillId===narrative)).toBe(false);
});
