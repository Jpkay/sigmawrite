import {expect,it} from 'vitest';
import {writingTransportSchema} from './writing-evaluator';
function requireAllFields(value:unknown){
 if(!value||typeof value!=='object')return;
 const node=value as Record<string,unknown>;
 if(node.type==='object'){
  expect(node.additionalProperties).toBe(false);
  expect(new Set(node.required as string[])).toEqual(new Set(Object.keys(node.properties as object)));
 }
 for(const child of Object.values(node))if(Array.isArray(child))child.forEach(requireAllFields);else requireAllFields(child);
}
it('requires explicit uncertainty and only the evidence fields relevant to the target',()=>{
 for(const nodeKey of ['employer_imparfait_en_contexte','employer_imperatif_en_contexte','reviser_orthographe_lexicale_paragraphe']){
  const schema=writingTransportSchema(undefined,nodeKey);requireAllFields(schema);
  expect(schema.required).toContain('uncertain');
  const text=JSON.stringify(schema);
  expect(text.includes('imperativeForm')).toBe(nodeKey==='employer_imperatif_en_contexte');
  expect(text.includes('revisionEvidence')).toBe(nodeKey==='reviser_orthographe_lexicale_paragraphe');
  expect(text.includes('criterionId')).toBe(false);
 }
});
it('constrains rubric criteria to the task-owned identifiers',()=>{
 const schema=writingTransportSchema({version:1,nodeKey:'maintenir_orthographe_lexicale_phrase',criteria:[{id:'word:cheval',descriptionFr:'Observer uniquement le nom cheval.'}],exclusionsFr:[]},'maintenir_orthographe_lexicale_phrase');
 requireAllFields(schema);expect(JSON.stringify(schema)).toContain('word:cheval');expect(JSON.stringify(schema)).toContain('criterionId');
});
