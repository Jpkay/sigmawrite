import {expect,it} from 'vitest';
import {resolveIndexedWritingJudgment,writingWordIndex} from './writing-word-index';
import {resolveWritingExcerpt} from './writing-evaluator';
it('retrieves exact accented source words and counts whole-word occurrences',()=>{
 const answer='🐴 poisson son, l’oiseau et son jardin.';
 const words=writingWordIndex(answer);const sons=words.filter(w=>w.text==='son');
 for(const word of sons){
  const result=resolveIndexedWritingJudgment({startWord:word.id,endWord:word.id},answer) as {excerpt:string;occurrence:number};
  expect(resolveWritingExcerpt(answer,result.excerpt,result.occurrence)).toEqual({start:word.start,end:word.end,text:'son'});
 }
 expect(resolveIndexedWritingJudgment({startWord:1,endWord:1},answer)).toEqual({excerpt:'son',occurrence:0});
});
it('resolves revision evidence against the first draft without correcting it',()=>{
 const result=resolveIndexedWritingJudgment({opportunities:[{startWord:1,endWord:1,revisionEvidence:{kind:'corrected',before:{startWord:1,endWord:1}}}]},'La barrière tombe.','La barière tombe.') as {opportunities:Array<{excerpt:string;revisionEvidence:{before:{excerpt:string}}}>};
 expect(result.opportunities[0].excerpt).toBe('barrière');expect(result.opportunities[0].revisionEvidence.before.excerpt).toBe('barière');
});
it('rejects invented quotes, missing drafts and invalid source ranges',()=>{
 for(const raw of [{excerpt:'aurions',occurrence:0},{startWord:1,endWord:0},{startWord:99,endWord:99},{startWord:.5,endWord:1},{startWord:0}])expect(()=>resolveIndexedWritingJudgment(raw,'Nous avions faim.')).toThrow();
 expect(()=>resolveIndexedWritingJudgment({before:{startWord:0,endWord:0}},'Texte.')).toThrow('Missing writing first draft');
 expect(resolveIndexedWritingJudgment({startWord:1,endWord:1},'Nous avions faim.')).toEqual({excerpt:'avions',occurrence:0});
});
it('retains punctuation and exact apostrophes inside a multiword selection',()=>{
 const text='L’oiseau, près d’ici, chante.';const w=writingWordIndex(text);
 const result=resolveIndexedWritingJudgment({startWord:0,endWord:4},text) as {excerpt:string;occurrence:number};
 expect(result.excerpt).toBe(text.slice(w[0].start,w[4].end));expect(resolveWritingExcerpt(text,result.excerpt,0).text).toBe(result.excerpt);
});

it('rejects an overlapping repeated phrase rather than relocating its evidence',()=>{
 expect(()=>resolveIndexedWritingJudgment({startWord:1,endWord:2},'a a a a a')).toThrow('overlapping excerpt ordinal');
});
