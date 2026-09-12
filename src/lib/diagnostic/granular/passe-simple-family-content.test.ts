import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PERSONS} from '@/lib/linguistic/conjugation';
import {PASSE_SIMPLE_FAMILIES,PASSE_SIMPLE_FAMILY_TEACHING,PASSE_SIMPLE_FAMILY_APPLICATIONS} from './passe-simple-family-content';
import {validateTeachingTargets} from './teaching-content';
import {teachingMaterialKeys,questionAssessedMaterialKeys} from './material-annotations';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
it('teaches four approved family targets and the accents and spelling contrasts',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,PASSE_SIMPLE_FAMILY_TEACHING);
 expect(PASSE_SIMPLE_FAMILY_TEACHING).toHaveLength(4);
 expect(PASSE_SIMPLE_FAMILIES.map(f=>f.forms)).toEqual([
 ['parlai','parlas','parla','parlâmes','parlâtes','parlèrent'],['finis','finis','finit','finîmes','finîtes','finirent'],
 ['mangeai','mangeas','mangea','mangeâmes','mangeâtes','mangèrent'],['lançai','lanças','lança','lançâmes','lançâtes','lancèrent']]);
 for(const l of PASSE_SIMPLE_FAMILY_TEACHING){expect(l.practice).toHaveLength(6);expect(l.status).toBe('draft_requires_review');expect(JSON.stringify(l)).not.toMatch(/—|delve into/);}
 for(const f of PASSE_SIMPLE_FAMILIES)expect(f.guided.map(r=>r[1])).toEqual(PERSONS);
});
it('keeps every assessed sentence fresh and represents all six persons in each family',()=>{
 const artifact=JSON.parse(readFileSync('generated/french-v3-passe-simple-family-production-expansion.json','utf8'));
 expect(artifact.items).toHaveLength(48);
 const taught=new Set(PASSE_SIMPLE_FAMILY_TEACHING.flatMap(teachingMaterialKeys)),seen=new Set<string>();
 for(const f of PASSE_SIMPLE_FAMILIES)for(const person of PERSONS)expect(PASSE_SIMPLE_FAMILY_APPLICATIONS.filter(r=>r.family===f.key&&r.person===person)).toHaveLength(2);
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  for(const key of questionAssessedMaterialKeys(entry.item)){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
  expect(entry.item.validatorConfig?.finiteResponseSpace).toMatchObject({alternatives:expect.arrayContaining([entry.item.correctAnswer])});
 }
});
it('reserves sufficient fresh checks and spelling changes in both phases',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 for(const f of PASSE_SIMPLE_FAMILIES){
  const probes=candidate.assessment.probes.filter((p:{skillId:string})=>p.skillId===`produire_passe_simple::writing-controlled-production::pattern:${f.key}`);
  expect(probes.every((p:{id:string})=>p.id.startsWith('v3-passe-simple-family-production:'))).toBe(true);
  for(const phase of ['initial','learning']){
   const rows=probes.filter((p:{usage:string})=>p.usage===phase);expect(rows.length).toBeGreaterThanOrEqual(3);
   if(f.key.startsWith('spelling_'))expect(rows.filter((p:{evidenceFeatures?:string[]})=>p.evidenceFeatures?.includes('spelling-adjustment')).length).toBeGreaterThanOrEqual(3);
  }
 }
});
