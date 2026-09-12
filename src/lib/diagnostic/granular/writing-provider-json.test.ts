import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {parseWritingProviderJson} from './writing-provider-json';
import {createWritingEvaluator} from './writing-evaluator';
it('replays captured provider envelopes without changing any grading payload value',async()=>{
 const bank=JSON.parse(readFileSync('generated/diagnostic-bank-v3-draft.json','utf8'));
 const fixture=JSON.parse(readFileSync('docs/diagnostic/writing/json-envelope-regressions.json','utf8'));
 expect(fixture.cases.length).toBeGreaterThan(0);
 for(const {source,rawResponse} of fixture.cases){
  const parsed=parseWritingProviderJson(rawResponse);
  expect(parsed).toEqual(JSON.parse(rawResponse.slice(2)));
  const evaluate=createWritingEvaluator(async()=>parsed);
  const result=await evaluate({skillId:source.node+'::writing-independent-production',answer:source.answer,item:{...bank.items[0].item,nodeKey:source.node,promptFr:source.prompt}});
  const observed=!result.tokens.length?'unresolved':result.tokens.every(t=>t.correct)?'correct':'incorrect';
  expect(observed).toBe(source.expect);
  for(const token of result.tokens)expect(source.answer.slice(token.start,token.end)).toBe(token.text);
 }
});
it('keeps ordinary JSON and rejects truncated, ambiguous or non-grading envelope payloads',()=>{
 const value={uncertain:false,connectedWriting:true,revisionReviewed:false,opportunities:[]};
 expect(parseWritingProviderJson(JSON.stringify(value))).toEqual(value);
 expect(parseWritingProviderJson('```json\n'+JSON.stringify(value)+'\n```')).toEqual(value);
 for(const raw of ['{"{"uncertain":false,','{"{"other":true}','{"{"uncertain":false,"connectedWriting":true,"revisionReviewed":false,"opportunities":[]} trailing'])expect(()=>parseWritingProviderJson(raw)).toThrow();
});
