import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {OBJECT_REFERENCE_DRAFTS} from './reading-object-reference';
import {READING_TEACHING} from './reading-teaching';
const OBJECT_REFERENCE_TEACHING=READING_TEACHING.filter(l=>l.nodeKey==='resoudre_pronom_objet');
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {readTextualSupport} from './textual-support';
import type {DraftExpansion} from './assemble-drafts';
it('covers object and recipient references with explicit, unambiguous authored answers',()=>{
 expect(OBJECT_REFERENCE_DRAFTS.map(r=>[r.pronoun,r.answer])).toEqual([
  ['le','le manga'],['la','une affiche'],['les','ses clés'],['lui','son entraîneuse'],['leur','deux visiteurs'],['le','son appareil photo'],['les','trois petites plantes'],['lui','le chanteur'],
 ]);
 expect(new Set(OBJECT_REFERENCE_DRAFTS.map(r=>r.passage)).size).toBe(8);
 for(const row of OBJECT_REFERENCE_DRAFTS){
  expect(row.passage.split(/\s+/).length).toBeLessThan(65);
  expect(row.passage).toContain(row.support);
  expect(row.distractors).not.toContain(row.answer);
 }
});
it('retains pending review and separates guided texts from independent assessment texts',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-reading-object-reference-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set(OBJECT_REFERENCE_TEACHING.flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(8);
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  const support=readTextualSupport(entry.item)!;expect(support.passageText).toContain(support.choices.find(c=>c.correct)!.quoteFr);
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 }
 expect(OBJECT_REFERENCE_TEACHING[0].boundaryFr).toContain('écrivant');
});
