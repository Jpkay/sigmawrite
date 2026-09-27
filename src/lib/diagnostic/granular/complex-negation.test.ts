import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {COMPLEX_NEGATION_DRAFTS,COMPLEX_NEGATION_MEANINGS,complexNegationChoices,type ComplexNegationFeature} from './complex-negation';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {COMPLEX_NEGATION_TEACHING} from './complex-negation-teaching';
import {validateTeachingTargets} from './teaching-content';
import type {CanonicalDiagnosticBankItem} from '../item-bank';

it('covers each meaning separately with fresh sentences and explicit counterexamples',()=>{
 const artifact=JSON.parse(readFileSync('generated/french-v3-complex-negation-expansion.json','utf8'));
 expect(artifact.items).toHaveLength(46);
 const keys=new Set<string>();
 for(const feature of ['plus','jamais','rien','personne','guere'] as const)expect(COMPLEX_NEGATION_DRAFTS.filter(d=>d.feature===feature)).toHaveLength(8);
 expect(COMPLEX_NEGATION_DRAFTS.filter(d=>d.negativeExample)).toHaveLength(6);
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');expect(entry.evidenceKey).toBe('reading-analysis');
  const feature=entry.item.validatorConfig?.complexNegationFeature as ComplexNegationFeature;
  expect(entry.item.choices!.find(c=>c.correct)!.text).toBe(COMPLEX_NEGATION_MEANINGS[feature]);
  expect(entry.item.choices).toHaveLength(4);expect(entry.item.choices!.filter(c=>c.correct)).toHaveLength(1);
  const assessed=questionAssessedMaterialKeys(entry.item);expect(assessed).toHaveLength(1);
  expect(keys.has(assessed[0])).toBe(false);keys.add(assessed[0]);
  expect(Boolean(entry.item.validatorConfig?.negativeExample)).toBe(feature==='simple'||feature==='restriction');
 }
});

it('keeps reduced quantity distinct from none and restricted time distinct from a lifelong claim',()=>{
 expect(COMPLEX_NEGATION_MEANINGS.guere).toContain('sans être forcément nul');
 expect(COMPLEX_NEGATION_MEANINGS.jamais).toContain('dans la situation décrite');
 expect(COMPLEX_NEGATION_MEANINGS.plus).toContain('a cessé');
 expect(COMPLEX_NEGATION_MEANINGS.restriction).toContain('seulement');
 for(const [index,row] of COMPLEX_NEGATION_DRAFTS.entries()){
  const choices=complexNegationChoices(row.feature,index);expect(new Set(choices).size).toBe(4);expect(choices).toContain(row.answer);
 }
});

it('teaches every distinction without reusing the independent sentences',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,COMPLEX_NEGATION_TEACHING);
 const lesson=COMPLEX_NEGATION_TEACHING[0],taught=new Set(teachingMaterialKeys(lesson));
 expect(lesson.practice).toHaveLength(7);
 expect(lesson.boundaryFr).toContain('ne vérifie pas encore que tu sais les écrire');
 const bank=JSON.parse(readFileSync('generated/french-v3-complex-negation-expansion.json','utf8'));
 for(const entry of bank.items as CanonicalDiagnosticBankItem[])expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k))).toBe(false);
 expect(JSON.stringify(lesson)).not.toMatch(/—|delve into/);
});
