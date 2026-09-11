import {expect,it} from 'vitest';
import {resolveTeachingScope} from './teaching-scope';
it('retains an available branch while excluding a target with a missing transitive prerequisite',()=>{
 const skills=[{id:'reading',prerequisites:['pronoun']},{id:'pronoun',prerequisites:['subject']},{id:'subject',prerequisites:[]},{id:'spelling',prerequisites:[]}];
 expect(resolveTeachingScope(skills,new Set(['reading','pronoun','spelling']))).toEqual({included:['spelling'],blocked:[{skillId:'pronoun',missingPrerequisiteIds:['subject']},{skillId:'reading',missingPrerequisiteIds:['subject']}]});
 expect(skills[0].prerequisites).toEqual(['pronoun']);
 expect(resolveTeachingScope(skills,new Set(skills.map(s=>s.id)))).toEqual({included:['pronoun','reading','spelling','subject'],blocked:[]});
});
it('rejects unknown graph references instead of silently omitting them',()=>{
 expect(()=>resolveTeachingScope([{id:'reading',prerequisites:['absent']}],new Set(['reading']))).toThrow('Unknown scope target: absent');
});
