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
 expect(artifact.items).toHaveLength(180);
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
  expect(lesson.practice).toHaveLength(9);
  for(const draft of drafts)expect(JSON.stringify(lesson)).not.toContain(draft.source);
 }
 expect(new Set(drafts.map(d=>d.nodeKey+':'+d.construction)).size).toBe(7);
 for(const target of new Set(drafts.map(d=>d.nodeKey+':'+d.construction))){
  const rows=drafts.filter(d=>d.nodeKey+':'+d.construction===target);
  const count=target.startsWith('ordonner_doubles_pronoms:')?28:24;
  expect(rows).toHaveLength(count);expect(new Set(rows.map(r=>r.source)).size).toBe(count);
 }
});
it('uses required elisions in student-visible negative prompts while preserving answers',()=>{
 const send=drafts.find(d=>d.key==='double-negative-4')!;
 expect(send.source).toBe('Vous n’envoyez pas le message aux responsables.');
 expect(send.prompt).toContain('\n\nVous n’envoyez pas le message aux responsables.');
 expect(send.answer).toBe('Vous ne le leur envoyez pas.');
 const bring=drafts.find(d=>d.key==='double-negative-8')!;
 expect(bring.source).toBe('Nous n’apportons pas le panier aux amis.');
 expect(bring.prompt).toContain('\n\nNous n’apportons pas le panier aux amis.');
 expect(bring.answer).toBe('Nous ne le leur apportons pas.');
 const negativeLesson=lessons.find(lesson=>lesson.id==='french-v3-teaching:double-pronoun-order:negative')!;
 const invitation=negativeLesson.practice.find(practice=>practice.id==='double-pronoun-order-guided:negative:5')!;
 expect(invitation.promptFr).toContain('\n\nIls n’envoient pas les invitations aux familles.');
 expect(invitation.answerFr).toBe('Ils ne les leur envoient pas.');
 expect(negativeLesson.materialExposure?.sentences).toContain('Ils n’envoient pas les invitations aux familles.');
 expect(JSON.stringify({drafts,lessons})).not.toMatch(/\b(?:Vous|Nous|Ils) ne (?:envoy|apport)/);
});
it('reserves sufficient follow-up questions at every pronoun construction and retains its writing pathway',()=>{
 const prepared=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 const scoped=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 const targets=new Set(drafts.map(d=>`${d.nodeKey}::writing-controlled-production::construction:${d.construction}`));
 for(const id of targets){
  const coverage=prepared.poolCoverage.find((r:{skillId:string})=>r.skillId===id);
  expect(coverage.status).toBe('allocated');
  expect(coverage.initialItems).toBeGreaterThanOrEqual(12);
  expect(coverage.learningItems).toBeGreaterThanOrEqual(12);
  expect(scoped.assessment.releaseScope.assessmentSkillIds).toContain(id);
 }
 expect(scoped.assessment.releaseScope.assessmentSkillIds).toContain('employer_pronoms_complements_en_contexte::writing-independent-production');
});
