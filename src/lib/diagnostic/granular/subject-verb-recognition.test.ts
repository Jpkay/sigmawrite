import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {SUBJECT_VERB_RECOGNITION_TEACHING as lessons} from './subject-verb-recognition';
import {validateTeachingTargets} from './teaching-content';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {contrastingErrorKeys} from './contrasting-errors';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('keeps four constructions distinct with fresh verbs and actual number/person contrasts',()=>{
 const a=JSON.parse(readFileSync('generated/french-v3-subject-verb-recognition-expansion.json','utf8'));
 const taught=new Set(lessons.flatMap(teachingMaterialKeys)),seen=new Set<string>();
 expect(a.items).toHaveLength(64);
 for(const entry of a.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  expect(entry.evidenceKey).toBe('reading-receptive');
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
  expect(contrastingErrorKeys(entry.item).sort()).toEqual(['wrong-number','wrong-person']);
 }
 for(const construction of ['adjacent','separated','inverted','coordinated']){
  expect(a.annotations.filter((r:{facetKey:string})=>r.facetKey.endsWith(':'+construction))).toHaveLength(16);
 }
});
it('reserves follow-up questions for every construction without weakening graph requirements',()=>{
 const c=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(c.assessment,lessons);
 for(const construction of ['adjacent','separated','inverted','coordinated']){
  const id='accorder_sujet_verbe_ecrit::reading-receptive::construction:'+construction;
  const coverage=c.poolCoverage.find((r:{skillId:string})=>r.skillId===id);
  expect(coverage.status).toBe('allocated');expect(coverage.learningItems).toBeGreaterThanOrEqual(3);
  const rules=c.assessment.skills.find((s:{id:string})=>s.id===id).evidenceRequirements.recognition;
  expect(rules.novelWordsRequired).toBe(true);expect(rules.minimumContrastingErrors).toBe(2);
 }
});
