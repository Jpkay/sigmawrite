import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
const PERSONS=['2s','1p','2p'] as const;
import type {CanonicalDiagnosticBankItem} from '../item-bank';
import {IMPERATIF_FAMILY_APPLICATIONS} from './imperatif-family-applications';
import {IMPERATIF_FAMILY_TEACHING} from './imperatif-family-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';

it('covers every imperative person four times in each family with fresh assessed sentences',()=>{
 const artifact=JSON.parse(readFileSync('generated/french-v3-imperatif-family-production-expansion.json','utf8'));
 const taught=new Set(IMPERATIF_FAMILY_TEACHING.flatMap(teachingMaterialKeys));
 const seen=new Set<string>();
 expect(artifact.items).toHaveLength(60);
 for(const family of ['regular_er','regular_ir','spelling_ger','spelling_cer']){
  const rows=IMPERATIF_FAMILY_APPLICATIONS.filter(r=>r.family===family);
  expect(rows).toHaveLength(family.startsWith('spelling_')?18:12);
  expect(new Set(rows.map(r=>r.verb)).size).toBeGreaterThanOrEqual(3);
  for(const person of PERSONS)expect(rows.filter(r=>r.person===person)).toHaveLength(family.startsWith('spelling_')&&person==='1p'?10:4);
 }
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const keys=questionAssessedMaterialKeys(entry.item);
  expect(keys).toHaveLength(2);
  for(const key of keys){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
  expect(entry.item.validatorConfig?.finiteResponseSpace).toMatchObject({alternatives:expect.arrayContaining([entry.item.correctAnswer])});
  expect(JSON.stringify(entry.item)).not.toMatch(/—|que elle|que ils/);
 }
});

it('checks written forms against independently stated family rules',()=>{
 const endings={'2s':'e','1p':'ons','2p':'ez'};
 for(const row of IMPERATIF_FAMILY_APPLICATIONS){
  let stem=row.verb.slice(0,-2),ending=endings[row.person];
  if(row.family==='regular_ir')ending=row.person==='2s'?'is':row.person==='1p'?'issons':'issez';
  if(row.person==='1p'&&row.family==='spelling_ger')stem+='e';
  if(row.person==='1p'&&row.family==='spelling_cer')stem=stem.slice(0,-1)+'ç';
  expect(row.answer).toBe(stem+ending);
 }

});

it('prepared family pools use distinct sentence applications in both phases',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 for(const family of ['regular_er','regular_ir','spelling_ger','spelling_cer']){
  const skillId=`produire_imperatif::writing-controlled-production::pattern:${family}`;
  const probes=candidate.assessment.probes.filter((p:{skillId:string})=>p.skillId===skillId);
  expect(probes.length).toBeGreaterThanOrEqual(6);
  for(const phase of ['initial','learning'])expect(probes.filter((p:{usage:string})=>p.usage===phase).length).toBeGreaterThanOrEqual(5);
  if(family.startsWith('spelling_'))for(const phase of ['initial','learning'])expect(probes.filter((p:{usage:string;evidenceFeatures?:string[]})=>p.usage===phase&&p.evidenceFeatures?.includes('spelling-adjustment')).length).toBeGreaterThanOrEqual(3);
  expect(probes.every((p:{id:string;assessedMaterialKeys:string[]})=>p.id.startsWith('v3-imperatif-family-production:')&&p.assessedMaterialKeys.every(k=>k.startsWith('sentence:')))).toBe(true);
 }
});
