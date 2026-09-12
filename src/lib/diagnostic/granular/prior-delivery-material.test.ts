import {expect,it} from 'vitest';
import {priorDeliveredMaterial} from './prior-delivery-material';
import {materialIdentity} from './material-identity';
import type {CanonicalDiagnosticBankItem} from '../item-bank';
const base={nodeKey:'synthetic',strand:'grammar',modality:'writing' as const,learnerMode:'shared' as const,responseType:'short_answer' as const,validatorType:'exact' as const,correctAnswer:'chevaux',acceptableAnswers:[]};
const item={...base,promptFr:'Les chevaux courent. Écris le mot son.',validatorConfig:{materialExposure:{words:[{lemma:'cheval',form:'chevaux'},{lemma:'son',form:'son'}],sentences:['Les chevaux courent.']}}} satisfies CanonicalDiagnosticBankItem['item'];
const history=(text:string)=>[{boundary:'legacy:reading-text',payloadChecksum:'sha256:source',textFragments:[text]}];
it('maps only source-anchored word forms and sentences to existing material identities',()=>{
 const matches=priorDeliveredMaterial(item,history('Hier : LES CHEVAUX COURENT. Puis ils rentrent.'));
 expect(matches.map(m=>m.materialKey).sort()).toEqual([materialIdentity('word','cheval'),materialIdentity('sentence','Les chevaux courent.')].sort());
 expect(matches.every(m=>m.payloadChecksum==='sha256:source')).toBe(true);
});
it('does not match short words inside unrelated words or infer unseen morphology',()=>{
 expect(priorDeliveredMaterial(item,history('poisson chevalier sonnerie'))).toEqual([]);
 expect(priorDeliveredMaterial(item,history('chevaline'))).toEqual([]);
 expect(priorDeliveredMaterial(item,history('son'))[0].materialKey).toBe(materialIdentity('word','son'));
});
it('retains accents and normalizes apostrophes and surrounding spacing consistently',()=>{
 const elision={...base,promptFr:"L’été arrive.",validatorConfig:{materialExposure:{sentences:['L’été arrive.']}}} satisfies CanonicalDiagnosticBankItem['item'];
 expect(priorDeliveredMaterial(elision,history("l' été   arrive !"))).toHaveLength(1);
 expect(priorDeliveredMaterial(elision,history("l'ete arrive"))).toEqual([]);
});
it('does not invent identities for unannotated sources or treat no match as a completeness proof',()=>{
 expect(priorDeliveredMaterial({...base,promptFr:'Texte'},history('Texte'))).toEqual([]);
 expect(priorDeliveredMaterial(item,[])).toEqual([]);
});
