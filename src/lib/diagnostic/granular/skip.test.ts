import {expect,it} from "vitest";
import {assessSkills,selectProbe,type Skill,type Probe} from "./engine";
import {createSession,transitionSession,sessionView} from "./session";
const release={taxonomyId:"test",bankId:"test",checksum:"test"};
const skills:Skill[]=[{id:"base",branch:"grammar",level:0,modes:["production"],prerequisites:[]},{id:"advanced",branch:"grammar",level:1,modes:["production"],prerequisites:["base"]}];
const bank:Probe[]=skills.flatMap(skill=>Array.from({length:6},(_,i)=>({id:`${skill.id}-${i}`,skillId:skill.id,mode:"production",contextId:`context-${i}`,difficulty:.5,expectedSeconds:20,guessProbability:.05,usage:i<3?"initial":"learning"})));
function setup(){let state=createSession(release);const send=(event:Parameters<typeof transitionSession>[0]["event"])=>state=transitionSession({state,release,expectedRevision:state.revision,event,skills,bank});return {send,get:()=>state};}
it("records exposure and active time but no failure evidence, then tries an easier prerequisite",()=>{
 const f=setup();f.send({type:"resume",at:0});const itemId=f.get().pendingItemId!;
 expect(itemId).toContain("advanced");f.send({type:"skip",itemId,at:5000});
 expect(f.get().observations[0]).toMatchObject({itemId,skipped:true,activeSeconds:5});
 expect(f.get().activeSeconds).toBe(5);expect(f.get().pendingItemId).toContain("base");
 expect(sessionView(f.get(),skills).results.every(result=>result.status==="unknown")).toBe(true);
 const snapshot=structuredClone(f.get());f.send({type:"skip",itemId,at:6000});expect(f.get()).toEqual(snapshot);
});
it("keeps all-skipped skills unresolved and hands off to reserved later checks",()=>{
 const f=setup();f.send({type:"resume",at:0});let timestamp=0;
 while(f.get().phase==="assessing"){timestamp+=1000;f.send({type:"skip",itemId:f.get().pendingItemId!,at:timestamp});if(timestamp>12000)throw Error("Skip loop");}
 expect(f.get().completionReason).toBe("later_evidence_required");
 expect(assessSkills(skills,f.get().observations).every(result=>result.status==="unknown"&&!result.resolved)).toBe(true);
 expect(new Set(f.get().observations.map(o=>o.itemId)).size).toBe(f.get().observations.length);
});
it("rejects paused or unrelated skips and cannot turn a skipped question into a correct retry",()=>{
 const f=setup();expect(()=>f.send({type:"skip",itemId:bank[0].id,at:0})).toThrow();
 f.send({type:"resume",at:0});expect(()=>f.send({type:"skip",itemId:"other",at:1000})).toThrow();
 const itemId=f.get().pendingItemId!;f.send({type:"skip",itemId,at:1000});
 f.send({type:"answer",itemId,correct:true,at:2000});
 expect(f.get().observations).toHaveLength(1);expect(f.get().observations[0].skipped).toBe(true);
 expect(selectProbe(skills,bank,f.get().observations)).toMatchObject({kind:"question"});
});
