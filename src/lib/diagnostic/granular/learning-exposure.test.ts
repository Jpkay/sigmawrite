import {expect,it} from "vitest";
import {learningSeenQuestionIds} from "./learning-exposure";
import {createSession,transitionSession} from "./session";
import type {Probe,Skill} from "./engine";
const release={taxonomyId:"test",bankId:"test",checksum:"test"};
const skill:Skill={id:"reading",branch:"reading",level:0,modes:["interpretation"],prerequisites:[]};
const probe=(id:string,contextId:string,usage:"initial"|"learning"):Probe=>({id,skillId:skill.id,mode:"interpretation",contextId,difficulty:.5,expectedSeconds:30,guessProbability:.25,usage});
const bank=[probe("initial","passage-content:same","initial"),probe("renamed-copy","passage-content:same","learning"),probe("fresh","passage-content:new","learning")];
it("retains an unanswered passage through time-budget completion and rejects its renamed learning copy",()=>{
 let state=createSession(release);
 const apply=(event:Parameters<typeof transitionSession>[0]["event"])=>{state=transitionSession({state,release,expectedRevision:state.revision,event,skills:[skill],bank});};
 apply({type:"resume",at:0});
 expect(state.pendingItemId).toBe("initial");
 expect(state.exposedReadingContexts).toEqual(["passage-content:same"]);
 for(let at=30_000;at<=2_100_000;at+=30_000)apply({type:"pulse",at});
 expect(state.phase).toBe("learning");expect(state.observations).toEqual([]);
 state=JSON.parse(JSON.stringify(state));
 expect(learningSeenQuestionIds(state,bank).has("renamed-copy")).toBe(true);
 expect(()=>apply({type:"issue_check",check:{id:"copy",activityId:"check",itemId:"renamed-copy",occasionId:"day-2"}})).toThrow(/already exposed/);
 apply({type:"issue_check",check:{id:"fresh",activityId:"check",itemId:"fresh",occasionId:"day-2"}});
 expect(state.learningCheck?.itemId).toBe("fresh");
 expect(state.exposedReadingContexts).toContain("passage-content:new");
});
it("recognizes older answered or abandoned item identities without treating unrelated verb contexts as reading",()=>{
 const state={...createSession(release),exposedLearningItemIds:["initial","verb-old"]};
 const extra=[...bank,probe("verb-old","verb:aller","initial"),probe("verb-new","verb:aller","learning")];
 const seen=learningSeenQuestionIds(state,extra);
 expect(seen.has("renamed-copy")).toBe(true);expect(seen.has("fresh")).toBe(false);expect(seen.has("verb-new")).toBe(false);
});
