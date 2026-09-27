import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {SIMPLE_NEGATION_DRAFTS,SIMPLE_NEGATION_TEACHING} from './simple-negation';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
it('places negation around the conjugated part and outside preceding pronouns',()=>{
 const answers=new Map(SIMPLE_NEGATION_DRAFTS);
 expect(answers.get('Nous avons reçu le message.')).toBe('Nous n’avons pas reçu le message.');
 expect(answers.get('Tu lui réponds.')).toBe('Tu ne lui réponds pas.');
 expect(answers.get('Ils se préparent dans le vestiaire.')).toBe('Ils ne se préparent pas dans le vestiaire.');
 expect(answers.get('Vous pouvez entrer.')).toBe('Vous ne pouvez pas entrer.');
 expect(answers.get('Elle ouvre la fenêtre.')).toBe('Elle n’ouvre pas la fenêtre.');
});
it('provides distinct assessment sentences without promoting drafts or reusing guided material',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-simple-negation-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set(SIMPLE_NEGATION_TEACHING.flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(16);
 expect(new Set(SIMPLE_NEGATION_DRAFTS.map(([source])=>source)).size).toBe(16);
 for(const [i,entry] of expansion.items.entries()){
  expect(entry.item.correctAnswer).toBe(SIMPLE_NEGATION_DRAFTS[i][1]);
  expect(entry.reviewStatus).toBe('needs_human_review');
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 }
 expect(SIMPLE_NEGATION_TEACHING[0].boundaryFr).toContain('un/des en de');
});
