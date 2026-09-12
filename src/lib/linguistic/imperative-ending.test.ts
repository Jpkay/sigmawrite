import {expect,it} from 'vitest';
import {validateAnswer} from './validator';
import type {ValidationSpec} from './types';
const spec:ValidationSpec={validatorType:'exact',correctAnswer:'Donne-le-moi !',config:{punctuationPolicy:'optional_imperative_ending'},assessment:{nodeKey:'ordonner_doubles_pronoms',modality:'writing',responseType:'transform',promptFr:'Réécris la phrase avec les pronoms donnés.'}};
it.each(['Donne-le-moi','Donne-le-moi.','Donne-le-moi!','Donne-le-moi !'])('allows only the unassessed imperative ending: %s',async answer=>{
 expect((await validateAnswer(answer,spec)).pass).toBe(true);
});
it.each(['Donne-moi-le','Donne le moi','Donne-le-moi?','Donne-le-moi!!','Donne-le-moi...','Donne-le-moi;','Donne,le-moi','Donnes-le-moi',''])('preserves assessed order, hyphens, spelling and other punctuation: %s',async answer=>{
 expect((await validateAnswer(answer,spec)).pass).toBe(false);
});
it('requires explicit source-owned policy and suitable exercise context',async()=>{
 for(const modified of [
  {...spec,config:undefined},{...spec,assessment:undefined},
  {...spec,assessment:{...spec.assessment,nodeKey:'ponctuation_phrase'}},
  {...spec,assessment:{...spec.assessment,modality:'dictation'}},
  {...spec,assessment:{...spec.assessment,responseType:'mcq'}},
  {...spec,assessment:{...spec.assessment,promptFr:'Ajoute le point d’exclamation final.'}},
 ])expect((await validateAnswer('Donne-le-moi',modified)).pass).toBe(false);
});
it('keeps internal apostrophes strict',async()=>{
 const target={...spec,correctAnswer:'Donne-m’en !'};
 expect((await validateAnswer("Donne-m'en.",target)).pass).toBe(true);
 expect((await validateAnswer('Donne-men.',target)).pass).toBe(false);
});
