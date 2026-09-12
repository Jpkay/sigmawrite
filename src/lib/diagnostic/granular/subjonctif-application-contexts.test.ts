import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {SUBJONCTIF_APPLICATION_CONTEXTS} from './subjonctif-application-contexts';
import {SUBJONCTIF_PRODUCTION_TEACHING} from './subjonctif-production-teaching';
import {expandConjugationDraft} from './conjugation-expansion';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {PERSONS} from '@/lib/linguistic/conjugation';

it('authors two different applications per subject for every exact verb',()=>{
 expect(SUBJONCTIF_APPLICATION_CONTEXTS).toHaveLength(168);
 for(const lesson of SUBJONCTIF_PRODUCTION_TEACHING){
  const verb=lesson.facetKey!.split('::verb:')[1];
  const rows=SUBJONCTIF_APPLICATION_CONTEXTS.filter(r=>r[0]===verb);
  for(const person of PERSONS)expect(rows.filter(r=>r[1]===person)).toHaveLength(2);
  expect(new Set(rows.map(r=>r[2])).size).toBe(12);
  for(const [, ,sentence] of rows){expect(sentence.match(/___/g)).toHaveLength(1);expect(sentence).not.toMatch(/que (elle|ils)\b/);}
 }
});

it('generates valid exact-target questions with fresh assessed sentences and no approval',async()=>{
 const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const expansion=await expandConjugationDraft(read('generated/diagnostic-bank-v3-draft.json'),read('generated/french-taxonomy-v3.json').taxonomy);
 const items=expansion.items.filter(i=>i.itemKey.includes(':subjonctif_present-application-context:'));
 expect(items).toHaveLength(168);
 const allAssessed=new Set<string>();
 for(const lesson of SUBJONCTIF_PRODUCTION_TEACHING){
  const verb=lesson.facetKey!.split('::verb:')[1],teaching=teachingMaterialKeys(lesson);
  const selected=items.filter(i=>i.item.validatorConfig?.verb===verb);
  expect(selected).toHaveLength(12);
  for(const item of selected){
   expect(item.item.nodeKey).toBe('produire_subjonctif_present_frequent');
   expect(item.item.promptFr).toContain('au subjonctif présent');
   expect(item.item.validatorConfig?.sentenceApplication).toBeTruthy();
   expect(item.reviewStatus).toBe('needs_human_review');expect(item.review).toBeUndefined();
   if(verb==='avoir'||verb==='aller')expect(item.item.promptFr).not.toContain('que je ___');
   const keys=questionAssessedMaterialKeys(item.item);
   expect(keys.length).toBeGreaterThan(0);
   for(const key of keys){expect(key).toMatch(/^sentence:/);expect(teaching).not.toContain(key);expect(allAssessed.has(key)).toBe(false);allAssessed.add(key);}
   expect(expansion.annotations.find(a=>a.itemKey===item.itemKey)?.facetKey).toBe(lesson.facetKey);
  }
 }
},30000);
