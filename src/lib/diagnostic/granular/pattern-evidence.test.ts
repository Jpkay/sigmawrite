import {expect,it} from "vitest";
import {assessSkills,selectProbe,type Skill,type Observation,type Probe} from "./engine";
import {patternFeatureRequirements,conjugationEvidenceFeatures} from "./facets";
import {createSession,transitionSession} from "./session";
const feature="spelling-adjustment";
const skill:Skill={id:"ger-present",branch:"ger",level:0,modes:["production"],prerequisites:[],evidenceRequirements:{production:{minimumItems:3,minimumContexts:2,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true,featureRequirements:[{feature,minimumItems:3,minimumContexts:2}]}}};
const observations=(count:number,tagged:boolean,correct=true,context?:string,prefix="answer"):Observation[]=>Array.from({length:count},(_,index)=>({itemId:`${prefix}-${index}`,skillId:skill.id,mode:"production",contextId:context??`verb-${index%2}`,correct,guessProbability:.05,activeSeconds:10,unaided:true,evidenceFeatures:tagged?[feature]:[]}));
it("cannot certify the spelling pattern from many unchanged endings or a single memorized verb",()=>{
 expect(assessSkills([skill],observations(8,false))[0]).toMatchObject({status:"uncertain",resolved:false});
 expect(assessSkills([skill],observations(6,true,true,"manger"))[0].resolved).toBe(false);
 expect(assessSkills([skill],observations(3,true))[0].status).toBe("mastered");
 expect(assessSkills([skill],observations(3,false,false))[0].status).toBe("uncertain");
 expect(assessSkills([skill],observations(3,true,false))[0].status).toBe("missing");
});
it("rechecks the feature after a contradiction instead of hiding it behind easy correct answers",()=>{
 const evidence=[...observations(3,true),...observations(1,true,false,undefined,"error"),...observations(6,false,true,undefined,"easy")];
 expect(assessSkills([skill],evidence)[0].status).toBe("uncertain");
 expect(assessSkills([skill],[...evidence,...observations(3,true,true,undefined,"recovery")])[0].status).toBe("mastered");
});
it("prioritizes a probe of the missing feature when confirming a target",()=>{
 const make=(id:string,features:string[],difficulty:number):Probe=>({id,skillId:skill.id,mode:"production",contextId:id,difficulty,expectedSeconds:15,guessProbability:.05,evidenceFeatures:features});
 const selection=selectProbe([skill],[make("a-easy",[],.5),make("z-distinguishing",[feature],.8)],observations(3,false));
 expect(selection).toMatchObject({kind:"question",item:{id:"z-distinguishing"}});
});
it("tags only person/tense combinations that elicit ge or ç adjustments",()=>{
 expect(conjugationEvidenceFeatures("produire_present_indicatif",{verb:"manger",tense:"present",person:"1p"})).toEqual([feature]);
 expect(conjugationEvidenceFeatures("produire_present_indicatif",{verb:"manger",tense:"present",person:"3s"})).toEqual([]);
 expect(conjugationEvidenceFeatures("produire_imparfait",{verb:"commencer",tense:"imparfait",person:"1p"})).toEqual([]);
 expect(conjugationEvidenceFeatures("produire_imparfait",{verb:"commencer",tense:"imparfait",person:"3p"})).toEqual([feature]);
 expect(conjugationEvidenceFeatures("produire_passe_simple",{verb:"manger",tense:"passe_simple",person:"3p"})).toEqual([]);
 expect(patternFeatureRequirements({key:"unused",nodeKey:"produire_futur_simple",dimension:"pattern",value:"spelling_ger",labelFr:"test"})).toEqual([]);
});
it("persists the server-owned feature with a graded independent check",()=>{
 const release={taxonomyId:"taxonomy",bankId:"bank",checksum:"checksum"};
 const bank:Probe[]=[{id:"check-item",skillId:skill.id,mode:"production",contextId:"manger",difficulty:.5,expectedSeconds:15,guessProbability:.05,evidenceFeatures:[feature]}];
 const state={...createSession(release),phase:"learning" as const,completionReason:"time_budget" as const};
 const issued=transitionSession({state,release,expectedRevision:0,event:{type:"issue_check",check:{id:"check",activityId:"activity",itemId:"check-item",occasionId:"day"}},skills:[skill],bank});
 const answered=transitionSession({state:issued,release,expectedRevision:1,event:{type:"answer_check",checkId:"check",correct:true},skills:[skill],bank});
 expect(answered.refinements[0].evidenceFeatures).toEqual([feature]);
 bank[0].evidenceFeatures!.push("tampered-after-saving");
 expect(answered.refinements[0].evidenceFeatures).toEqual([feature]);
});
