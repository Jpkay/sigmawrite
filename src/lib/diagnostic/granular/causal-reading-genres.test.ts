import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {CAUSAL_READING_GENRES_DRAFTS as drafts} from './causal-reading-genres-drafts';
import {readTextualSupport,publicTextualSupport,gradeTextualSupport} from './textual-support';
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankItem} from '../item-bank';
import {questionAssessedMaterialKeys} from './material-annotations';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
it('provides short independent passages for both missing causal reading genres',()=>{
 expect(new Set(drafts.map(d=>d.passage)).size).toBe(24);
 for(const genre of ['informational','argumentative'])expect(drafts.filter(d=>d.genre===genre)).toHaveLength(12);
 for(const draft of drafts){
  expect(draft.passage.split(/\s+/).length).toBeLessThan(75);
  expect(new Set([draft.answer,...draft.distractors]).size).toBe(4);
  expect(draft.passage).toContain(draft.support);
  expect(draft.passage).not.toContain(draft.answer);
  expect(JSON.stringify(draft)).not.toContain('—');
 }
});
it('preserves the approved causal contract and pending review in the canonical bank',()=>{
 const expansion=read('generated/french-v3-causal-reading-genres-expansion.json');
 const base=read('generated/diagnostic-bank-v3-draft.json');
 const bank={...base,items:[...base.items,...expansion.items]};delete bank.manifest;
 expect(validateCanonicalDiagnosticBank(bank,read('generated/french-taxonomy-v3.json').taxonomy).issues).toEqual([]);
 for(const entry of expansion.items as CanonicalDiagnosticBankItem[]){
  expect(entry.item.nodeKey).toBe('inferer_cause_locale');
  expect(entry.evidenceKey).toBe('all-receptive');
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(questionAssessedMaterialKeys(entry.item)).toHaveLength(1);
 }
});
it('requires the actual supporting passage and rejects a different session’s selection',()=>{
 for(const entry of read('generated/french-v3-causal-reading-genres-expansion.json').items as CanonicalDiagnosticBankItem[]){
  const support=readTextualSupport(entry.item)!;
  const choices=publicTextualSupport('session-a',entry.itemKey,entry.item)!;
  expect(gradeTextualSupport('session-a',entry.itemKey,entry.item,undefined).valid).toBe(false);
  for(const choice of choices){
   expect(gradeTextualSupport('session-a',entry.itemKey,entry.item,choice.id)).toEqual({valid:true,correct:support.choices.find(c=>c.quoteFr===choice.text)!.correct});
   expect(gradeTextualSupport('session-b',entry.itemKey,entry.item,choice.id).valid).toBe(false);
  }
 }
});
