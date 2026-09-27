import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {INFINITIVE_PARTICIPLE_TEACHING as lessons} from './infinitive-participle-foundations';
import {validateTeachingTargets} from './teaching-content';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {contrastingErrorKeys} from './contrasting-errors';
import {canonicalProbeMetrics} from './probe-metrics';
import {validateAnswer} from '@/lib/linguistic/validator';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('separates grammatical identification, spelling recognition and unaided spelling with honest binary odds',async()=>{
 const a=JSON.parse(readFileSync('generated/french-v3-infinitive-participle-foundations-expansion.json','utf8'));
 const taught=new Set(lessons.flatMap(teachingMaterialKeys)),seen=new Set<string>(),errors=new Set<string>();
 expect(a.items).toHaveLength(72);
 for(const entry of a.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.5);
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
  for(const error of contrastingErrorKeys(entry.item))errors.add(error);
  if(entry.evidenceKey==='writing-controlled-production'){
   const spec={validatorType:'exact' as const,correctAnswer:entry.item.correctAnswer};
   expect((await validateAnswer(entry.item.correctAnswer!,spec)).pass).toBe(true);
   const space=entry.item.validatorConfig?.finiteResponseSpace as {alternatives:string[]};
   expect((await validateAnswer(space.alternatives.find(x=>x!==entry.item.correctAnswer)!,spec)).pass).toBe(false);
  }
 }
 expect([...errors].sort()).toEqual(['infinitive-for-participle','participle-for-infinitive']);
});
it('allocates all three paths while retaining the approved novelty and error-contrast requirements',()=>{
 const c=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(c.assessment,lessons);
 for(const [node,evidence,mode] of [
  ['distinguer_infinitif_participe','reading-receptive','recognition'],
  ['distinguer_infinitif_participe_ecrit','reading-receptive','recognition'],
  ['distinguer_infinitif_participe_ecrit','writing-controlled-production','production'],
 ]){
  const id=node+'::'+evidence,coverage=c.poolCoverage.find((r:{skillId:string})=>r.skillId===id);
  expect(coverage.status).toBe('allocated');expect(coverage.learningItems).toBeGreaterThanOrEqual(12);
  const rules=c.assessment.skills.find((s:{id:string})=>s.id===id).evidenceRequirements[mode];
  if(node.endsWith('_ecrit'))expect(rules.novelWordsRequired).toBe(true);
  if(node.endsWith('_ecrit')&&mode==='recognition')expect(rules.minimumContrastingErrors).toBe(2);
 }
 const scoped=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 expect(scoped.assessment.skills.some((s:{id:string})=>s.id==='maintenir_orthographe_grammaticale_phrase::writing-independent-production')).toBe(true);
});
