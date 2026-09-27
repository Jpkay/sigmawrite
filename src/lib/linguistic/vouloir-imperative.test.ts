import {describe,expect,it} from 'vitest';
import {validateAnswer} from './validator';
import {vouloirImperativeAnswers} from './vouloir-imperative';
import type {Person} from './conjugation';
const spec=(person:Person,use?:unknown)=>({validatorType:'conjugator' as const,correctAnswer:'not trusted as a conjugation rule',config:{verb:'vouloir',tense:'imperatif_present',person,...(use===undefined?{}:{vouloirImperativeUse:use})}});
describe('context-bound vouloir imperative validation',()=>{
 it('accepts the two attested series for authored en vouloir contexts',async()=>{
  for(const [person,forms] of [['2s',['veux','veuille']],['1p',['voulons','veuillons']],['2p',['voulez','veuillez']]] as const){
   for(const form of forms)expect((await validateAnswer(form,spec(person,'resentment'))).pass).toBe(true);
  }
 });
 it('does not treat the ordinary series as a polite request',async()=>{
  for(const [person,correct,wrong] of [['2s','veuille','veux'],['2p','veuillez','voulez']] as const){
   expect((await validateAnswer(correct,spec(person,'polite_request'))).pass).toBe(true);
   expect((await validateAnswer(wrong,spec(person,'polite_request'))).pass).toBe(false);
  }
 });
 it('rejects person, mood and spelling mistakes in both uses',async()=>{
  for(const use of ['polite_request','resentment'])for(const wrong of ['veulent','veuilles','vouliez','voudriez','veillez','vouloir'])expect((await validateAnswer(wrong,spec('2p',use))).pass).toBe(false);
  expect((await validateAnswer('veux',spec('2p','resentment'))).pass).toBe(false);
  expect((await validateAnswer('  VEUILLEZ  ',spec('2p','polite_request'))).pass).toBe(true);
 });
 it('fails closed on unsupported contexts rather than accepting arbitrary alternatives',async()=>{
  for(const use of ['anything',null,[],{answers:['wrong']}])expect((await validateAnswer('veuillez',spec('2p',use))).pass).toBe(false);
  expect((await validateAnswer('veuillons',spec('1p','polite_request'))).pass).toBe(false);
  expect((await validateAnswer('veuille',spec('3s','resentment'))).pass).toBe(false);
  expect(()=>vouloirImperativeAnswers('savoir','imperatif_present','2p','resentment')).toThrow();
  expect(()=>vouloirImperativeAnswers('vouloir','present','2p','resentment')).toThrow();
 });
 it('preserves existing unannotated items and ignores unchecked acceptable-answer overrides',async()=>{
  expect((await validateAnswer('veuillez',spec('2p'))).pass).toBe(true);
  expect((await validateAnswer('voulez',spec('2p'))).pass).toBe(false);
  expect((await validateAnswer('wrong',{...spec('2p','resentment'),acceptableAnswers:['wrong']})).pass).toBe(false);
 });
});
