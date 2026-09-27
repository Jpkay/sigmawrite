import {expect,it} from 'vitest';
import {CONNECTED_WRITING_DRAFTS,CONNECTED_WRITING_INSTRUCTIONS} from './connected-writing-drafts';
import {FRENCH_TAXONOMY_V3_CANDIDATE} from '@/lib/taxonomy/french-v3';
import {runGates} from '@/lib/ai/item-generation/pipeline';
it('binds every writing draft to an approved independent target without an exact answer',async()=>{
 for(const draft of CONNECTED_WRITING_DRAFTS){
  const node=FRENCH_TAXONOMY_V3_CANDIDATE.nodes.find(n=>n.key===draft.nodeKey)!;
  expect(node.evidence.some(e=>e.expectation==='independent_production')).toBe(true);
  const checked=await runGates({nodeKey:node.key,strand:node.strand,modality:'writing',learnerMode:'shared',responseType:'short_answer',promptFr:draft.promptFr,instructionsFr:CONNECTED_WRITING_INSTRUCTIONS,validatorType:'rubric',validatorConfig:{writingEvaluation:'source-bound-v1',...(draft.writingRubric?{writingRubric:draft.writingRubric}:{})}},{knownNodeKeys:new Set([node.key]),knownMisconceptionKeys:new Set()});
  expect(checked.gates.verdict).toBe('needs_human_review');expect(checked.item?.correctAnswer).toBeUndefined();
 }
 expect(new Set(CONNECTED_WRITING_DRAFTS.map(d=>d.contextKey)).size).toBe(CONNECTED_WRITING_DRAFTS.length);
});

it('provides three distinct writing situations for every approved independent-production node',()=>{
 const targets=FRENCH_TAXONOMY_V3_CANDIDATE.nodes.filter(node=>node.evidence.some(e=>e.expectation==='independent_production'));
 expect(targets).toHaveLength(18);
 expect(CONNECTED_WRITING_DRAFTS).toHaveLength(54);
 expect(new Set(CONNECTED_WRITING_DRAFTS.map(d=>d.key)).size).toBe(54);
 expect(new Set(CONNECTED_WRITING_DRAFTS.map(d=>d.promptFr)).size).toBe(54);
 for(const node of targets){
  expect(CONNECTED_WRITING_DRAFTS.filter(d=>d.nodeKey===node.key)).toHaveLength(3);
 }
});
