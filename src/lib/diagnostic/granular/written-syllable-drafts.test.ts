import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {WRITTEN_SYLLABLE_DRAFTS as drafts,shortWordSegmentations} from './written-syllable-drafts';
import {WRITTEN_SYLLABLE_TEACHING as lessons} from './written-syllable-teaching';
import {teachingMaterialKeys,questionAssessedMaterialKeys} from './material-annotations';
import {validateAnswer} from '../../linguistic/validator';
import {canonicalProbeMetrics} from './probe-metrics';
import type {DraftExpansion} from './assemble-drafts';
const expansion=JSON.parse(readFileSync('generated/french-v3-written-syllables-expansion.json','utf8')) as DraftExpansion;
it('preserves every letter and separates teaching words from both assessment modes',()=>{
 expect(drafts).toHaveLength(48);expect(new Set(drafts.map(d=>d.word)).size).toBe(48);
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 for(const row of drafts)expect(row.segmented.replaceAll('/','')).toBe(row.word);
 for(const entry of expansion.items){expect(entry.reviewStatus).toBe('needs_human_review');expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);}
 for(const mode of ['recognition','production'])expect(new Set(drafts.filter(d=>d.mode===mode).map(d=>d.pattern)).size).toBe(3);
});
it('grades authored segmentations and rejects missing and misplaced boundaries',async()=>{
 for(const entry of expansion.items){
  const row=drafts.find(d=>entry.itemKey===`v3-written-syllables:${d.key}`)!;
  if(entry.item.responseType==='mcq'){expect(entry.item.choices!.filter(c=>c.correct).map(c=>c.text)).toEqual([row.segmented]);continue;}
  for(const answer of [row.segmented,row.word,...Array.from({length:row.word.length-1},(_,i)=>`${row.word.slice(0,i+1)}/${row.word.slice(i+1)}`)]){
   const result=await validateAnswer(answer,{validatorType:entry.item.validatorType,correctAnswer:entry.item.correctAnswer,config:entry.item.validatorConfig});
   expect(result.pass).toBe(answer===row.segmented);
  }
  const finite=shortWordSegmentations(row.word);
  if(finite){expect(finite).toContain(row.segmented);expect(new Set(finite).size).toBe(2**(row.word.length-1));expect(canonicalProbeMetrics(entry).guessProbability).toBe(Math.max(.05,1/finite.length));}
 }
});
it('distinguishes written syllables from spoken counting in the lesson',()=>{
 for(const lesson of lessons){expect(lesson.practice).toHaveLength(6);expect(lesson.boundaryFr).toContain('à l’oral');for(const exercise of lesson.practice){if(exercise.choices)expect(exercise.choices.filter(c=>c===exercise.answerFr)).toHaveLength(1);}}
});
