import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {DEMONSTRATIVE_REFERENCE_GENRES_DRAFTS as drafts,DEMONSTRATIVE_REFERENCE_GENRES_TEACHING as lessons} from './demonstrative-reference-genres';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {readTextualSupport} from './textual-support';
import type {DraftExpansion} from './assemble-drafts';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
it('keeps genre evidence separate and covers both noun and whole-idea references',()=>{
 for(const genre of ['informational','argumentative']){
  const rows=drafts.filter(r=>r.genre===genre);expect(rows).toHaveLength(8);
  expect(rows.filter(r=>r.pronoun==='Cela')).toHaveLength(2);
  for(const r of rows){
   expect(r.passage.split(/\s+/).length).toBeLessThan(65);
   for(const quote of [r.sentence,r.support,...r.otherSpans])expect(r.passage).toContain(quote);
   expect(new Set([r.answer,...r.distractors]).size).toBe(4);
  }
 }
 const candidate=read('docs/diagnostic/v3-scoped-review-candidate.json');
 for(const genre of ['informational','argumentative'])expect(candidate.assessment.releaseScope.teachingSkillIds).toContain(`resoudre_demonstratif::all-receptive::text_type:${genre}`);
});
it('uses distinct independent passages, accurate source genres and no guided-material reuse',()=>{
 const expansion=read('generated/french-v3-demonstrative-reference-genres-expansion.json') as DraftExpansion;
 const taught=new Set(lessons.flatMap(teachingMaterialKeys)),passages=new Set<string>();
 expect(expansion.items).toHaveLength(16);
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  const support=readTextualSupport(entry.item)!;passages.add(support.passageText);
  const row=drafts.find(r=>r.passage===support.passageText)!;
  expect(entry.item.validatorConfig?.sourceTextType).toBe(row.genre);
  for(const c of support.choices)expect(support.passageText).toContain(c.quoteFr);
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 }
 expect(passages.size).toBe(16);
});
