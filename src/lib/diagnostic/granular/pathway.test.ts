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
