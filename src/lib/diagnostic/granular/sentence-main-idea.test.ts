import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {SENTENCE_MAIN_IDEA_DRAFTS} from './sentence-main-idea';
import {SENTENCE_MAIN_IDEA_TEACHING} from './sentence-main-idea-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {readingContextId,readingPassageText} from './v3-adapter';
import {validateTeachingTargets} from './teaching-content';
import type {CanonicalDiagnosticBankItem} from '../item-bank';

it('provides short, distinct genre-bound passages with four unique answer choices',()=>{
 const artifact=JSON.parse(readFileSync('generated/french-v3-sentence-main-idea-expansion.json','utf8'));
 const taught=new Set(SENTENCE_MAIN_IDEA_TEACHING.flatMap(teachingMaterialKeys));
 const contexts=new Set<string>();
 expect(artifact.items).toHaveLength(36);
 for(const genre of ['narrative','informational','argumentative'])expect(SENTENCE_MAIN_IDEA_DRAFTS.filter(d=>d.genre===genre)).toHaveLength(12);
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  const item=entry.item,passage=readingPassageText(item.validatorConfig,item.promptFr);
  expect(passage.split(/\s+/).length).toBeLessThanOrEqual(40);
  expect(passage.split(/\s+/).length).toBeGreaterThanOrEqual(15);
  expect(item.choices).toHaveLength(4);expect(new Set(item.choices!.map(c=>c.text)).size).toBe(4);
  expect(item.choices!.filter(c=>c.correct)).toHaveLength(1);
  expect(entry.reviewStatus).toBe('needs_human_review');
  const context=readingContextId(item.validatorConfig,item.promptFr);expect(contexts.has(context)).toBe(false);contexts.add(context);
  const keys=questionAssessedMaterialKeys(item);expect(keys).toHaveLength(1);expect(keys.every(k=>!taught.has(k))).toBe(true);
 }
});

it('binds three interpretation lessons to approved facets without treating details as the main idea',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,SENTENCE_MAIN_IDEA_TEACHING);
 expect(SENTENCE_MAIN_IDEA_TEACHING).toHaveLength(3);
 for(const lesson of SENTENCE_MAIN_IDEA_TEACHING){
  expect(lesson.practice).toHaveLength(6);expect(lesson.status).toBe('draft_requires_review');
  for(let i=0;i<6;i+=2)expect(lesson.practice[i].answerFr).not.toBe(lesson.practice[i+1].answerFr);
  expect(lesson.boundaryFr).toContain('Une condition ou une négation peut être essentielle');
  expect(teachingMaterialKeys(lesson).length).toBeGreaterThanOrEqual(3);
 }
 expect(JSON.stringify([SENTENCE_MAIN_IDEA_TEACHING,SENTENCE_MAIN_IDEA_DRAFTS])).not.toMatch(/—|delve into|de un récit/);
});

it('preserves conditions and limited claims in representative answer keys',()=>{
 const answer=(key:string)=>SENTENCE_MAIN_IDEA_DRAFTS.find(d=>d.key===key)!.answer;
 expect(answer('informational:workshop')).toContain('ou avant si l’atelier est complet');
 expect(answer('informational:exhibition')).toContain('s’ils prouvent leur âge');
 expect(answer('argumentative:walk')).toContain('où elle est possible');
 expect(answer('argumentative:quiet')).toContain('faire coexister');
});
