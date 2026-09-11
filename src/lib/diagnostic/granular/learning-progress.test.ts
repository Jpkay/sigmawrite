import {createSession,sessionView} from "./session";
import {expect,it} from "vitest";
import {assessSkills,type Skill,type Observation} from "./engine";
const skill:Skill={id:"accord",branch:"grammar",level:0,prerequisites:[],modes:["production"],evidenceRequirements:{production:{minimumItems:3,minimumContexts:2,minimumOccasions:2,minimumAccuracy:.8,unaidedRequired:true}}};
const batch=(count:number,correct:boolean,prefix:string):Observation[]=>Array.from({length:count},(_,i)=>({...(prefix!=="diagnostic"&&prefix!=="past"?{source:"learning" as const}:{}),itemId:`${prefix}-${i}`,skillId:skill.id,mode:"production",contextId:`${prefix}-context-${i}`,correct,guessProbability:.05,unaided:true,activeSeconds:20,occasionId:`learning-day:2026-09-${i%2?"12":"11"}`}));
it("recognizes independently demonstrated improvement without requiring repayment of every old error",()=>{
 const past=batch(12,false,"diagnostic"),current=batch(3,true,"learning"),history=[...past,...current],snapshot=structuredClone(history);
 expect(assessSkills([skill],past)[0].status).toBe("missing");
 expect(assessSkills([skill],history)[0]).toMatchObject({status:"mastered",resolved:true});
 expect(history).toEqual(snapshot);
});
it("requires fresh contexts and occasions instead of borrowing them from the old difficulty",()=>{
 const past=batch(12,false,"diagnostic");
 for(const current of [batch(2,true,"learning"),batch(3,true,"learning").map(o=>({...o,contextId:"same"})),batch(3,true,"learning").map(o=>({...o,occasionId:"learning-day:2026-09-12"})),batch(3,true,"learning").map(o=>({...o,unaided:false}))]){
  expect(assessSkills([skill],[...past,...current])[0].status).not.toBe("mastered");
 }
});
it("detects a newly demonstrated difficulty despite a long earlier success history",()=>{
 const past=batch(20,true,"past"),current=batch(3,false,"current");
 expect(assessSkills([skill],[...past,current[0]])[0].resolved).toBe(false);
 expect(assessSkills([skill],[...past,...current])[0]).toMatchObject({status:"missing",resolved:true});
});
it("requires the specific evidence features again when demonstrating improvement",()=>{
 const target:Skill={...skill,evidenceRequirements:{production:{...skill.evidenceRequirements!.production!,featureRequirements:[{feature:"plural",minimumItems:3,minimumContexts:2}]}}};
 const past=batch(12,false,"diagnostic").map(o=>({...o,evidenceFeatures:["plural"]})),current=batch(3,true,"learning");
 expect(assessSkills([target],[...past,...current])[0].resolved).toBe(false);
 expect(assessSkills([target],[...past,...current.map(o=>({...o,evidenceFeatures:["plural"]}))])[0].status).toBe("mastered");
});

it("keeps a return to success provisional until the new demonstration is sufficient",()=>{
 const past=batch(20,true,"past"),error=batch(1,false,"error"),current=batch(3,true,"current").map(o=>({...o,contextId:"same"}));
 expect(assessSkills([skill],[...past,...error,...current])[0]).toMatchObject({status:"uncertain",resolved:false});
});

it("reconstructs learning provenance from saved refinements without modifying historical answers",()=>{
 const state={...createSession({taxonomyId:"test",bankId:"test",checksum:"test"}),observations:batch(12,false,"diagnostic"),refinements:batch(3,true,"current").map(o=>({...o,source:undefined}))};
 const snapshot=structuredClone(state);
 expect(sessionView(state,[skill]).results[0]).toMatchObject({status:"mastered",resolved:true});
 expect(state).toEqual(snapshot);
});
it("keeps initial-test accumulation and cannot confirm mastery against recent failures",()=>{
 const past=batch(20,true,"past"),errors=batch(3,false,"current").map(o=>({...o,source:undefined}));
 expect(assessSkills([skill],[...past,...errors])[0].resolved).toBe(false);
 const improvement=batch(3,true,"current").map(o=>({...o,source:undefined}));
 expect(assessSkills([skill],[...batch(12,false,"diagnostic"),...improvement])[0].resolved).toBe(false);
});
