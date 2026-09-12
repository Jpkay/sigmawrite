import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {QUESTION_DETAIL_READING_DRAFTS} from './question-detail-reading-drafts';
import {readTextualSupport} from './textual-support';
import {validateCanonicalDiagnosticBank} from '../item-bank';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('covers all three existing text-type distinctions with short, separate contexts',()=>{
 expect(new Set(QUESTION_DETAIL_READING_DRAFTS.map(d=>d.passage)).size).toBe(36);
 for(const genre of ['narrative','informational','argumentative'])expect(QUESTION_DETAIL_READING_DRAFTS.filter(d=>d.genre===genre)).toHaveLength(12);
 for(const d of QUESTION_DETAIL_READING_DRAFTS){expect(d.passage.split(/\s+/).length).toBeLessThan(65);expect(d.passage).toContain(d.support);expect(new Set([d.answer,...d.distractors]).size).toBe(4);expect(d.otherSpans).toHaveLength(2);for(const span of d.otherSpans){expect(d.passage).toContain(span);expect(span).not.toBe(d.support);}expect(JSON.stringify(d)).not.toContain('—');}
 expect(QUESTION_DETAIL_READING_DRAFTS.some(d=>d.passage.startsWith(d.support))).toBe(true);
 expect(QUESTION_DETAIL_READING_DRAFTS.some(d=>!d.passage.startsWith(d.support))).toBe(true);
});
it('retains pending review and binds answer plus exact text support to the approved skill',()=>{
 const expansion=read('generated/french-v3-question-detail-reading-expansion.json');
 const base=read('generated/diagnostic-bank-v3-draft.json'),taxonomy=read('generated/french-taxonomy-v3.json').taxonomy;
 const bank={...base,items:[...base.items,...expansion.items]};delete bank.manifest;
 expect(validateCanonicalDiagnosticBank(bank,taxonomy).issues).toEqual([]);
 for(const entry of expansion.items){expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.item.nodeKey).toBe('associer_information_question');expect(entry.evidenceKey).toBe('all-receptive');expect(entry.review).toBeUndefined();expect(readTextualSupport(entry.item)).toBeTruthy();expect(questionAssessedMaterialKeys(entry.item)).toHaveLength(1);}
 const existing=read('generated/diagnostic-bank-v3-consolidated-draft.json');
 expect(existing.items.some((i:{itemKey:string})=>i.itemKey.startsWith('v3-question-detail-reading:'))).toBe(false);
});

import {QUESTION_DETAIL_READING_TEACHING} from './question-detail-reading-teaching';
import {validateTeachingTargets} from './teaching-content';
import {teachingMaterialKeys,questionAssessedMaterialKeys} from './material-annotations';
import {materialIdentity} from './material-identity';
it('binds each lesson to its exact existing target and separates teaching passages from assessment',()=>{
 const assessment=read('docs/diagnostic/v3-parallel-review-candidate.json').assessment;
 expect(()=>validateTeachingTargets(assessment,QUESTION_DETAIL_READING_TEACHING)).not.toThrow();
 expect(QUESTION_DETAIL_READING_TEACHING).toHaveLength(3);
 for(const lesson of QUESTION_DETAIL_READING_TEACHING){
  expect(lesson.practice).toHaveLength(6);expect(lesson.status).toBe('draft_requires_review');expect(JSON.stringify(lesson)).not.toContain('—');
  const keys=teachingMaterialKeys(lesson);
  for(const d of QUESTION_DETAIL_READING_DRAFTS)expect(JSON.stringify(lesson)).not.toContain(d.passage);
  for(let i=0;i<6;i+=2){const answer=lesson.practice[i],support=lesson.practice[i+1],passage=answer.promptFr.split('\n\n')[0];expect(support.promptFr.startsWith(passage)).toBe(true);expect(passage).toContain(support.answerFr);expect(keys).toContain(materialIdentity('sentence',passage));expect(passage.split(/\s+/).length).toBeLessThan(65);}
 }
});
import {granularBankOptions} from '../../../../scripts/lib/granular-bank-options';
import {selectedDraftExpansionSources,selectedTeachingDrafts} from '../../../../scripts/lib/granular-authoring-selection';
it('selects the new questions and lessons together only with an explicit compatible revision',()=>{
 const args=['--bank-revision','38','--verb-family-recognition','--etre-participle-agreement','--question-detail-reading'];
 expect(granularBankOptions(args).questionDetailReading).toBe(true);
 expect(selectedDraftExpansionSources(args)).toContain('question-detail-reading');
 expect(selectedTeachingDrafts(args)).toEqual(expect.arrayContaining([...QUESTION_DETAIL_READING_TEACHING]));
 for(const invalid of [['--question-detail-reading'],['--bank-revision','38','--question-detail-reading'],args.map(a=>a==='38'?'37':a),[...args,'--question-detail-reading']])expect(()=>granularBankOptions(invalid)).toThrow();
 expect(selectedDraftExpansionSources([])).not.toContain('question-detail-reading');
});
