import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {IMPERATIF_VERB_CONTENT,IMPERATIF_VERB_APPLICATIONS,IMPERATIF_VERB_TEACHING} from './imperatif-verb-content';
import {validateTeachingTargets} from './teaching-content';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('teaches four distinct approved verb targets with each imperative person represented',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,IMPERATIF_VERB_TEACHING);
 expect(IMPERATIF_VERB_TEACHING.map(l=>l.facetKey)).toEqual(['être','avoir','aller','faire'].map(v=>`produire_imperatif::verb:${v}`));
 for(const lesson of IMPERATIF_VERB_TEACHING){
  expect(lesson.practice).toHaveLength(6);expect(lesson.status).toBe('draft_requires_review');
  expect(new Set(lesson.practice.map(p=>p.answerFr)).size).toBe(3);
  for(const answer of new Set(lesson.practice.map(p=>p.answerFr)))expect(lesson.practice.filter(p=>p.answerFr===answer)).toHaveLength(2);
  expect(JSON.stringify(lesson)).not.toMatch(/—|delve into/);
 }
 expect(IMPERATIF_VERB_CONTENT.map(c=>c.forms)).toEqual([['sois','soyons','soyez'],['aie','ayons','ayez'],['va','allons','allez'],['fais','faisons','faites']]);
});
it('keeps all 48 sentence checks distinct from guided material and balances persons',()=>{
 const artifact=JSON.parse(readFileSync('generated/french-v3-imperatif-verb-production-expansion.json','utf8'));
 expect(artifact.items).toHaveLength(48);
 const taught=new Set(IMPERATIF_VERB_TEACHING.flatMap(teachingMaterialKeys)),seen=new Set<string>();
 for(const verb of ['être','avoir','aller','faire'])for(const person of ['2s','1p','2p'])expect(IMPERATIF_VERB_APPLICATIONS.filter(r=>r.verb===verb&&r.person===person)).toHaveLength(4);
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const keys=questionAssessedMaterialKeys(entry.item);expect(keys).toHaveLength(2);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
  expect(entry.item.validatorConfig?.finiteResponseSpace).toMatchObject({alternatives:expect.arrayContaining([entry.item.correctAnswer])});
 }
});
it('uses fresh sentence checks in both phases instead of former isolated-form probes',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 for(const verb of ['être','avoir','aller','faire']){
  const probes=candidate.assessment.probes.filter((p:{skillId:string})=>p.skillId===`produire_imperatif::writing-controlled-production::verb:${verb}`);
  for(const phase of ['initial','learning'])expect(probes.filter((p:{usage:string})=>p.usage===phase).length).toBeGreaterThanOrEqual(5);
  expect(probes.every((p:{id:string})=>p.id.startsWith('v3-imperatif-verb-production:'))).toBe(true);
 }
});
