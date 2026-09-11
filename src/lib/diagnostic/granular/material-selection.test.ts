import {expect,it} from "vitest";
import {knownExposedMaterialKeys,probeRepeatsKnownTarget,selectProbe,type Probe,type Skill,type Observation} from "./engine";
import {materialIdentity} from "./material-identity";
const old=materialIdentity("word","cheval"),fresh=materialIdentity("word","chat"),context=materialIdentity("word","voir");
const skill:Skill={id:"skill",branch:"spelling",level:0,prerequisites:[],modes:["production"],evidenceRequirements:{production:{minimumItems:3,minimumContexts:2,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true,novelWordsRequired:true}}};
const probe=(id:string,key:string):Probe=>({id,skillId:skill.id,mode:"production",contextId:id,difficulty:.5,expectedSeconds:20,guessProbability:.05,materialKeys:[key,context],assessedMaterialKeys:[key]});
const answer:Observation={itemId:"answered",skillId:skill.id,mode:"production",contextId:"first",correct:true,guessProbability:.05,activeSeconds:20};
it("skips a known target under a different question identity, while allowing familiar context",()=>{
 const bank=[probe("answered",old),probe("a-repeated",old),probe("b-fresh",fresh)];
 expect(selectProbe([skill],bank,[answer])).toMatchObject({kind:"question",item:{id:"b-fresh"}});
 expect(probeRepeatsKnownTarget(bank[2],skill,new Set([context]))).toBe(false);
});
it("uses lesson, abandoned-check and receipt exposures without requiring complete history",()=>{
 const bank=[probe("abandoned",old)];
 const receiptAnswer={...answer,materialReceipt:{presentationId:"previous",sourceChecksum:"source",historyComplete:false,firstRecordedKeys:[fresh],previouslySeenKeys:[context]}};
 const known=knownExposedMaterialKeys(bank,[receiptAnswer],["abandoned"],[materialIdentity("sentence","Le chat dort.")]);
 expect(known).toEqual(new Set([old,fresh,context,materialIdentity("sentence","Le chat dort.")]));
 expect(selectProbe([skill],[probe("a-repeated",old),probe("b-fresh",fresh)],[],undefined,[old])).toMatchObject({kind:"question",item:{id:"b-fresh"}});
});
it("does not filter familiar material where the approved rule does not require novelty",()=>{
 const ordinary={...skill,evidenceRequirements:{production:{...skill.evidenceRequirements!.production!,novelWordsRequired:false}}};
 expect(probeRepeatsKnownTarget(probe("repeat",old),ordinary,new Set([old]))).toBe(false);
});
it("does not promise later evidence from an already-exposed reserve",()=>{
 const bank=[probe("answered",old),{...probe("reserve",old),usage:"learning" as const}];
 expect(selectProbe([skill],bank,[answer])).toMatchObject({kind:"coverage_gap"});
 bank[1]={...probe("reserve",fresh),usage:"learning"};
 expect(selectProbe([skill],bank,[answer])).toMatchObject({kind:"provisional",reason:"later_evidence_required"});
});
