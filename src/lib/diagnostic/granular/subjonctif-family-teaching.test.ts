import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {SUBJONCTIF_FAMILY_TEACHING,subjunctiveContext} from './subjonctif-family-teaching';
import {validateTeachingTargets} from './teaching-content';
import {teachingMaterialKeys} from './material-annotations';
it('provides four exact family lessons with finite subject rules and explicit boundaries',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,SUBJONCTIF_FAMILY_TEACHING);
 expect(SUBJONCTIF_FAMILY_TEACHING).toHaveLength(4);
 for(const lesson of SUBJONCTIF_FAMILY_TEACHING){
  expect(lesson.practice.length).toBeGreaterThanOrEqual(6);expect(lesson.status).toBe('draft_requires_review');
  expect(lesson.boundaryFr).toContain('pas le choix du mode');
  expect(teachingMaterialKeys(lesson).length).toBeGreaterThan(6);
  expect(JSON.stringify(lesson)).not.toMatch(/—|que elle|que ils|je écoute/);
 }
});
it('distinguishes the ger and cer spelling from present-indicative nous forms',()=>{
 const ger=SUBJONCTIF_FAMILY_TEACHING.find(l=>l.facetKey?.endsWith('spelling_ger'))!;
 const cer=SUBJONCTIF_FAMILY_TEACHING.find(l=>l.facetKey?.endsWith('spelling_cer'))!;
 expect(ger.practice.map(p=>p.answerFr)).toEqual(['nage','manges','voyage','bougions','mélangions','partagions','rangiez','chargent']);
 expect(cer.practice.map(p=>p.answerFr)).toEqual(['avance','lances','commence','placions','annoncions','remplacions','effaciez','tracent']);
 const ir=SUBJONCTIF_FAMILY_TEACHING.find(l=>l.facetKey?.endsWith('regular_ir'))!;
 expect(ir.practice.map(p=>p.answerFr)).toEqual(['nourrisse','remplisses','ralentisse','réfléchissions','obéissiez','applaudissent']);
});
it('keeps subordinate subjects and elides que before pronouns',()=>{
 expect(subjunctiveContext('Elle ___ en train.')).toBe('Il faut qu’elle ___ en train.');
 expect(subjunctiveContext('Ils ___ les sacs.')).toBe('Il faut qu’ils ___ les sacs.');
 expect(subjunctiveContext('Le bus ___ avant le virage.')).toBe('Il faut que le bus ___ avant le virage.');
});
