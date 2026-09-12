import {expect,it} from 'vitest';
import {isSourceBoundWritingItem} from './writing-item-contract';
import {runGates,runItemGenerationPipeline} from '@/lib/ai/item-generation/pipeline';
import type {GeneratedItem} from '@/lib/ai/item-generation/schemas';
const item:GeneratedItem={nodeKey:'employer_imparfait_en_contexte',strand:'conjugaison',modality:'writing',learnerMode:'shared',responseType:'short_answer',promptFr:'Décris une habitude de ton personnage autrefois.',acceptableAnswers:[],validatorType:'rubric',validatorConfig:{writingEvaluation:'source-bound-v1'}};
it('admits an explicitly scoped writing task without inventing an exact answer, while retaining review status',async()=>{
 expect(isSourceBoundWritingItem(item)).toBe(true);
 const result=await runGates(item,{knownNodeKeys:new Set([item.nodeKey]),knownMisconceptionKeys:new Set()});
 expect(result.item?.correctAnswer).toBeUndefined();expect(result.gates.verdict).toBe('needs_human_review');expect(result.gates.gate2_answer_key.reason).toContain('require review');
});
it('rejects ordinary rubric items, answer-key placeholders and response-mode mismatches',async()=>{
 for(const override of [{validatorConfig:{}},{correctAnswer:'Tout texte correct'},{acceptableAnswers:['exemple']},{modality:'reading'},{responseType:'mcq'},{choices:[]}])expect(isSourceBoundWritingItem({...item,...override} as GeneratedItem)).toBe(false);
 const result=await runGates({...item,validatorConfig:{}},{knownNodeKeys:new Set([item.nodeKey]),knownMisconceptionKeys:new Set()});expect(result.gates.verdict).toBe('rejected');
});
it('requires task-specific criteria for lexical and grammatical spelling',()=>{
 expect(isSourceBoundWritingItem({...item,nodeKey:'maintenir_orthographe_lexicale_phrase'})).toBe(false);
 expect(isSourceBoundWritingItem({...item,nodeKey:'maintenir_orthographe_grammaticale_phrase'})).toBe(false);
});

it('allows the new contract through generation only for independent production',async()=>{
 for(const expectation of ['independent_production','controlled_production','receptive']){
  const result=await runItemGenerationPipeline({nodeKey:item.nodeKey,strand:item.strand,labelFr:'Écriture',modality:'writing',learnerMode:'shared',count:1,hint:{expectation}},{knownNodeKeys:new Set([item.nodeKey]),knownMisconceptionKeys:new Set(),generator:{generateItems:async()=>[item]}});
  expect(result[0].gates.verdict).toBe(expectation==='independent_production'?'needs_human_review':'rejected');
 }
});
