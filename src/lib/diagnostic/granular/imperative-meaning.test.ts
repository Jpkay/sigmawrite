import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {IMPERATIVE_MEANING_DRAFTS as drafts,IMPERATIVE_MEANING_TEACHING as lessons} from './imperative-meaning';
import {teachingMaterialKeys,questionAssessedMaterialKeys} from './material-annotations';
import {validateTeachingTargets} from './teaching-content';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('keeps balanced meaning contexts separate from worked examples and guided practice',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,lessons);
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 const artifact=JSON.parse(readFileSync('generated/french-v3-imperative-meaning-expansion.json','utf8'));
 const seen=new Set<string>();
 expect(artifact.items).toHaveLength(24);
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
 }
 for(const lesson of lessons){
  const nodeDrafts=drafts.filter(d=>d.nodeKey===lesson.nodeKey);
  expect(nodeDrafts).toHaveLength(24);
  for(const category of new Set(nodeDrafts.map(d=>d.category)))expect(nodeDrafts.filter(d=>d.category===category)).toHaveLength(6);
  expect(lesson.practice).toHaveLength(8);
 }
 expect(JSON.stringify(lessons)).not.toMatch(/—|delve into/);
});
it('keeps meaning and contextual writing out of scope until their actual prerequisites are ready',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 const missing=['devoir','vouloir'].map(verb=>'produire_imperatif::writing-controlled-production::verb:'+verb);
 for(const id of ['interpreter_valeur_imperatif::reading-receptive','employer_imperatif_en_contexte::writing-independent-production']){
  expect(candidate.assessment.releaseScope.assessmentSkillIds).not.toContain(id);
  const blocked=candidate.blockedTeachingTargets.find((row:{skillId:string})=>row.skillId===id);
  expect(blocked).toBeDefined();
  expect(blocked.missingPrerequisiteIds).toEqual(missing);
 }
 const parallel=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 const ready=parallel.teachingReadiness.find((row:{skillId:string})=>row.skillId==='interpreter_valeur_imperatif::reading-receptive');
 expect(ready.poolsAllocated).toBe(true);
 expect(ready.remainingCheckQuestions).toBeGreaterThanOrEqual(12);
 expect(ready.freshCheckAvailable).toBe(true);
});

it('makes contextual interpretation distinct from form recognition and limits ambiguous claims',()=>{
 expect(lessons[0].nodeKey).toBe('interpreter_valeur_imperatif');
 expect(lessons[0].steps.some(s=>s.exampleFr.includes('Sortez.')&&s.exampleFr.includes('Sortez nous rejoindre'))).toBe(true);
 expect(lessons[0].steps.some(s=>s.explanationFr.includes('Sans contexte, plusieurs intentions'))).toBe(true);
 for(const draft of drafts){expect(draft.distractors).toHaveLength(3);expect(new Set([draft.answer,...draft.distractors]).size).toBe(4);expect(draft.assessedTexts[0]).toContain('«');}
});
