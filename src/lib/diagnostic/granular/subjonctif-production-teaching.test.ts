import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {SUBJONCTIF_PRODUCTION_TEACHING} from './subjonctif-production-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {validateTeachingTargets} from './teaching-content';
import type {DraftExpansion} from './assemble-drafts';

it('has exact approved-parent targets, six subject exercises and no fabricated review',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,SUBJONCTIF_PRODUCTION_TEACHING);
 expect(SUBJONCTIF_PRODUCTION_TEACHING).toHaveLength(14);
 for(const lesson of SUBJONCTIF_PRODUCTION_TEACHING){
  expect(lesson.practice).toHaveLength(6);
  expect(lesson.status).toBe('draft_requires_review');
  const text=JSON.stringify(lesson);
  expect(text).not.toMatch(/—|\bje (aie|aille)|que il\b/);
  expect(lesson.boundaryFr).toContain('choisir entre indicatif et subjonctif');
  expect(new Set(lesson.practice.map(p=>p.promptFr)).size).toBe(6);
 }
});

it('preserves difficult written distinctions and natural modal contexts',()=>{
 const lesson=(verb:string)=>SUBJONCTIF_PRODUCTION_TEACHING.find(l=>l.facetKey?.endsWith(`::verb:${verb}`))!;
 expect(lesson('avoir').practice.map(p=>p.answerFr)).toEqual(['aie','aies','ait','ayons','ayez','aient']);
 expect(lesson('voir').practice.map(p=>p.answerFr)).toEqual(['voie','voies','voie','voyions','voyiez','voient']);
 expect(lesson('prendre').practice.map(p=>p.answerFr)).toEqual(['prenne','prennes','prenne','prenions','preniez','prennent']);
 for(const verb of ['vouloir','devoir'])for(const p of lesson(verb).practice){
  expect(p.promptFr).toContain('Il est possible');
  expect(p.promptFr).not.toContain('Il faut');
 }
});

it('identifies existing isolated forms as exposed, so these drafts cannot claim fresh checks',()=>{
 const expansion=JSON.parse(readFileSync('generated/french-v3-conjugation-expansion.json','utf8')) as DraftExpansion;
 for(const lesson of SUBJONCTIF_PRODUCTION_TEACHING){
  const verb=lesson.facetKey!.split('::verb:')[1];
  const items=expansion.items.filter(i=>i.item.nodeKey==='produire_subjonctif_present_frequent'&&i.item.validatorConfig?.verb===verb&&i.promptFamily==='controlled-form');
  expect(items.length,verb).toBeGreaterThanOrEqual(6);
  const keys=teachingMaterialKeys(lesson);
  for(const item of items)expect(questionAssessedMaterialKeys(item.item).some(k=>keys.includes(k)),item.itemKey).toBe(true);
 }
});
