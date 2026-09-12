import {expect,it} from 'vitest';
import {checkWritingImperativeForm} from './writing-imperative-form';
it('rejects the live false-positive imperative forms without rejecting their corrections',()=>{
 for(const [infinitive,bad,good] of [['prendre','Prend','Prends'],['mettre','met','mets'],['attendre','Attend','Attends'],['rejoindre','rejoint','rejoins']]){
  expect(checkWritingImperativeForm({infinitive,form:bad,suffix:' ton sac.'}).valid).toBe(false);
  expect(checkWritingImperativeForm({infinitive,form:good,suffix:' ton sac.'}).valid).toBe(true);
 }
});
it('preserves regular, irregular and spelling-adjusted forms at all three persons',()=>{
 for(const [infinitive,forms] of [['parler',['parle','parlons','parlez']],['finir',['finis','finissons','finissez']],['manger',['mange','mangeons','mangez']],['lancer',['lance','lançons','lancez']],['être',['sois','soyons','soyez']],['avoir',['aie','ayons','ayez']]] as const)
  for(const form of forms)expect(checkWritingImperativeForm({infinitive,form,suffix:'.'}).valid).toBe(true);
});
it('accepts the liaison s only before an attached en or y',()=>{
 for(const [infinitive,form,suffix] of [['manger','manges','-en.'],['aller','vas','-y !'],['parler','parles','-en à Lina.']])expect(checkWritingImperativeForm({infinitive,form,suffix}).valid).toBe(true);
 for(const suffix of [' ton repas.',' en silence.','-ensemble.'])expect(checkWritingImperativeForm({infinitive:'manger',form:'manges',suffix}).valid).toBe(false);
 expect(checkWritingImperativeForm({infinitive:'manger',form:'mange',suffix:'-en.'}).valid).toBe(false);
 expect(checkWritingImperativeForm({infinitive:'aller',form:'va',suffix:'-y.'}).valid).toBe(false);
});
it('leaves unsupported paradigms unresolved instead of inventing a wrong-answer verdict',()=>{
 for(const infinitive of ['appeler','envoyer','pouvoir','inventerverbe'])expect(()=>checkWritingImperativeForm({infinitive,form:'appelle',suffix:'.'})).toThrow();
});
