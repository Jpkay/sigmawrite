import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {validateAnswer} from '../../linguistic/validator';
import {buildPhonemeGraphieTeaching} from './phoneme-graphie-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {canonicalProbeMetrics} from './probe-metrics';
import {assertDiagnosticAudioAssets} from '../../../../scripts/lib/diagnostic-audio-assets';
import type {CanonicalDiagnosticBankArtifact} from '../item-bank';
import type {DraftExpansion} from './assemble-drafts';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const expansion=read('generated/french-v3-phoneme-graphie-expansion.json') as DraftExpansion;
const lessons=buildPhonemeGraphieTeaching(read('generated/french-phoneme-graphie-audio-draft.json').assets);
it('keeps teaching words and recordings out of independent assessment material',()=>{
 const taught=new Set(lessons.flatMap(teachingMaterialKeys));
 expect(lessons).toHaveLength(2);expect(expansion.items).toHaveLength(32);
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.review).toBeUndefined();
  const keys=questionAssessedMaterialKeys(entry.item);
  expect(keys.some(k=>k.startsWith('audio:'))).toBe(true);
  expect(keys.some(k=>taught.has(k))).toBe(false);
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.25);
 }
 const bank={...read('generated/diagnostic-bank-v3-draft.json'),items:expansion.items} as CanonicalDiagnosticBankArtifact;
 expect(assertDiagnosticAudioAssets(bank,undefined,lessons).verifiedAudioAssets).toBe(40);
});
it('grades each written sound contrast and has one correct recognition choice',async()=>{
 for(const entry of expansion.items){
  const item=entry.item;
  if(item.responseType==='mcq'){
   expect(item.choices).toHaveLength(4);expect(item.choices!.filter(c=>c.correct)).toHaveLength(1);
  }else{
   const alternatives=(item.validatorConfig?.finiteResponseSpace as {alternatives:string[]}).alternatives;
   for(const answer of alternatives){
    const result=await validateAnswer(answer,{validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig});
    expect(result.pass,`${entry.itemKey}: ${answer}`).toBe(answer===item.correctAnswer);
   }
  }
 }
});
it('rejects missing teaching recordings and retains explicit limited coverage',()=>{
 expect(()=>buildPhonemeGraphieTeaching([])).toThrow('Missing');
 for(const lesson of lessons){
  expect(lesson.steps).toHaveLength(4);expect(lesson.practice).toHaveLength(4);
  expect(lesson.boundaryFr).toContain('ne vérifie pas tous les sons');
  expect(lesson.practice.every(p=>p.audioStimulus)).toBe(true);
 }
});
