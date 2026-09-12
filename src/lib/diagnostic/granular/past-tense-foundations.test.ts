import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PAST_TENSE_FOUNDATION_DRAFTS as drafts,PAST_TENSE_FOUNDATION_TEACHING as lessons} from './past-tense-foundations';
import {teachingMaterialKeys,questionAssessedMaterialKeys} from './material-annotations';
import {validateTeachingTargets} from './teaching-content';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('distinguishes past-simple forms from other tenses and includes completed events of long duration',()=>{
 const recognition=drafts.filter(d=>d.nodeKey==='reconnaitre_passe_simple');
 expect(recognition).toHaveLength(24);
 for(const tense of ['Passé simple','Imparfait','Passé composé','Présent'])expect(recognition.filter(d=>d.answer===tense).length).toBeGreaterThanOrEqual(4);
 expect(recognition.find(d=>d.prompt.includes('« prîtes »'))?.answer).toBe('Passé simple');
 expect(recognition.find(d=>d.prompt.includes('« sommes arrivés »'))?.answer).toBe('Passé composé');
 const events=drafts.filter(d=>d.nodeKey==='interpreter_passe_compose');
 expect(events).toHaveLength(12);
 expect(events.some(d=>d.answer.includes('pendant deux heures'))).toBe(true);
 expect(events.some(d=>d.answer.includes('en une semaine'))).toBe(true);
 for(const d of drafts)expect(new Set([d.answer,...d.distractors]).size).toBe(4);
});
it('provides fresh independent contexts for both approved prerequisite targets',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,lessons);
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 const artifact=JSON.parse(readFileSync('generated/french-v3-past-tense-foundations-expansion.json','utf8'));
 const seen=new Set<string>();
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
 }
 for(const lesson of lessons)expect(lesson.practice).toHaveLength(6);
 expect(JSON.stringify(lessons)).not.toMatch(/—|delve into/);
});
