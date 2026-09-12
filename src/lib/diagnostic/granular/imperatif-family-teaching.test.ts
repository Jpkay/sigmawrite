import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {IMPERATIF_FAMILY_TEACHING} from './imperatif-family-teaching';
import {validateTeachingTargets} from './teaching-content';
import {teachingMaterialKeys} from './material-annotations';
it('maps four imperative family lessons to existing exact production targets',()=>{
 const candidate=JSON.parse(readFileSync('docs/diagnostic/v3-parallel-review-candidate.json','utf8'));
 validateTeachingTargets(candidate.assessment,IMPERATIF_FAMILY_TEACHING);
 expect(IMPERATIF_FAMILY_TEACHING).toHaveLength(4);
 for(const l of IMPERATIF_FAMILY_TEACHING){
  expect(l.practice).toHaveLength(6);
  expect(l.practice.filter(p=>p.promptFr.startsWith('Tu donnes une consigne à une personne'))).toHaveLength(2);
  expect(l.practice.filter(p=>p.promptFr.startsWith('Tu proposes une action'))).toHaveLength(2);
  expect(l.practice.filter(p=>p.promptFr.startsWith('Tu donnes une consigne à plusieurs'))).toHaveLength(2);
  expect(teachingMaterialKeys(l).length).toBeGreaterThan(6);
  expect(l.status).toBe('draft_requires_review');
  expect(l.boundaryFr).toContain('manges-en');
  expect(JSON.stringify(l)).not.toMatch(/—|delve into/);
 }
});
it('keeps the written contrasts that differentiate the four families',()=>{
 const by=(key:string)=>IMPERATIF_FAMILY_TEACHING.find(l=>l.facetKey?.endsWith(key))!;
 expect(by('regular_er').practice.map(p=>p.answerFr)).toEqual(['écoute','regarde','préparons','cherchons','dessinez','fermez']);
 expect(by('regular_ir').practice.map(p=>p.answerFr)).toEqual(['choisis','remplis','réfléchissons','ralentissons','applaudissez','finissez']);
 expect(by('spelling_ger').practice.map(p=>p.answerFr)).toEqual(['range','bouge','partageons','mélangeons','changez','nagez']);
 expect(by('spelling_cer').practice.map(p=>p.answerFr)).toEqual(['place','efface','commençons','avançons','tracez','lancez']);
});
