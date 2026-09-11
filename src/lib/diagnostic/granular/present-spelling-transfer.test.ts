import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PRESENT_SPELLING_TRANSFER as rows} from './present-spelling-transfer';
import {conjugationFacet,conjugationEvidenceFeatures} from './facets';
import {CONJUGATION_TEACHING} from './conjugation-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {validateAnswer} from '../../linguistic/validator';
import type {DraftExpansion} from './assemble-drafts';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('grades the distinctive spelling and maps new examples only to the authored present-tense facet',async()=>{
 const expansion=read('generated/french-v3-present-spelling-transfer-expansion.json') as DraftExpansion;
 expect(expansion.items).toHaveLength(16);
 for(const row of rows){
  const item=expansion.items.find(e=>e.item.validatorConfig?.verb===row.verb)!.item;
  const config={verb:row.verb,tense:'present',person:'1p'};
  expect(item.correctAnswer).toBe(row.answer);
  const spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,config:item.validatorConfig};
  expect((await validateAnswer(row.answer,spec)).pass).toBe(true);
  const incorrect=row.family==='spelling_ger'?row.answer.replace('geons','gons'):row.answer.replace('ç','c');
  expect(incorrect).not.toBe(row.answer);expect((await validateAnswer(incorrect,spec)).pass).toBe(false);
  expect(conjugationFacet('produire_present_indicatif',config)).toBe(`produire_present_indicatif::pattern:${row.family}`);
  expect(conjugationFacet('produire_imparfait',{...config,tense:'imparfait'})).toBeNull();
  expect(conjugationEvidenceFeatures('produire_present_indicatif',config)).toEqual(['spelling-adjustment']);
  expect(conjugationEvidenceFeatures('produire_present_indicatif',{...config,person:'2p'})).toEqual([]);
 }
});
it('supplies fresh follow-up material for both existing spelling lessons',()=>{
 const expansion=read('generated/french-v3-present-spelling-transfer-expansion.json') as DraftExpansion;
 const prepared=read('docs/diagnostic/v3-parallel-review-candidate.json');
 for(const family of ['spelling_ger','spelling_cer']){
  const id=`french-v3-teaching:present:pattern:${family}`;
  const lesson=CONJUGATION_TEACHING.find(l=>l.id===id)!;
  const taught=new Set(teachingMaterialKeys(lesson));
  const entries=expansion.items.filter(e=>String(e.item.validatorConfig?.verb).endsWith(family==='spelling_ger'?'ger':'cer'));
  expect(entries).toHaveLength(8);
  for(const entry of entries){expect(entry.reviewStatus).toBe('needs_human_review');expect(questionAssessedMaterialKeys(entry.item).some(key=>taught.has(key))).toBe(false);}
  const ready=prepared.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===id);
  expect(ready?.freshCheckAvailable).toBe(true);expect(ready?.remainingCheckQuestions).toBeGreaterThanOrEqual(3);
 }
});
