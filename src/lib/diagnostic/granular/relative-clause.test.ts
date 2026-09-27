import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {RELATIVE_ASSESSMENT,RELATIVE_CLAUSE_TEACHING} from './relative-clause';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
it('covers four common relative pronouns and actual nonrelative constructions',()=>{
 for(const pronoun of ['qui','que','où','dont'])expect(RELATIVE_ASSESSMENT.filter(r=>r.clause?.startsWith(pronoun+' '))).toHaveLength(3);
 const negatives=RELATIVE_ASSESSMENT.filter(r=>r.clause===null);
 expect(negatives).toHaveLength(4);
 expect(negatives.every(r=>!!r.contrast)).toBe(true);
 expect(RELATIVE_CLAUSE_TEACHING[0].practice).toHaveLength(6);
 expect(RELATIVE_CLAUSE_TEACHING[0].boundaryFr).toContain('sans antécédent');
});
it('preserves exact recognition evidence and fresh untaught initial and follow-up questions',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-relative-clause-expansion.json','utf8')) as DraftExpansion;
 const keys=teachingMaterialKeys(RELATIVE_CLAUSE_TEACHING[0]);
 expect(expansion.items).toHaveLength(16);
 for(const [index,entry] of expansion.items.entries()){
  expect(entry.evidenceKey).toBe('reading-analysis');
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(questionAssessedMaterialKeys(entry.item).some(k=>keys.includes(k))).toBe(false);
  expect(!!entry.item.validatorConfig?.negativeExample).toBe(RELATIVE_ASSESSMENT[index].clause===null);
 }
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 expect(candidate.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===RELATIVE_CLAUSE_TEACHING[0].id)?.freshCheckAvailable).toBe(true);
});
