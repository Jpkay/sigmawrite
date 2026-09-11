import {expect,it} from "vitest";
import {writtenGuessingFloor} from "./response-space";
import {assessSkills,type Skill,type Observation} from "./engine";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
const item:CanonicalDiagnosticBankItem["item"]={nodeKey:"spelling",strand:"orthographe_lexicale",modality:"writing",learnerMode:"shared",responseType:"cloze",promptFr:"Complète : e___ballage",correctAnswer:"emballage",acceptableAnswers:[],validatorType:"exact",difficulty:50,
 validatorConfig:{finiteResponseSpace:{alternatives:["emballage","enballage"],rationaleFr:"Le choix oppose m et n."}}};
it("does not treat three successful binary typed answers as open-answer mastery",()=>{
 const guess=writtenGuessingFloor(item);expect(guess).toBe(.5);
 const skill:Skill={id:"skill",branch:"spelling",level:0,prerequisites:[],modes:["production"],evidenceRequirements:{production:{minimumItems:3,minimumContexts:2,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true}}};
 const observations:Observation[]=Array.from({length:7},(_,index)=>({itemId:`q-${index}`,skillId:skill.id,mode:"production",correct:true,contextId:`context-${index}`,occasionId:"day",unaided:true,guessProbability:guess,activeSeconds:30}));
 expect(assessSkills([skill],observations.slice(0,3))[0].resolved).toBe(false);
 expect(assessSkills([skill],observations)[0].status).toBe("mastered");
});
it("rejects ambiguous or inconsistent response-space annotations",()=>{
 for(const alternatives of [["emballage"],["emballage"," EMBALLAGE "],["emballage",""],["autre","enballage"],Array.from({length:21},(_,index)=>`word${index}`)]){
  expect(()=>writtenGuessingFloor({...item,validatorConfig:{finiteResponseSpace:{alternatives,rationaleFr:"Test"}}})).toThrow();
 }
 expect(()=>writtenGuessingFloor({...item,acceptableAnswers:["autre"]})).toThrow();
 expect(()=>writtenGuessingFloor({...item,responseType:"mcq"})).toThrow();
});
it("never lowers the legacy written-answer guessing floor",()=>{
 expect(writtenGuessingFloor({...item,validatorConfig:{}})).toBe(.05);
 const alternatives=["emballage",...Array.from({length:19},(_,index)=>`alternative${index}`)];
 expect(writtenGuessingFloor({...item,validatorConfig:{finiteResponseSpace:{alternatives,rationaleFr:"Test"}}})).toBe(.05);
});

it("counts all accepted variants without counting duplicate aliases twice",()=>{
 const alternatives=["emballage","emballage.","enballage","enballage."];
 const variant={...item,acceptableAnswers:["emballage."," EMBALLAGE "],validatorConfig:{finiteResponseSpace:{alternatives,rationaleFr:"Deux graphies, chacune avec ou sans point."}}};
 expect(writtenGuessingFloor(variant)).toBe(.5);
});
