import {expect,it} from 'vitest';
import {writingCaseEvidenceMatches as matches} from './writing-case-evidence';
it('requires each actual opportunity and its correctness, not just the same aggregate score',()=>{
 const answer='Il joue. Elle joues.';
 const expected=[{text:'joue',correct:true},{text:'joues',correct:false}];
 expect(matches(answer,[{start:0,end:7,correct:true},{start:9,end:19,correct:false}],expected)).toBe(true);
 expect(matches(answer,[{start:0,end:7,correct:false},{start:9,end:19,correct:true}],expected)).toBe(false);
 expect(matches(answer,[{start:0,end:19,correct:true}],expected)).toBe(false);
});
it('retains repeated occurrences, rubric identity and empty-scope expectations',()=>{
 const answer='Il joue et elle joue.';
 expect(matches(answer,[{start:3,end:7,correct:true,criterionId:'verb'},{start:16,end:20,correct:true,criterionId:'verb'}],[{text:'joue',correct:true,criterionId:'verb'},{text:'joue',occurrence:1,correct:true,criterionId:'verb'}])).toBe(true);
 expect(matches(answer,[{start:3,end:7,correct:true,criterionId:'noun'}],[{text:'joue',correct:true,criterionId:'verb'}])).toBe(false);
 expect(matches(answer,[],[])).toBe(true);
 expect(matches(answer,[{start:3,end:7,correct:true}],[])).toBe(false);
 expect(()=>matches(answer,[{start:3,end:7,correct:true}],[{text:'absent',correct:true}])).toThrow('anchor absent');
});
