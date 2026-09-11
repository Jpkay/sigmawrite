import {expect,it} from "vitest";
import {runAssessmentCommand,publicAssessmentView,type AssessmentBundle,type AssessmentStore,type StoredSession} from "./service";
import {createSession,transitionSession} from "./session";
import {bindAssessmentRelease} from "./release-binding";
import {readFileSync} from "node:fs";
import {adaptV3ForAssessment} from "./v3-adapter";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const bank=read("generated/diagnostic-bank-v3-draft.json"),assessment=adaptV3ForAssessment({artifact:read("generated/french-taxonomy-v3.json"),bank});
const bundle:AssessmentBundle={bank,assessment,taxonomyId:"taxonomy-id",bankId:"bank-id"};
const id="11111111-1111-4111-8111-111111111111";
function setup(){
 let stored:StoredSession={id,studentId:"student-a",releaseId:"release-a",state:createSession(bindAssessmentRelease(assessment,bundle))};
 const store:AssessmentStore={
  load:async(studentId,sessionId)=>studentId===stored.studentId&&sessionId===id?structuredClone(stored):null,
  release:async()=>bundle,
  save:async(studentId,sessionId,revision,state)=>{if(studentId!==stored.studentId||sessionId!==id||revision!==stored.state.revision)return false;stored={...stored,state};return true;},
 };
 return {store,get:()=>stored};
}
it("rejects cross-student access and browser-authored grades",async()=>{
 const {store}=setup();
 expect(await runAssessmentCommand(store,"student-b",{type:"resume",sessionId:id,revision:0})).toMatchObject({error:"Diagnostic introuvable."});
 expect(await runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0,correct:true})).toMatchObject({error:"Données invalides."});
});
it("does not expose correct choices, validators or answer keys",async()=>{
 const {store,get}=setup();await runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0},()=>0);
 const view=publicAssessmentView(get(),bundle);
 expect(view.question).not.toBeNull();
 const serialized=JSON.stringify(view);
 for(const field of ['"correctAnswer"','"validatorConfig"','"correct"','"acceptableAnswers"'])expect(serialized).not.toContain(field);
});
it("only one concurrent revision can commit and stale requests cannot add evidence",async()=>{
 const {store,get}=setup();
 const results=await Promise.all([1,2].map(()=>runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0},()=>0)));
 expect(results.filter(r=>"conflict" in r)).toHaveLength(1);expect(get().state.revision).toBe(1);
 const stale=await runAssessmentCommand(store,"student-a",{type:"pause",sessionId:id,revision:0},()=>1000);
 expect(stale).toHaveProperty("conflict",true);expect(get().state.revision).toBe(1);
});
it("grades the served answer on the server and cannot accept it twice",async()=>{
 const {store,get}=setup();await runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0},()=>0);
 const itemId=get().state.pendingItemId!,entry=bank.items.find((i:{itemKey:string})=>i.itemKey===itemId)!;
 const answer=entry.item.responseType==="mcq"?publicAssessmentView(get(),bundle).question!.choices.find(c=>c.text===entry.item.choices.find((c:{correct:boolean})=>c.correct).text)!.id:entry.item.correctAnswer;
 const command={type:"answer",sessionId:id,revision:1,itemId,answer};
 const result=await runAssessmentCommand(store,"student-a",command,()=>5000);
 expect(result).not.toHaveProperty("error");expect(get().state.observations).toHaveLength(1);expect(get().state.observations[0].correct).toBe(true);
 expect(get().state.diagnosticResponses).toEqual([{itemId,answer}]);
 expect(result).not.toHaveProperty("view.diagnosticResponses");
 await runAssessmentCommand(store,"student-a",command,()=>6000);
 expect(get().state.observations).toHaveLength(1);expect(get().state.activeSeconds).toBe(5);
 expect(get().state.diagnosticResponses).toEqual([{itemId,answer}]);
});
it("retains an incorrect written answer rather than replacing it with the answer key",async()=>{
 const {store,get}=setup();await runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0},()=>0);
 const probe=assessment.probes.find(probe=>{
  const item=bank.items.find((entry:{itemKey:string})=>entry.itemKey===probe.id)?.item;
  return item?.responseType!=="mcq"&&item?.validatorType==="exact";
 });
 expect(probe).toBeDefined();get().state.pendingItemId=probe!.id;
 const answer="ma réponse erronée";
 const response=await runAssessmentCommand(store,"student-a",{type:"answer",sessionId:id,revision:1,itemId:probe!.id,answer},()=>5000);
 expect(response).not.toHaveProperty("error");
 expect(get().state.observations[0].correct).toBe(false);
 expect(get().state.diagnosticResponses).toEqual([{itemId:probe!.id,answer}]);
});
it("does not invent response records for historical answers or skipped questions",async()=>{
 const {store,get}=setup();await runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0},()=>0);
 await runAssessmentCommand(store,"student-a",{type:"skip",sessionId:id,revision:1,itemId:get().state.pendingItemId!},()=>5000);
 expect(get().state.observations[0].skipped).toBe(true);
 expect(get().state.diagnosticResponses).toBeUndefined();
});
it("uses received time rather than inventing client timestamps",async()=>{
 const {store,get}=setup();await runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0},()=>0);
 expect(await runAssessmentCommand(store,"student-a",{type:"pulse",sessionId:id,revision:1,at:1e10},()=>1000)).toHaveProperty("error");
 expect(get().state.activeSeconds).toBe(0);
});
it("excludes blocking server work while continuing to count background heartbeat time",async()=>{
 const {store,get}=setup();
 // Authentication and release loading take eight seconds before resume is saved.
 await runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0},()=>8000,0);
 expect(get().state.lastPulseAt).toBe(8000);
 expect(get().state.activeSeconds).toBe(0);
 // The learner reads for ten seconds, then answer processing takes twelve.
 const itemId=get().state.pendingItemId!,entry=bank.items.find((i:{itemKey:string})=>i.itemKey===itemId)!;
 const answer=entry.item.responseType==="mcq"?publicAssessmentView(get(),bundle).question!.choices.find(c=>c.text===entry.item.choices.find((c:{correct:boolean})=>c.correct).text)!.id:entry.item.correctAnswer;
 await runAssessmentCommand(store,"student-a",{type:"answer",sessionId:id,revision:1,itemId,answer},()=>30000,18000);
 expect(get().state.observations[0].activeSeconds).toBe(10);
 expect(get().state.lastPulseAt).toBe(30000);
 await runAssessmentCommand(store,"student-a",{type:"pulse",sessionId:id,revision:2},()=>47000,40000);
 expect(get().state.activeSeconds).toBe(20);
 expect(get().state.lastPulseAt).toBe(40000);
 await runAssessmentCommand(store,"student-a",{type:"pulse",sessionId:id,revision:3},()=>50000,50000);
 expect(get().state.activeSeconds).toBe(30);
});
it("excludes skip processing and still leaves a paused clock stopped",async()=>{
 const {store,get}=setup();
 await runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0},()=>1000,0);
 await runAssessmentCommand(store,"student-a",{type:"skip",sessionId:id,revision:1,itemId:get().state.pendingItemId!},()=>12000,6000);
 expect(get().state.activeSeconds).toBe(5);expect(get().state.lastPulseAt).toBe(12000);
 await runAssessmentCommand(store,"student-a",{type:"pause",sessionId:id,revision:2},()=>30000,15000);
 expect(get().state.activeSeconds).toBe(8);expect(get().state.lastPulseAt).toBeNull();
});
it("rejects a changed pinned release before accepting an event",()=>{
 const {get}=setup();
 expect(()=>transitionSession({state:get().state,release:{...get().state.release,checksum:"changed"},expectedRevision:0,event:{type:"resume",at:0},skills:assessment.skills,bank:assessment.probes})).toThrow(/release changed/);
});
it("accepts an unanswered skip once, without grading it or accepting answer payloads",async()=>{
 const {store,get}=setup();await runAssessmentCommand(store,"student-a",{type:"resume",sessionId:id,revision:0},()=>0);
 const itemId=get().state.pendingItemId!,command={type:"skip",sessionId:id,revision:1,itemId};
 for(const extra of [{answer:"invented"},{correct:false},{supportChoiceId:id},{skipped:true}])expect(await runAssessmentCommand(store,"student-a",{...command,...extra},()=>1000)).toHaveProperty("error");
 expect(await runAssessmentCommand(store,"student-b",command,()=>1000)).toHaveProperty("error");
 const responses=await Promise.all([1,2].map(()=>runAssessmentCommand(store,"student-a",command,()=>1000)));
 expect(responses.filter(r=>"conflict" in r)).toHaveLength(1);
 expect(get().state.observations).toHaveLength(1);
 const view=publicAssessmentView(get(),bundle);
 expect(view).toMatchObject({answeredCount:0,skippedCount:1});
 expect(view.results.every(result=>result.status==="unknown")).toBe(true);
 expect(view.question?.id).not.toBe(itemId);
});

it("exposes an ongoing content-review notice without leaking the permission manifest or changing student evidence",()=>{
 const {get}=setup(),session=get();
 const standard=publicAssessmentView(session,bundle);
 expect(standard.contentReviewStatus).toBeUndefined();
 const parallel=structuredClone(bundle);
 parallel.assessment.reviewPolicy={mode:"parallel_review",authorization:"product-owner-request-2026-09-11",reviewOwner:"product_owner",bankChecksum:assessment.bankChecksum,questionChecksums:{}};
 const view=publicAssessmentView(session,parallel);
 expect(view.contentReviewStatus).toBe("ongoing");
 expect(view.results).toEqual(standard.results);
 expect(view.provisional).toBe(standard.provisional);
 const serialized=JSON.stringify(view);
 for(const key of ["questionChecksums","teachingChecksums","reviewOwner","reviewPolicy"])expect(serialized).not.toContain(key);
});

it("distinguishes release availability from skills actually assessed",()=>{
 const {get}=setup(),session=get();
 const standard=publicAssessmentView(session,bundle);
 const target=assessment.skills.find(skill=>!skill.prerequisites.length)!;
 const scoped=structuredClone(bundle);
 scoped.assessment.releaseScope={version:"french-granular-release-scope-v1",assessmentSkillIds:[target.id],teachingSkillIds:[],limitationFr:"Couverture progressive."};
 const view=publicAssessmentView(session,scoped);
 expect(view.coverage).toMatchObject({supportedSkillCount:1,deferredSkillCount:assessment.skills.length-1,teachingSkillCount:0});
 expect(view.skillDetails[target.id].assessmentAvailable).toBe(true);
 expect(Object.values(view.skillDetails).filter(detail=>detail.assessmentAvailable===false)).toHaveLength(assessment.skills.length-1);
 expect(view.results).toEqual(standard.results);
 expect(view.results.every(result=>result.status==="unknown")).toBe(true);
 expect(standard.coverage).toBeUndefined();
 expect(Object.values(standard.skillDetails).every(detail=>detail.assessmentAvailable===undefined)).toBe(true);
});
