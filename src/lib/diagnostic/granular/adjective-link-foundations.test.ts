import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {ADJECTIVE_LINK_TEACHING as lessons} from './adjective-link-foundations';
import {validateTeachingTargets} from './teaching-content';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {assessesNegativeExample} from './negative-examples';
import {canonicalProbeMetrics} from './probe-metrics';
import {validateAnswer} from '@/lib/linguistic/validator';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('keeps analysis distinct from writing and checks unseen sentences and counterexamples',async()=>{
 const artifact=JSON.parse(readFileSync('generated/french-v3-adjective-link-foundations-expansion.json','utf8'));
 const taught=new Set(lessons.flatMap(teachingMaterialKeys)),seen=new Set<string>();
 expect(artifact.items).toHaveLength(32);
 let negatives=0;
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
  if(assessesNegativeExample(entry.item)){
   negatives++;
   expect(entry.evidenceKey).toBe('reading-analysis');
   expect(entry.item.choices?.find(c=>c.correct)?.text).toBe('Cette phrase ne contient pas d’adjectif à accorder avec un nom.');
  }
  if(entry.evidenceKey==='writing-controlled-production'){
   expect(entry.item.responseType).toBe('cloze');
   const spec={validatorType:'exact' as const,correctAnswer:entry.item.correctAnswer};
   expect(canonicalProbeMetrics(entry).guessProbability).toBe(.25);
   expect((await validateAnswer(entry.item.correctAnswer!,spec)).pass).toBe(true);
   const space=entry.item.validatorConfig?.finiteResponseSpace as {alternatives:string[]};
   for(const wrong of space.alternatives.filter(a=>a!==entry.item.correctAnswer))expect((await validateAnswer(wrong,spec)).pass).toBe(false);
  }
 }
 expect(negatives).toBe(4);
});
it('retains approved negative-example and novel-sentence requirements in both allocated pathways',()=>{
 const c=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(c.assessment,lessons);
 for(const [evidence,mode] of [['reading-analysis','recognition'],['writing-controlled-production','production']]){
  const id='construction_accord_nom_adjectif::'+evidence;
  const coverage=c.poolCoverage.find((r:{skillId:string})=>r.skillId===id);
  expect(coverage.status).toBe('allocated');expect(coverage.learningItems).toBeGreaterThanOrEqual(3);
  const requirements=c.assessment.skills.find((s:{id:string})=>s.id===id).evidenceRequirements[mode];
  if(mode==='recognition')expect(requirements.negativeExamplesRequired).toBe(true);
  else {expect(requirements.novelSentencesRequired).toBe(true);expect(requirements.unaidedRequired).toBe(true);}
 }
});
