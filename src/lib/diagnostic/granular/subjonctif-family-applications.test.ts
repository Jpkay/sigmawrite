import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PERSONS} from '@/lib/linguistic/conjugation';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
import {SUBJONCTIF_FAMILY_APPLICATIONS} from './subjonctif-family-applications';
import {SUBJONCTIF_FAMILY_TEACHING} from './subjonctif-family-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';

it('covers every person twice in each family with fresh assessed sentences',()=>{
 const artifact=JSON.parse(readFileSync('generated/french-v3-subjonctif-family-production-expansion.json','utf8'));
 const taught=new Set(SUBJONCTIF_FAMILY_TEACHING.flatMap(teachingMaterialKeys));
 const seen=new Set<string>();
 expect(artifact.items).toHaveLength(48);
 for(const family of ['regular_er','regular_ir','spelling_ger','spelling_cer']){
  const rows=SUBJONCTIF_FAMILY_APPLICATIONS.filter(r=>r.family===family);
  expect(rows).toHaveLength(12);
  expect(new Set(rows.map(r=>r.verb)).size).toBeGreaterThanOrEqual(3);
  for(const person of PERSONS)expect(rows.filter(r=>r.person===person)).toHaveLength(2);
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
 const endings={'1s':'e','2s':'es','3s':'e','1p':'ions','2p':'iez','3p':'ent'};
 for(const row of SUBJONCTIF_FAMILY_APPLICATIONS){
  const stem=row.verb.slice(0,-2)+(row.family==='regular_ir'?'iss':'');
  expect(row.answer).toBe(stem+endings[row.person]);
 }
});
