import { expect, it } from "vitest";
import { assessSkills, type Observation, type Skill } from "./engine";
import { buildGranularPriorities } from "./pathway";
const skills: Skill[] = ["etre","avoir"].map(id=>({id,branch:id,level:0,modes:["production"],prerequisites:[]}));
const evidence = (skillId:string,correct:boolean):Observation[] => Array.from({length:3},(_,i)=>({itemId:`${skillId}-${i}`,contextId:`context-${i}`,skillId,mode:"production",correct,guessProbability:.05,activeSeconds:20}));
it("same total score with opposite verb gaps leads to opposite first activities",()=>{
 const left=buildGranularPriorities(skills,assessSkills(skills,[...evidence("etre",true),...evidence("avoir",false)]));
 const right=buildGranularPriorities(skills,assessSkills(skills,[...evidence("etre",false),...evidence("avoir",true)]));
 expect(left).toEqual([{skillId:"avoir",action:"learn",modes:["production"],reason:"demonstrated_gap"}]);
 expect(right).toEqual([{skillId:"etre",action:"learn",modes:["production"],reason:"demonstrated_gap"}]);
});
it("checks an untested prerequisite before teaching its dependent",()=>{
 const graph:Skill[]=[skills[0],{...skills[1],level:1,prerequisites:["etre"]}];
 const path=buildGranularPriorities(graph,assessSkills(graph,evidence("avoir",false)));
 expect(path.map(p=>p.skillId)).toEqual(["etre","avoir"]);
 expect(path[0]).toMatchObject({action:"verify",reason:"unverified_foundation"});
});
it("does not label an unanswered skill as a demonstrated weakness",()=>{
 expect(buildGranularPriorities(skills,assessSkills(skills,[])).every(p=>p.action==="verify")).toBe(true);
});

it("checks a weak unresolved signal before unrelated untested skills without calling it a gap",()=>{
 const graph:Skill[]=[{...skills[0],id:"a-unseen"},{...skills[0],id:"z-weak"}];
 const observations=[{itemId:"one",skillId:"z-weak",mode:"production" as const,contextId:"one",correct:false,guessProbability:.5,activeSeconds:20}];
 const results=assessSkills(graph,observations),snapshot=structuredClone(results);
 expect(results.find(r=>r.skillId==="z-weak")!.resolved).toBe(false);
 expect(buildGranularPriorities(graph,results,1)[0]).toMatchObject({skillId:"z-weak",action:"verify",reason:"insufficient_evidence"});
 expect(results).toEqual(snapshot);
});
it("keeps prerequisite checks ahead of weak unresolved evidence and ignores empty probability claims",()=>{
 const graph:Skill[]=[{...skills[0],id:"a-unseen"},{...skills[0],id:"y-prerequisite"},{...skills[0],id:"z-weak",prerequisites:["y-prerequisite"]}];
 const results=assessSkills(graph,[{itemId:"one",skillId:"z-weak",mode:"production",contextId:"one",correct:false,guessProbability:.5,activeSeconds:20}]);
 expect(buildGranularPriorities(graph,results,2).map(p=>p.skillId)).toEqual(["y-prerequisite","z-weak"]);
 const empty=assessSkills(graph,[]);empty[2].modes[0].probability=.1;
 expect(buildGranularPriorities(graph,empty,1)[0].skillId).toBe("a-unseen");
});
