import {readFileSync} from "node:fs";
import {expect,it,vi} from "vitest";
import {assessSkills,type Skill,type Observation} from "./engine";
import {materialIdentity} from "./material-identity";
import {hasVerifiedNovelMaterial,type ObservedMaterialReceipt} from "./material-receipt";
import {createSession} from "./session";
import {bindAssessmentRelease} from "./release-binding";
import {runAssessmentCommand,type AssessmentBundle,type AssessmentStore,type StoredSession} from "./service";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
const word=materialIdentity("word","être");
const receipt:ObservedMaterialReceipt={presentationId:"presentation",sourceChecksum:"source",firstRecordedKeys:[word],previouslySeenKeys:[],historyComplete:true};
const skill:Skill={id:"skill",branch:"spelling",level:0,prerequisites:[],modes:["production"],evidenceRequirements:{production:{minimumItems:3,minimumContexts:2,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true,novelWordsRequired:true}}};
const observations:Observation[]=Array.from({length:3},(_,i)=>({itemId:`q${i}`,skillId:skill.id,mode:"production",contextId:`context${i}`,correct:true,guessProbability:.05,activeSeconds:10,unaided:true,materialReceipt:{...receipt,presentationId:`presentation-${i}`,firstRecordedKeys:[materialIdentity("word",["chat","chien","cheval"][i])]}}));
it("does not equate first recorded exposure with verified novelty",()=>{
 expect(assessSkills([skill],observations)[0].status).toBe("mastered");
 for(const materialReceipt of [undefined,{...receipt,historyComplete:false},{...receipt,firstRecordedKeys:[],previouslySeenKeys:[word]}]){
  expect(assessSkills([skill],observations.map(o=>({...o,materialReceipt})))[0].status).toBe("unknown");
 }
});
it("requires the correct material kind and can recover with enough fresh independent evidence",()=>{
 const sentenceOnly={...receipt,firstRecordedKeys:[materialIdentity("sentence","Il arrive.")]};
 expect(assessSkills([skill],observations.map(o=>({...o,materialReceipt:sentenceOnly})))[0].resolved).toBe(false);
 const repeated=observations.map(o=>({...o,itemId:`old-${o.itemId}`,materialReceipt:{...receipt,firstRecordedKeys:[],previouslySeenKeys:[word]}}));
 expect(assessSkills([skill],[...repeated,...observations])[0].status).toBe("mastered");
});
function fixture(){
 const bank=JSON.parse(readFileSync("generated/diagnostic-bank-v3-draft.json","utf8")) as CanonicalDiagnosticBankArtifact;
 const entry=bank.items.find(e=>e.item.validatorType==="conjugator"&&e.item.responseType!=="mcq"&&Boolean(e.item.correctAnswer))!;
 entry.item.validatorConfig={...entry.item.validatorConfig,materialExposure:{words:[{lemma:"être",form:entry.item.correctAnswer!}]}};
 const bundle:AssessmentBundle={bank,taxonomyId:"taxonomy",bankId:"bank",assessment:{taxonomyChecksum:"test",bankChecksum:"test",skills:[{...skill,nodeKey:entry.item.nodeKey,evidenceKey:entry.evidenceKey,labelFr:"Fixture"}],probes:[{id:entry.itemKey,skillId:skill.id,mode:"production",contextId:"fixture",difficulty:.5,expectedSeconds:20,guessProbability:.05}]}};
 const id="11111111-1111-4111-8111-111111111111";
 let stored:StoredSession={id,studentId:"student-a",releaseId:"release",state:createSession(bindAssessmentRelease(bundle.assessment,bundle))};
 const loadReceipt=vi.fn(async()=>({firstRecordedKeys:[word],previouslySeenKeys:[]}));
 const store:AssessmentStore={load:async(student,session)=>student===stored.studentId&&session===id?structuredClone(stored):null,release:async()=>bundle,
  loadMaterialReceipt:loadReceipt,save:async(student,session,revision,state)=>{if(student!==stored.studentId||session!==id||revision!==stored.state.revision)return false;stored={...stored,state};return true;}};
 return {store,loadReceipt,get:()=>stored,command:{type:"answer",sessionId:id,revision:1,itemId:entry.itemKey,answer:entry.item.correctAnswer!}};
}
it("persists server-read receipt provenance, keeps unknown history unverified and rejects browser claims",async()=>{
 const f=fixture();await runAssessmentCommand(f.store,"student-a",{type:"resume",sessionId:f.get().id,revision:0},()=>0);
 expect(await runAssessmentCommand(f.store,"student-a",{...f.command,materialReceipt:receipt},()=>1000)).toHaveProperty("error");
 await runAssessmentCommand(f.store,"student-a",f.command,()=>1000);
 expect(f.loadReceipt).toHaveBeenCalledTimes(1);
 expect(f.get().state.observations[0].materialReceipt).toMatchObject({firstRecordedKeys:[word],historyComplete:false});
 expect(f.get().state.observations[0].materialReceipt?.presentationId).toMatch(/^[a-f0-9-]{36}$/);
});
it("does not save an answer when receipt retrieval fails",async()=>{
 const f=fixture();await runAssessmentCommand(f.store,"student-a",{type:"resume",sessionId:f.get().id,revision:0},()=>0);
 f.loadReceipt.mockRejectedValueOnce(new Error("receipt unavailable"));
 await expect(runAssessmentCommand(f.store,"student-a",f.command,()=>1000)).rejects.toThrow("receipt unavailable");
 expect(f.get().state.observations).toHaveLength(0);
 expect(f.get().state.revision).toBe(1);
});

it("requires freshness of the assessed target while retaining exposure to familiar context",()=>{
 const context=materialIdentity("word","voir");
 const mixed={...receipt,previouslySeenKeys:[context],assessedMaterialKeys:[word]};
 expect(hasVerifiedNovelMaterial(mixed,"word")).toBe(true);
 expect(hasVerifiedNovelMaterial({...mixed,assessedMaterialKeys:undefined},"word")).toBe(false);
 expect(hasVerifiedNovelMaterial({...mixed,assessedMaterialKeys:[]},"word")).toBe(false);
 expect(hasVerifiedNovelMaterial({...mixed,assessedMaterialKeys:[context]},"word")).toBe(false);
});
