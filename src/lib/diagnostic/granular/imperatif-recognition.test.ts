import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {IMPERATIF_RECOGNITION_DRAFTS,IMPERATIF_RECOGNITION_TEACHING,IMPERATIVE_LABELS} from './imperatif-recognition';
import {teachingMaterialKeys,questionAssessedMaterialKeys} from './material-annotations';
import {validateTeachingTargets} from './teaching-content';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('contrasts actual imperative forms with statements and other ways of giving instructions',()=>{
 expect(IMPERATIF_RECOGNITION_DRAFTS).toHaveLength(24);
 const by=(form:string)=>IMPERATIF_RECOGNITION_DRAFTS.filter(r=>r.prompt.includes(`« ${form} »`));
 expect(by('touche')[0].answer).toBe('Impératif présent');
 expect(by('fermerez')[0].answer).toBe('Indicatif futur simple');
 expect(by('courir')[0].answer).toBe('Infinitif');
 expect(by('dites')[0].answer).toBe('Indicatif présent');
 for(const label of IMPERATIVE_LABELS)expect(IMPERATIF_RECOGNITION_DRAFTS.filter(r=>r.answer===label).length).toBeGreaterThanOrEqual(4);
 for(const r of IMPERATIF_RECOGNITION_DRAFTS)expect(new Set([r.answer,...r.distractors])).toEqual(new Set(IMPERATIVE_LABELS));
});
it('keeps teaching and independent sentence evidence separate under the existing graph target',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,IMPERATIF_RECOGNITION_TEACHING);
 const taught=new Set(IMPERATIF_RECOGNITION_TEACHING.flatMap(teachingMaterialKeys));
 const artifact=JSON.parse(readFileSync('generated/french-v3-imperatif-recognition-expansion.json','utf8'));
 const seen=new Set<string>();
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
 }
 expect(JSON.stringify(IMPERATIF_RECOGNITION_TEACHING)).not.toMatch(/—|delve into/);
});
