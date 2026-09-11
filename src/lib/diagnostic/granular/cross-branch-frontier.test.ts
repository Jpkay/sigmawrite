import {expect,it} from 'vitest';
import {assessSkills,selectProbe,type Skill,type Probe,type Observation} from './engine';
const skills:Skill[]=[
 {id:'foundation',branch:'a',domain:'reading',level:0,prerequisites:[],modes:['production']},
 {id:'unrelated',branch:'b',domain:'reading',level:1,prerequisites:[],modes:['production']},
 {id:'successor',branch:'z',domain:'reading',level:1,prerequisites:['foundation'],modes:['production']},
];
const bank:Probe[]=skills.flatMap(skill=>Array.from({length:6},(_,i)=>({id:`${skill.id}:${i}`,skillId:skill.id,mode:'production',contextId:`${skill.id}:context:${i}`,difficulty:.5,expectedSeconds:30,guessProbability:.05})));
const history:Observation[]=bank.slice(0,3).map(p=>({...p,itemId:p.id,correct:true,activeSeconds:30}));
it('follows a confirmed prerequisite across branches without crediting the new target',()=>{
 expect(assessSkills(skills,history).find(r=>r.skillId==='successor')!.status).toBe('unknown');
 const next=selectProbe(skills,bank,history);
 expect(next).toMatchObject({kind:'question',reason:'step_up',item:{skillId:'successor'}});
});
it('collects fresh confirmation at the reached frontier rather than falling back to alphabetical branch order',()=>{
 const next=selectProbe(skills,bank,history);if(next.kind!=='question')throw Error('Expected question');
 for(const correct of [true,false]){
  const evidence=[...history,{...next.item,itemId:next.item.id,correct,activeSeconds:30}];
  const followup=selectProbe(skills,bank,evidence);
  expect(followup).toMatchObject({kind:'question',reason:'confirmation',item:{skillId:'successor'}});
  if(followup.kind==='question')expect(followup.item.id).not.toBe(next.item.id);
  expect(assessSkills(skills,evidence).find(r=>r.skillId==='unrelated')!.status).toBe('unknown');
 }
});
it('does not advance from one known prerequisite when another is unassessed',()=>{
 const combined=skills.map(skill=>skill.id==='successor'?{...skill,prerequisites:['foundation','unrelated']}:skill);
 expect(selectProbe(combined,bank,history)).toMatchObject({kind:'question',item:{skillId:'unrelated'}});
 expect(assessSkills(combined,history).find(r=>r.skillId==='unrelated')!.status).toBe('unknown');
});
