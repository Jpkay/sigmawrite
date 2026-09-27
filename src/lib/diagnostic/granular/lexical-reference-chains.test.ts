import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {LEXICAL_REFERENCE_CHAINS_DRAFTS as drafts,LEXICAL_REFERENCE_CHAINS_TEACHING as lessons} from './lexical-reference-chains';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {readTextualSupport} from './textual-support';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('covers three separate genres with short three-sentence reference chains',()=>{
 const candidate=read('docs/diagnostic/v3-scoped-review-candidate.json');
 for(const genre of ['narrative','informational','argumentative']){
  const rows=drafts.filter(r=>r.genre===genre);expect(rows).toHaveLength(8);
  expect(candidate.assessment.releaseScope.teachingSkillIds).toContain(`suivre_chaine_lexicale::all-receptive::text_type:${genre}`);
  for(const r of rows){
   expect(r.passage.split(/\s+/).length).toBeLessThan(65);
   for(const quote of [r.sentence,r.support,...r.otherSpans])expect(r.passage).toContain(quote);
   expect(r.otherSpans).toHaveLength(2);expect(new Set([r.answer,...r.distractors]).size).toBe(4);
  }
 }
 expect(drafts.find(r=>r.key==='narrative-manga')?.distractors).toContain('la page seule');
 expect(drafts.find(r=>r.key==='informational-tank')?.distractors).toContain('le couvercle seul');
});
it('keeps draft independent passages distinct from guided material and preserves their source types',()=>{
 const expansion=read('generated/french-v3-lexical-reference-chains-expansion.json') as DraftExpansion;
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));expect(expansion.items).toHaveLength(24);
 const passages=new Set<string>();
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();expect(entry.item.nodeKey).toBe('suivre_chaine_lexicale');
  const support=readTextualSupport(entry.item)!;passages.add(support.passageText);
  const row=drafts.find(r=>r.passage===support.passageText)!;
  expect(entry.item.validatorConfig?.sourceTextType).toBe(row.genre==='narrative'?'literary':row.genre);
  for(const c of support.choices)expect(support.passageText).toContain(c.quoteFr);
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 }
 expect(passages.size).toBe(24);
});
