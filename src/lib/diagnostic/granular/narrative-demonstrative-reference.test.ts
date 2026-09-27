import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {NARRATIVE_DEMONSTRATIVE_REFERENCE_DRAFTS as drafts,NARRATIVE_DEMONSTRATIVE_REFERENCE_TEACHING as lessons} from './narrative-demonstrative-reference';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {readTextualSupport} from './textual-support';
import type {DraftExpansion} from './assemble-drafts';

it('uses short narratives with distinct referents and exact supporting quotations',()=>{
 expect(new Set(drafts.map(r=>r.passage)).size).toBe(8);
 for(const r of drafts){
  expect(r.passage.split(/\s+/).length).toBeLessThan(65);
  expect(r.passage).toContain(r.sentence);
  expect(r.question).toContain(r.pronoun);
  expect(new Set([r.answer,...r.distractors]).size).toBe(4);
  for(const quote of [r.support,...r.otherSpans])expect(r.passage).toContain(quote);
 }
 // These items require selecting a subset, not just matching gender/number.
 expect(drafts.find(r=>r.key==='manga')?.distractors).toContain('le roman');
 expect(drafts.find(r=>r.key==='plants')?.answer).toBe('les plantes du préau');
 expect(drafts.find(r=>r.key==='team')?.answer).toBe('les joueurs au brassard jaune');
});
it('keeps independent narrative evidence separate from guided material and publication',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-narrative-demonstrative-reference-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(8);
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(entry.item.nodeKey).toBe('resoudre_demonstratif');
  expect(entry.item.validatorConfig?.sourceTextType).toBe('literary');
  const support=readTextualSupport(entry.item)!;
  for(const c of support.choices)expect(support.passageText).toContain(c.quoteFr);
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 }
 expect(lessons[0].facetKey).toBe('resoudre_demonstratif::text_type:narrative');
 expect(lessons[0].status).toBe('draft_requires_review');
});
