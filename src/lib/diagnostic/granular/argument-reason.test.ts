import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {ARGUMENT_REASON_DRAFTS,ARGUMENT_REASON_TEACHING} from './argument-reason';
import {ARGUMENT_THESIS_DRAFTS,ARGUMENT_THESIS_TEACHING} from './argument-thesis';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {readTextualSupport} from './textual-support';
import type {DraftExpansion} from './assemble-drafts';
it('separates reasons from proposals and unrelated details without relying on a connective',()=>{
 const row=(key:string)=>ARGUMENT_REASON_DRAFTS.find(r=>r.key===key)!;
 expect(row('costume').support).toBe('Acheter des costumes neufs coûterait trop cher à notre troupe.');
 expect(row('late-meeting').support).toContain('car le dernier bus');
 expect(row('shade').answer).toBe('Les arbres apporteraient de l’ombre en été.');
 expect(row('team').distractors).toContain('Parce que les groupes seront annoncés lundi.');
 for(const r of ARGUMENT_REASON_DRAFTS){expect(r.passage.split(/\s+/).length).toBeLessThan(65);expect(new Set([r.answer,...r.distractors]).size).toBe(4);}
});
it('uses fresh reason passages and preserves pending review and the exact target',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-argument-reason-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set([...ARGUMENT_REASON_TEACHING,...ARGUMENT_THESIS_TEACHING].flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(8);
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(entry.item.nodeKey).toBe('identifier_raison_argument');
  const support=readTextualSupport(entry.item)!;
  for(const c of support.choices)expect(support.passageText).toContain(c.quoteFr);
  expect(ARGUMENT_THESIS_DRAFTS.map(r=>r.passage)).not.toContain(support.passageText);
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 }
});
