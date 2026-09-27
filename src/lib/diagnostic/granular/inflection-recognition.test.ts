import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {INFLECTION_RECOGNITION_DRAFTS as drafts,INFLECTION_RECOGNITION_TEACHING as lessons} from './inflection-recognition';
import {SPELLING_TEACHING} from './spelling-teaching';
import {teachingMaterialKeys,questionAssessedMaterialKeys} from './material-annotations';
import {contrastingErrorKeys} from './contrasting-errors';
import {validateTeachingTargets} from './teaching-content';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('uses different target lemmas from guided content and contrasts two actual error families',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,lessons);
 const taught=new Set([...lessons,...SPELLING_TEACHING].flatMap(teachingMaterialKeys));
 const artifact=JSON.parse(readFileSync('generated/french-v3-inflection-recognition-expansion.json','utf8'));
 const seen=new Set<string>();
 expect(artifact.items).toHaveLength(32);
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  expect(contrastingErrorKeys(entry.item).sort()).toEqual(['missing-inflection','wrong-inflection']);
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(key.startsWith('word:')).toBe(true);expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
 }
 for(const lesson of lessons){expect(drafts.filter(d=>d.nodeKey===lesson.nodeKey)).toHaveLength(16);expect(lesson.practice).toHaveLength(6);}
});
it('retains initial and follow-up recognition pools without relaxing the approved novelty requirement',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 for(const lesson of lessons){
  const id=lesson.nodeKey+'::reading-receptive';
  expect(candidate.poolCoverage.find((r:{skillId:string})=>r.skillId===id).status).toBe('allocated');
  expect(candidate.assessment.skills.find((s:{id:string})=>s.id===id).evidenceRequirements.recognition.novelWordsRequired).toBe(true);
 }
});
