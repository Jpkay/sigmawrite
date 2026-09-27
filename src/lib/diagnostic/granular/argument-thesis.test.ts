import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {ARGUMENT_THESIS_DRAFTS,ARGUMENT_THESIS_TEACHING} from './argument-thesis';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {readTextualSupport} from './textual-support';
import type {DraftExpansion} from './assemble-drafts';
it('distinguishes a defended claim from a reason, reported opinion and exaggerated scope',()=>{
 const row=(key:string)=>ARGUMENT_THESIS_DRAFTS.find(r=>r.key===key)!;
 expect(row('uniform').answer).toBe('Ne pas rendre l’uniforme obligatoire.');
 expect(row('manga-club').support).toContain('au contraire');
 expect(row('tournament').answer).toContain('ce mois-ci');
 expect(row('phone').answer).toContain('pendant les débats');
 expect(ARGUMENT_THESIS_DRAFTS.some(r=>r.passage.startsWith(r.support))).toBe(true);
 expect(ARGUMENT_THESIS_DRAFTS.some(r=>r.passage.endsWith(r.support))).toBe(true);
 for(const r of ARGUMENT_THESIS_DRAFTS){expect(r.passage.split(/\s+/).length).toBeLessThan(65);expect(new Set([r.answer,...r.distractors]).size).toBe(4);}
});
it('keeps guided passages separate from the assessment and retains real review status',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-argument-thesis-expansion.json','utf8')) as DraftExpansion;
 expect(expansion.items).toHaveLength(8);
 const taught=new Set(ARGUMENT_THESIS_TEACHING.flatMap(teachingMaterialKeys));
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  const support=readTextualSupport(entry.item)!;
  expect(support.choices.filter(c=>c.correct)).toHaveLength(1);
  for(const c of support.choices)expect(support.passageText).toContain(c.quoteFr);
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 }
 expect(ARGUMENT_THESIS_TEACHING[0].practice).toHaveLength(6);
});
