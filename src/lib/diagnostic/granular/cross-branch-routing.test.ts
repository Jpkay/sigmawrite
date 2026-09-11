import {expect,it} from "vitest";
import {selectProbe,assessSkills,type Skill,type Probe,type Observation} from "./engine";
const skills:Skill[]=[
 {id:"advanced",branch:"a-interpretation",domain:"reading",samplingGroup:"reading",level:2,modes:["interpretation"],prerequisites:["foundation"]},
 {id:"foundation",branch:"z-explicit",domain:"reading",samplingGroup:"reading",level:0,modes:["interpretation"],prerequisites:[]},
];
const probes:Probe[]=skills.flatMap(skill=>Array.from({length:6},(_,i)=>({id:`${skill.id}-${i}`,skillId:skill.id,mode:"interpretation",contextId:`context-${i}`,difficulty:.5,guessProbability:.25,expectedSeconds:30})));
const wrong:Observation={itemId:"advanced-0",skillId:"advanced",mode:"interpretation",contextId:"context-0",correct:false,guessProbability:.25,activeSeconds:30};
it("follows an available approved prerequisite in another branch after a wrong answer",()=>{
 expect(selectProbe(skills,probes,[wrong])).toMatchObject({kind:"question",reason:"step_down",item:{skillId:"foundation"}});
 expect(assessSkills(skills,[wrong]).find(result=>result.skillId==="foundation")?.status).toBe("unknown");
});
it("preserves reserved questions and domain time balance when following prerequisites",()=>{
 const reserved=probes.map(probe=>probe.skillId==="foundation"?{...probe,usage:"learning" as const}:probe);
 expect(selectProbe(skills,reserved,[wrong])).toMatchObject({kind:"question",item:{skillId:"advanced"}});
 const grammar:Skill={id:"grammar",branch:"grammar",domain:"grammar",level:0,modes:["production"],prerequisites:[]};
 const grammarProbe:Probe={...probes[0],id:"grammar-0",skillId:"grammar",mode:"production"};
 expect(selectProbe([...skills,grammar],[...probes,grammarProbe],[wrong])).toMatchObject({kind:"question",item:{skillId:"grammar"}});
});
