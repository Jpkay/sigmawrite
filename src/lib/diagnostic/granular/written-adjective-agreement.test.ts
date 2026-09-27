import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {WRITTEN_ADJECTIVE_TEACHING as lessons} from './written-adjective-agreement';
import {validateTeachingTargets} from './teaching-content';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {contrastingErrorKeys} from './contrasting-errors';
import {canonicalProbeMetrics} from './probe-metrics';
import {validateAnswer} from '@/lib/linguistic/validator';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('separates recognition and written transformation, retaining distinct words and real error contrasts',async()=>{
 const artifact=JSON.parse(readFileSync('generated/french-v3-written-adjective-agreement-expansion.json','utf8'));
 const taught=new Set(lessons.flatMap(teachingMaterialKeys)),seen=new Set<string>();
 expect(artifact.items).toHaveLength(32);
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
  if(entry.evidenceExpectation==='receptive')expect(contrastingErrorKeys(entry.item)).toHaveLength(entry.item.choices!.length-1);
  else {
   const spec={validatorType:'exact' as const,correctAnswer:entry.item.correctAnswer};
   const alternatives=entry.item.validatorConfig?.finiteResponseSpace as {alternatives:string[]};
   expect(canonicalProbeMetrics(entry).guessProbability).toBeCloseTo(1/alternatives.alternatives.length);
   expect((await validateAnswer(entry.item.correctAnswer!,spec)).pass).toBe(true);
   const space=entry.item.validatorConfig?.finiteResponseSpace as {alternatives:string[]};
   for(const wrong of space.alternatives.filter(a=>a!==entry.item.correctAnswer))expect((await validateAnswer(wrong,spec)).pass).toBe(false);
  }
 }
});
it('allocates both modes with follow-up reserves and retains word-novelty requirements',()=>{
 const c=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(c.assessment,lessons);
 for(const [evidence,mode] of [['reading-receptive','recognition'],['writing-controlled-production','production']]){
  const id='accorder_adjectif_nom_ecrit::'+evidence;
  const coverage=c.poolCoverage.find((r:{skillId:string})=>r.skillId===id);
  expect(coverage.status).toBe('allocated');expect(coverage.learningItems).toBeGreaterThanOrEqual(3);
  expect(c.assessment.skills.find((s:{id:string})=>s.id===id).evidenceRequirements[mode].novelWordsRequired).toBe(true);
 }
});
