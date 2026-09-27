import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {COUNTERARGUMENT_DRAFTS,COUNTERARGUMENT_TEACHING} from './counterargument';
import {ARGUMENT_REASON_DRAFTS,ARGUMENT_REASON_TEACHING} from './argument-reason';
import {ARGUMENT_THESIS_DRAFTS,ARGUMENT_THESIS_TEACHING} from './argument-thesis';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {readTextualSupport} from './textual-support';
import type {DraftExpansion} from './assemble-drafts';
it('distinguishes objections from supporting reasons, context and replies without a fixed position or connective',()=>{
 const row=(key:string)=>COUNTERARGUMENT_DRAFTS.find(r=>r.key===key)!;
 expect(row('manga-club').support).toContain('manquer leur bus');
 expect(row('manga-club').distractors).toContain('Le club pourrait terminer plus tôt.');
 expect(row('trip').objection).toBe(0);expect(row('online-paper').objection).toBe(2);
 expect(row('pets').support).toContain('Qui le nourrira');
 expect(row('music').support).not.toMatch(/mais|cependant|toutefois/i);
 for(const r of COUNTERARGUMENT_DRAFTS){expect(r.passage.split(/\s+/).length).toBeLessThan(65);expect(new Set([r.answer,...r.distractors]).size).toBe(4);}
});
it('binds distinct short passages and textual support to the approved counterargument target with fresh teaching',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-counterargument-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set([...COUNTERARGUMENT_TEACHING,...ARGUMENT_REASON_TEACHING,...ARGUMENT_THESIS_TEACHING].flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(8);
 const passages=new Set<string>();
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(entry.item.nodeKey).toBe('reconnaitre_contre_argument');
  const support=readTextualSupport(entry.item)!;passages.add(support.passageText);
  for(const c of support.choices)expect(support.passageText).toContain(c.quoteFr);
  expect([...ARGUMENT_THESIS_DRAFTS,...ARGUMENT_REASON_DRAFTS].map(r=>r.passage)).not.toContain(support.passageText);
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 }
 expect(passages.size).toBe(8);
});
