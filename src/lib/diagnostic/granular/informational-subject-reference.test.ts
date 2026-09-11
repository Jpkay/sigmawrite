import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {INFORMATIONAL_SUBJECT_REFERENCE_DRAFTS as drafts,INFORMATIONAL_SUBJECT_REFERENCE_TEACHING as lessons} from './informational-subject-reference';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {readTextualSupport} from './textual-support';
import type {DraftExpansion} from './assemble-drafts';
it('samples all four subject pronouns and includes nearer same-gender distractors',()=>{
 for(const pronoun of ['Il','Elle','Ils','Elles'])expect(drafts.filter(r=>r.pronoun===pronoun)).toHaveLength(2);
 const row=(key:string)=>drafts.find(r=>r.key===key)!;
 expect(row('volunteer').answer).toBe('un bénévole');expect(row('volunteer').distractors).toContain('un plan');
 expect(row('librarian').answer).toBe('la bibliothécaire');expect(row('librarian').distractors).toContain('une revue');
 expect(row('instructors').answer).toBe('les monitrices');expect(row('instructors').distractors).toContain('les cordes');
 for(const r of drafts){expect(r.passage.split(/\s+/).length).toBeLessThan(65);expect(r.question).toContain(r.sentence);expect(new Set([r.answer,...r.distractors]).size).toBe(4);}
});
it('keeps informational evidence separate from narrative mastery and guided material',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-informational-subject-reference-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(8);
 const passages=new Set<string>();
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  expect(entry.item.nodeKey).toBe('resoudre_pronom_sujet');
  expect(entry.item.validatorConfig?.sourceTextType).toBe('informational');
  const support=readTextualSupport(entry.item)!;passages.add(support.passageText);
  for(const c of support.choices)expect(support.passageText).toContain(c.quoteFr);
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 }
 expect(passages.size).toBe(8);
});
