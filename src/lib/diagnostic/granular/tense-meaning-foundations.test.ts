import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {TENSE_MEANING_DRAFTS as drafts,TENSE_MEANING_TEACHING as lessons} from './tense-meaning-foundations';
import {teachingMaterialKeys,questionAssessedMaterialKeys} from './material-annotations';
import {validateTeachingTargets} from './teaching-content';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('keeps balanced meaning contexts separate from worked examples and guided practice',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,lessons);
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 const artifact=JSON.parse(readFileSync('generated/french-v3-tense-meaning-foundations-expansion.json','utf8'));
 const seen=new Set<string>();
 expect(artifact.items).toHaveLength(36);
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
 }
 for(const lesson of lessons){
  const nodeDrafts=drafts.filter(d=>d.nodeKey===lesson.nodeKey);
  expect(nodeDrafts).toHaveLength(12);
  for(const meaning of [0,1,2])expect(nodeDrafts.filter(d=>d.meaning===meaning)).toHaveLength(4);
  expect(lesson.practice).toHaveLength(6);
 }
 expect(JSON.stringify(lessons)).not.toMatch(/—|delve into/);
});
it('retains complete supporting pathways for the three newly unblocked writing targets',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 for(const node of ['employer_imparfait_en_contexte','employer_futur_simple_en_contexte','employer_conditionnel_present_en_contexte']){
  const id=node+'::writing-independent-production';
  expect(candidate.assessment.releaseScope.assessmentSkillIds).toContain(id);
  expect(candidate.missingInstructionSkillIds).not.toContain(id);
  expect(candidate.blockedTeachingTargets.some((row:{skillId:string})=>row.skillId===id)).toBe(false);
 }
});
