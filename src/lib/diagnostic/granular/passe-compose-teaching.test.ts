import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PASSE_COMPOSE_TEACHING} from './passe-compose-teaching';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import type {DraftExpansion} from './assemble-drafts';
const expansion=JSON.parse(readFileSync('generated/french-v3-conjugation-expansion.json','utf8')) as DraftExpansion;
it('uses the stated subjects and distinguishes leaving from taking something out',()=>{
 const lesson=(verb:string)=>PASSE_COMPOSE_TEACHING.find(l=>l.id.endsWith(`:${verb}`))!;
 expect(lesson('partir').practice.map(p=>p.answerFr)).toEqual(['suis parti','es parti','est partie','sommes partis','êtes partis','sont partis']);
 expect(lesson('venir').practice.map(p=>p.answerFr)).toEqual(['suis venu','es venu','est venu','sommes venus','êtes venus','sont venues']);
 expect(lesson('sortir').practice.map(p=>p.answerFr)).toEqual(['suis sorti','as sorti','est sorti','avons sorti','êtes sortis','sont sorties']);
 expect(lesson('partir').practice[3].promptFr).toContain('dix minutes après le concert');
 expect(lesson('partir').practice[2].promptFr).toContain('Sujet féminin singulier');
});
it('assesses feminine and masculine agreements and both auxiliary constructions independently of guided examples',()=>{
 const items=expansion.items.filter(i=>i.itemKey.includes('passe_compose-application-context:'));
 expect(items).toHaveLength(168);
 const sortir=items.filter(i=>i.itemKey.includes(':sortir:'));
 expect(sortir.map(i=>i.item.correctAnswer)).toEqual(['ai sorti','es sortie','est sortie','sommes sortis','avez sorti','sont sorties','ai sorti','es sorti','est sorti','sommes sorties','avez sorti','sont sortis']);
 const taught=new Set(PASSE_COMPOSE_TEACHING.flatMap(teachingMaterialKeys));
 for(const entry of items){
  expect(entry.reviewStatus).toBe('needs_human_review');
  expect(entry.review).toBeUndefined();
  expect(questionAssessedMaterialKeys(entry.item).some(k=>taught.has(k)),entry.itemKey).toBe(false);
 }
 expect(PASSE_COMPOSE_TEACHING).toHaveLength(14);
 for(const l of PASSE_COMPOSE_TEACHING){
  expect(l.status).toBe('draft_requires_review');
  expect(l.materialExposure?.sentences?.some(s=>s.includes('___'))).toBe(false);
 }
});
