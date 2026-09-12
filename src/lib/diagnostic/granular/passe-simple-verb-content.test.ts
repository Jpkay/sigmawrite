import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {PASSE_SIMPLE_VERBS,PASSE_SIMPLE_VERB_TEACHING as lessons} from './passe-simple-verb-content';
import {validateAnswer} from '../../linguistic/validator';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from './material-annotations';
import {writtenGuessingFloor} from './response-space';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
it('provides separate verb targets with all persons and checks not used in teaching',async()=>{
 const artifact=read('generated/french-v3-passe-simple-verb-production-expansion.json');
 expect(lessons.map(l=>l.facetKey)).toEqual(['être','avoir','aller','faire','dire','prendre','voir','venir'].map(v=>'produire_passe_simple::verb:'+v));
 expect(artifact.items).toHaveLength(96);
 const taught=new Set(lessons.flatMap(teachingMaterialKeys)),seen=new Set<string>();
 for(const entry of artifact.items as CanonicalDiagnosticBankItem[]){
  expect(entry.reviewStatus).toBe('needs_human_review');
  const item=entry.item;
  expect((await validateAnswer(item.correctAnswer!,{validatorType:item.validatorType,correctAnswer:item.correctAnswer,config:item.validatorConfig})).pass).toBe(true);
  expect(writtenGuessingFloor(item)).toBeCloseTo(item.validatorConfig?.verb==='aller'?1/6:1/5);
  for(const key of questionAssessedMaterialKeys(item)){expect(taught.has(key)).toBe(false);expect(seen.has(key)).toBe(false);seen.add(key);}
 }
 for(const lesson of lessons){expect(lesson.practice).toHaveLength(6);expect(lesson.status).toBe('draft_requires_review');}
 for(const verb of PASSE_SIMPLE_VERBS)for(const person of ['1s','2s','3s','1p','2p','3p'])expect(artifact.items.filter((e:CanonicalDiagnosticBankItem)=>e.item.validatorConfig?.verb===verb.verb&&e.item.validatorConfig?.person===person)).toHaveLength(2);
});
it('rejects the corresponding present/imperfect forms and meaningful accent errors',async()=>{
 for(const [verb,person,correct,wrong] of [['être','3s','fut','fût'],['avoir','3s','eut','eût'],['faire','3s','fit','fît'],['aller','1s','allai','allais'],['avoir','1p','eûmes','eumes'],['être','2p','fûtes','futes'],['faire','1p','fîmes','fimes'],['dire','2p','dîtes','dites'],['prendre','3s','prit','pris'],['prendre','1p','prîmes','primes'],['voir','3s','vit','voit'],['voir','1p','vîmes','vimes'],['venir','3s','vint','vînt'],['venir','1p','vînmes','vînnmes'],['venir','2p','vîntes','vintes']] as const){
  const spec={validatorType:'conjugator' as const,config:{verb,tense:'passe_simple',person}};
  expect((await validateAnswer(correct,spec)).pass).toBe(true);expect((await validateAnswer(wrong,spec)).pass).toBe(false);
 }
});
it('binds exact lessons and replaces isolated-form probes with contextual checks in both phases',()=>{
 const scoped=read('docs/diagnostic/v3-scoped-review-candidate.json'),parallel=read('docs/diagnostic/v3-parallel-review-candidate.json');
 for(const verb of PASSE_SIMPLE_VERBS){
  const id='produire_passe_simple::writing-controlled-production::verb:'+verb.verb;
  expect(scoped.assessment.releaseScope.teachingSkillIds).toContain(id);
  const probes=parallel.assessment.probes.filter((p:{skillId:string})=>p.skillId===id);
  for(const usage of ['initial','learning'])expect(probes.filter((p:{usage:string})=>p.usage===usage).length).toBeGreaterThanOrEqual(5);
  expect(probes.every((p:{id:string})=>p.id.startsWith('v3-passe-simple-verb-production:'))).toBe(true);
 }
});
