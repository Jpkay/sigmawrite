import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PRONOUN_ORDER_DRAFTS as drafts,DOUBLE_PRONOUN_ORDER_TEACHING as lessons} from './pronoun-order-production';
import {assessmentFromGeneratedItem} from '@/lib/linguistic/assessment-policy';
import {validateAnswer} from '@/lib/linguistic/validator';
import {canonicalProbeMetrics} from './probe-metrics';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
import {validateTeachingTargets} from './teaching-content';
it('grades the supplied word order without treating typed transformations as open writing',async()=>{
 const artifact=JSON.parse(readFileSync('generated/french-v3-pronoun-order-production-expansion.json','utf8'));
 expect(artifact.items).toHaveLength(84);
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  const draft=drafts.find(d=>'v3-pronoun-order:'+d.key===entry.itemKey)!;
  const spec={validatorType:'exact' as const,correctAnswer:entry.item.correctAnswer,config:entry.item.validatorConfig,assessment:assessmentFromGeneratedItem(entry.item)};
  expect((await validateAnswer(draft.answer,spec)).pass).toBe(true);
  expect((await validateAnswer(draft.answer.replace(/\s*[.!]$/,''),spec)).pass).toBe(true);
  expect((await validateAnswer(draft.wrong,spec)).pass).toBe(false);
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.5);
  expect(entry.reviewStatus).toBe('needs_human_review');
  expect(entry.evidenceExpectation).toBe('controlled_production');
 }
});
it('binds draft teaching to the approved construction targets and uses separate guided situations',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,lessons);
 for(const lesson of lessons){
  expect(lesson.practice).toHaveLength(6);
  for(const draft of drafts)expect(JSON.stringify(lesson)).not.toContain(draft.source);
 }
 expect(new Set(drafts.map(d=>d.nodeKey+':'+d.construction)).size).toBe(7);
 for(const target of new Set(drafts.map(d=>d.nodeKey+':'+d.construction))){
  const rows=drafts.filter(d=>d.nodeKey+':'+d.construction===target);
  expect(rows).toHaveLength(12);expect(new Set(rows.map(r=>r.source)).size).toBe(12);
 }
});
