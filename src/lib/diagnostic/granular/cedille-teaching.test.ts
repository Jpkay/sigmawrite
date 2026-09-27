import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {CEDILLE_DRAFTS as drafts} from './cedille-drafts';
import {CEDILLE_TEACHING as lessons} from './cedille-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
it('covers necessary and unnecessary cedillas with disjoint words in each response mode',()=>{
 expect(drafts).toHaveLength(32);expect(new Set(drafts.map(d=>d.word)).size).toBe(32);
 for(const mode of ['recognition','production']){
  const rows=drafts.filter(d=>d.mode===mode);expect(rows.filter(d=>d.letter==='ç')).toHaveLength(8);expect(rows.filter(d=>d.letter==='c')).toHaveLength(8);
  expect(rows.some(d=>d.letter==='c'&&/___[aou]/.test(d.sentence))).toBe(true);
  expect(rows.some(d=>d.letter==='c'&&/___[ei]/.test(d.sentence))).toBe(true);
  for(const r of rows)expect(r.sentence.match(/[\p{L}]*___[\p{L}]*/u)![0].replace('___',r.letter)).toBe(r.word);
 }
});
it('keeps model words out of independent evidence and retains both error types',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-cedille-expansion.json','utf8')) as DraftExpansion;
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 expect(expansion.items).toHaveLength(32);
 for(const e of expansion.items){expect(e.reviewStatus).toBe('needs_human_review');expect(e.review).toBeUndefined();expect(questionAssessedMaterialKeys(e.item).some(k=>taught.has(k))).toBe(false);}
 const errors=new Set(expansion.items.flatMap(e=>(e.item.validatorConfig?.contrastingErrors as {errorKey:string}[]|undefined)?.map(r=>r.errorKey)??[]));expect(errors).toEqual(new Set(['missing_cedilla','unneeded_cedilla']));
});
it('gives both response modes teaching and fresh checks',()=>{
 const c=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 expect(lessons).toHaveLength(2);
 for(const lesson of lessons){expect(lesson.practice).toHaveLength(6);expect(c.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===lesson.id)?.freshCheckAvailable,lesson.id).toBe(true);}
});
it('requires the approved sound-to-spelling prerequisites before scoped activation',()=>{
 const full=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 const scoped=JSON.parse(readFileSync('docs/diagnostic/v3-scoped-review-candidate.json','utf8'));
 const required=['associer_phoneme_graphie_frequente::reading-receptive','associer_phoneme_graphie_frequente::writing-controlled-production'];
 for(const lesson of lessons){
  const skill=full.assessment.skills.find((s:{nodeKey:string;modes:string[]})=>s.nodeKey===lesson.nodeKey&&s.modes.includes(lesson.mode));
  expect(skill.prerequisites).toEqual(expect.arrayContaining(required));
  const missing=required.some(id=>!scoped.assessment.probes.some((p:{skillId:string})=>p.skillId===id));
  if(missing)expect(scoped.teachingContent.some((r:{id:string})=>r.id===lesson.id)).toBe(false);
 }
});
