import {readFileSync} from "node:fs";
import {expect,it,vi} from "vitest";
import * as answerValidator from "@/lib/linguistic/validator";
import {adaptV3ForAssessment} from "./v3-adapter";
import {bindAssessmentRelease} from "./release-binding";
import {createSession} from "./session";
import {publicAssessmentView,type AssessmentBundle,type AssessmentStore,type StoredSession} from "./service";
import {runLearningCheckCommand} from "./learning-service";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const bank=read("generated/diagnostic-bank-v3-draft.json"),full=adaptV3ForAssessment({bank,artifact:read("generated/french-taxonomy-v3.json")});
const skill=full.skills.find(s=>s.nodeKey==="produire_present_indicatif")!;
const assessment={...full,skills:[{...skill,prerequisites:[]}],probes:full.probes.filter(p=>p.skillId===skill.id)};
const id="11111111-1111-4111-8111-111111111111";
function setup(categorized=false){
 const configured=structuredClone(assessment);
 if(categorized)configured.probes.sort((a,b)=>a.id.localeCompare(b.id)).forEach((probe,index)=>{probe.samplingCategory=index<2?"repeated":"unseen";});
 const bundle:AssessmentBundle={assessment:configured,bank,taxonomyId:"taxonomy",bankId:"bank",activities:[{id:"check-present",nodeKey:skill.nodeKey,mode:skill.modes[0],kind:"independent_check",status:"published",titleFr:"Vérifier le présent",href:"/student/learning-check",probeIds:assessment.probes.map(p=>p.id)}]};
 let stored:StoredSession={id,studentId:"student-a",releaseId:"release",state:{...createSession(bindAssessmentRelease(configured,bundle)),phase:"learning",completionReason:"time_budget"}};
 const store:AssessmentStore={load:async(student,session)=>student===stored.studentId&&session===id?structuredClone(stored):null,release:async()=>bundle,
 save:async(student,session,revision,state)=>{if(student!==stored.studentId||session!==id||revision!==stored.state.revision)return false;stored={...stored,state};return true;}};
 const send=(command:Record<string,unknown>)=>runLearningCheckCommand(store,"student-a",{sessionId:id,revision:stored.state.revision,...command},()=>Date.UTC(2026,8,10,12));
 const answer=()=>bank.items.find((entry:{itemKey:string})=>entry.itemKey===stored.state.learningCheck!.itemId).item.correctAnswer;
 return {bundle,store,get:()=>stored,send,answer};
}
it("issues, reloads and grades a fresh check into the saved skill map",async()=>{
 const f=setup();
 const started=await f.send({type:"start_check",activityId:"check-present"});
 expect(started).not.toHaveProperty("error");
 const check=f.get().state.learningCheck!;
 expect(publicAssessmentView(f.get(),f.bundle).learningCheck?.id).toBe(check.id);
 const serialized=JSON.stringify(publicAssessmentView(f.get(),f.bundle).learningCheck);
 for(const field of ['"correct"','"correctAnswer"','"validatorConfig"'])expect(serialized).not.toContain(field);
 await f.send({type:"answer_check",checkId:check.id,answer:f.answer()});
 expect(f.get().state.refinements).toHaveLength(1);
 expect(f.get().state.refinements[0]).toMatchObject({correct:true,unaided:true,occasionId:"learning-day:2026-09-10",skillId:skill.id});
 expect(f.get().state.learningCheck).toBeNull();
 expect(publicAssessmentView(f.get(),f.bundle).results[0].status).not.toBe("unknown");
});
it("cannot count concurrent or repeated submissions as additional evidence",async()=>{
 const f=setup();await f.send({type:"start_check",activityId:"check-present"});
 const command={type:"answer_check",sessionId:id,revision:f.get().state.revision,checkId:f.get().state.learningCheck!.id,answer:f.answer()};
 const results=await Promise.all([1,2].map(()=>runLearningCheckCommand(f.store,"student-a",command)));
 expect(results.filter(r=>"conflict" in r)).toHaveLength(1);
 expect(f.get().state.refinements).toHaveLength(1);
 expect(await f.send({...command,revision:f.get().state.revision})).toHaveProperty("error");
 expect(f.get().state.refinements).toHaveLength(1);
});
it("retains one active check and excludes abandoned questions from later evidence",async()=>{
 const f=setup();await f.send({type:"start_check",activityId:"check-present"});
 const first=f.get().state.learningCheck!,revision=f.get().state.revision;
 await f.send({type:"start_check",activityId:"check-present"});
 expect(f.get().state.revision).toBe(revision);
 await f.send({type:"abandon_check",checkId:first.id});
 expect(f.get().state.refinements).toHaveLength(0);
 await f.send({type:"start_check",activityId:"check-present"});
 expect(f.get().state.learningCheck!.itemId).not.toBe(first.itemId);
 expect(f.get().state.exposedLearningItemIds).toContain(first.itemId);
});
it("rejects client grades, client occasions, cross-student access and unplanned bindings",async()=>{
 const f=setup(),command={type:"start_check",sessionId:id,revision:0,activityId:"check-present"};
 expect(await runLearningCheckCommand(f.store,"student-b",command)).toHaveProperty("error");
 for(const extra of [{correct:true},{occasionId:"new"},{firstAttempt:true},{itemId:assessment.probes[0].id}])expect(await f.send({...command,...extra})).toHaveProperty("error");
 f.bundle.activities![0].status="draft";
 expect(await f.send(command)).toHaveProperty("error");
 expect(f.get().state.revision).toBe(0);
});
it("does not offer a check without unseen questions at the exact skill and mode",async()=>{
 const f=setup();
 f.bundle.activities![0].probeIds=full.probes.filter(p=>p.skillId!==skill.id).map(p=>p.id);
 expect(publicAssessmentView(f.get(),f.bundle).learningActivities).toEqual([]);
 expect(await f.send({type:"start_check",activityId:"check-present"})).toHaveProperty("error");
});
it("does not inflate independent occasions when multiple checks happen on the same day",async()=>{
 const f=setup();
 for(let i=0;i<2;i++){
  await f.send({type:"start_check",activityId:"check-present"});
  const check=f.get().state.learningCheck!;
  await f.send({type:"answer_check",checkId:check.id,answer:f.answer()});
 }
 expect(f.get().state.refinements).toHaveLength(2);
 expect(new Set(f.get().state.refinements.map(o=>o.itemId)).size).toBe(2);
 expect(new Set(f.get().state.refinements.map(o=>o.occasionId)).size).toBe(1);
});

it("varies follow-up categories after an abandoned check without recording an answer",async()=>{
 const f=setup(true);
 expect(f.bundle.assessment.probes.length).toBeGreaterThanOrEqual(3);
 await f.send({type:"start_check",activityId:"check-present"});
 const first=f.get().state.learningCheck!;
 expect(f.bundle.assessment.probes.find(probe=>probe.id===first.itemId)?.samplingCategory).toBe("repeated");
 await f.send({type:"abandon_check",checkId:first.id});
 expect(f.get().state.refinements).toEqual([]);
 const next=await f.send({type:"start_check",activityId:"check-present"});
 expect(next).not.toHaveProperty("error");
 expect(f.bundle.assessment.probes.find(probe=>probe.id===f.get().state.learningCheck!.itemId)?.samplingCategory).toBe("unseen");
 expect(f.get().state.refinements).toEqual([]);
});

it("passes the pinned question context to the shared answer validator",async()=>{
 const spy=vi.spyOn(answerValidator,"validateAnswer");
 try {
  const f=setup();await f.send({type:"start_check",activityId:"check-present"});
  const check=f.get().state.learningCheck!;
  const item=f.bundle.bank.items.find(entry=>entry.itemKey===check.itemId)!.item;
  const answer=f.answer();
  await f.send({type:"answer_check",checkId:check.id,answer:f.answer()});
  expect(spy).toHaveBeenCalledWith(answer,expect.objectContaining({assessment:{nodeKey:item.nodeKey,promptFr:item.promptFr,instructionsFr:item.instructionsFr,modality:item.modality,responseType:item.responseType}}));
 } finally {spy.mockRestore();}
});
