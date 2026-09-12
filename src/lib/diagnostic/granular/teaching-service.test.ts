import {materialIdentity} from "./material-identity";
import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {PRONOUN_PLACEMENT_TEACHING} from "./pronoun-teaching";
import {teachingContentChecksum,type PublishedTeachingContent} from "./teaching-content";
import {adaptV3ForAssessment} from "./v3-adapter";
import {buildV3Facets} from "./facets";
import {applyFacetTargets} from "./facet-adapter";
import {createSession} from "./session";
import {bindAssessmentRelease} from "./release-binding";
import {runTeachingCommand,publicTeachingView} from "./teaching-service";
import {runLearningCheckCommand} from "./learning-service";
import {publicAssessmentView,type AssessmentBundle,type AssessmentStore,type StoredSession} from "./service";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const full=applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment;
const lessonDraft=PRONOUN_PLACEMENT_TEACHING[0];
const skill={...full.skills.find(s=>s.facetKey===lessonDraft.facetKey)!,prerequisites:[]};
const id="11111111-1111-4111-8111-111111111111";
function setup(withAudio=false){
  const assessment={...full,skills:[skill],probes:[{id:"overlapping-check",skillId:skill.id,mode:lessonDraft.mode,contextId:"story",difficulty:.5,expectedSeconds:30,guessProbability:.05,usage:"learning" as const}]};
  // Test-only publication fixture. This never writes a content approval artifact.
  const lesson:PublishedTeachingContent={...structuredClone(lessonDraft),status:"published",assessmentExposureIds:["overlapping-check"],materialExposure:{sentences:[lessonDraft.steps[0].exampleFr]},
    review:{reviewerId:"test-only-reviewer",reviewedAt:"2026-09-10T00:00:00Z",contentChecksum:"",exposureMappingReviewed:true}};
  if(withAudio){
    lesson.steps[0].audioStimulus={sha256:`sha256:${"a".repeat(64)}`,durationMs:1800,locale:"fr-FR",format:"mp3"};
    lesson.practice[0].audioStimulus={sha256:`sha256:${"b".repeat(64)}`,durationMs:1800,locale:"fr-FR",format:"mp3"};
  }
  lesson.review.contentChecksum=teachingContentChecksum(lesson);
  const bundle:AssessmentBundle={assessment,bank:structuredClone(bank),taxonomyId:"taxonomy",bankId:"bank",teachingContent:[lesson],activities:[{
    id:"placement-lesson",nodeKey:lesson.nodeKey,facetKey:lesson.facetKey,mode:lesson.mode,kind:"instruction",status:"published",titleFr:lesson.titleFr,href:"/student/diagnostic",contentId:lesson.id,
  }]};
  let stored:StoredSession={id,studentId:"student-a",releaseId:"release",state:{...createSession(bindAssessmentRelease(assessment,bundle)),phase:"learning",completionReason:"time_budget",
    observations:Array.from({length:4},(_,index)=>({itemId:`wrong-${index}`,skillId:skill.id,mode:lesson.mode,correct:false,contextId:`context-${index}`,occasionId:`occasion-${index}`,unaided:true,guessProbability:.05,activeSeconds:30}))}};
  const store:AssessmentStore={load:async(student,session)=>student===stored.studentId&&session===id?structuredClone(stored):null,release:async()=>bundle,
    save:async(student,session,revision,state)=>{if(student!==stored.studentId||session!==id||revision!==stored.state.revision)return false;stored={...stored,state};return true;}};
  const send=(command:Record<string,unknown>)=>runTeachingCommand(store,"student-a",{sessionId:id,revision:stored.state.revision,...command});
  return {bundle,lesson,store,get:()=>stored,send};
}

it("saves lesson and practice progress, reveals feedback after an attempt, and never certifies mastery",async()=>{
  const f=setup(),before=publicAssessmentView(f.get(),f.bundle).results;
  expect(await f.send({type:"start_teaching",activityId:"placement-lesson"})).not.toHaveProperty("error");
  expect(f.get().state.exposedLearningItemIds).toContain("overlapping-check");
  expect(f.get().state.exposedMaterialKeys).toContain(materialIdentity("sentence",f.lesson.steps[0].exampleFr));
  expect(publicTeachingView(f.get(),f.bundle)?.phase).toBe("lesson");
  await f.send({type:"begin_practice"});
  expect(JSON.stringify(publicTeachingView(f.get(),f.bundle))).not.toContain('"answerFr"');
  await f.send({type:"teaching_hint"});
  expect(publicTeachingView(f.get(),f.bundle)?.exercise?.hintFr).toBeTruthy();
  for(const [index,exercise] of f.lesson.practice.entries()){
    expect(await f.send({type:"answer_practice",exerciseId:exercise.id,answer:exercise.answerFr.toUpperCase()})).not.toHaveProperty("error");
    const current=publicTeachingView(f.get(),f.bundle);
    expect(current?.exercise?.feedback?.correct).toBe(true);
    expect(current?.exerciseIndex).toBe(index);
    await f.send({type:"next_exercise"});
  }
  expect(f.get().state.teaching).toBeNull();
  expect(f.get().state.completedTeachingIds).toEqual([f.lesson.id]);
  expect(f.get().state.refinements).toEqual([]);
  expect(publicAssessmentView(f.get(),f.bundle).results).toEqual(before);
  // The completed lesson must not loop as the next recommendation. No fresh
  // check exists in this fixture because the only question was exposed.
  expect(publicAssessmentView(f.get(),f.bundle).learningActivities).toEqual([]);
});

it("rejects cross-student access, injected grades, stale reviews and unsupported bindings",async()=>{
  const f=setup(),command={type:"start_teaching",activityId:"placement-lesson",sessionId:id,revision:0};
  expect(await runTeachingCommand(f.store,"student-b",command)).toHaveProperty("error");
  expect(await f.send({...command,correct:true})).toHaveProperty("error");
  expect(await f.send({...command,activityId:"not-recommended"})).toHaveProperty("error");
  f.lesson.steps[0].exampleFr="Changed after review";
  await expect(f.send(command)).rejects.toThrow(/stale/);
  expect(f.get().state.revision).toBe(0);
});

it("does not let concurrent requests advance twice or serve an independent check during guidance",async()=>{
  const f=setup();await f.send({type:"start_teaching",activityId:"placement-lesson"});await f.send({type:"begin_practice"});
  const exercise=f.lesson.practice[0],command={type:"answer_practice",exerciseId:exercise.id,answer:exercise.answerFr,sessionId:id,revision:f.get().state.revision};
  const results=await Promise.all([1,2].map(()=>runTeachingCommand(f.store,"student-a",command)));
  expect(results.filter(result=>"conflict" in result)).toHaveLength(1);
  expect(f.get().state.teaching?.responses).toHaveLength(1);
  expect(await runLearningCheckCommand(f.store,"student-a",{type:"start_check",activityId:"check",sessionId:id,revision:f.get().state.revision})).toHaveProperty("error");
  await f.send({type:"leave_teaching"});
  expect(f.get().state.completedTeachingIds??[]).toEqual([]);
  expect(f.get().state.exposedLearningItemIds).toContain("overlapping-check");
});

it("keeps a wrong guided answer as feedback rather than failure evidence and requires an attempt before advancing",async()=>{
  const f=setup();await f.send({type:"start_teaching",activityId:"placement-lesson"});await f.send({type:"begin_practice"});
  expect(await f.send({type:"next_exercise"})).toHaveProperty("error");
  expect(await f.send({type:"answer_practice",exerciseId:"not-active",answer:"test"})).toHaveProperty("error");
  await f.send({type:"answer_practice",exerciseId:f.lesson.practice[0].id,answer:"Sami regarde le."});
  expect(publicTeachingView(f.get(),f.bundle)?.exercise?.feedback?.correct).toBe(false);
  expect(f.get().state.refinements).toEqual([]);
  await f.send({type:"next_exercise"});
  expect(publicTeachingView(f.get(),f.bundle)?.exerciseIndex).toBe(1);
  expect(publicTeachingView(f.get(),f.bundle)?.exercise?.feedback).toBeNull();
});

it("offers a fresh check after teaching and reopens instruction when that independent check fails",async()=>{
  const f=setup();
  // Synthetic question in a test-only store, separate from the guided examples.
  f.bundle.assessment.probes.push({...f.bundle.assessment.probes[0],id:"fresh-check"});
  const template=f.bundle.bank.items[0];
  f.bundle.bank.items.push({...template,itemKey:"fresh-check",evidenceKey:skill.evidenceKey,item:{...template.item,
    nodeKey:skill.nodeKey,responseType:"short_answer",promptFr:"Réécris « Paul écoute la radio » avec « la ».",correctAnswer:"Paul l’écoute.",
    acceptableAnswers:[],validatorType:"exact",validatorConfig:{},choices:undefined}});
  f.bundle.activities!.push({id:"fresh-binding",nodeKey:skill.nodeKey,facetKey:skill.facetKey,mode:"production",kind:"independent_check",status:"published",
    titleFr:"Une nouvelle vérification",href:"/student/diagnostic",probeIds:["fresh-check"]});
  await f.send({type:"start_teaching",activityId:"placement-lesson"});await f.send({type:"begin_practice"});
  for(const exercise of f.lesson.practice){
    await f.send({type:"answer_practice",exerciseId:exercise.id,answer:exercise.answerFr});await f.send({type:"next_exercise"});
  }
  expect(publicAssessmentView(f.get(),f.bundle).learningActivities[0]).toMatchObject({activityId:"fresh-binding",action:"verify"});
  await runLearningCheckCommand(f.store,"student-a",{type:"start_check",activityId:"fresh-binding",sessionId:id,revision:f.get().state.revision});
  const check=f.get().state.learningCheck!;
  expect(check.itemId).toBe("fresh-check");
  await runLearningCheckCommand(f.store,"student-a",{type:"answer_check",checkId:check.id,answer:"Paul écoute la.",sessionId:id,revision:f.get().state.revision});
  expect(f.get().state.completedTeachingIds).toEqual([]);
  expect(publicAssessmentView(f.get(),f.bundle).learningActivities[0].activityId).toBe("placement-lesson");
});

it("preserves a provisional gap through lesson reload and goes to verification after completion",async()=>{
 const f=setup();
 f.get().state.observations.forEach(observation=>observation.occasionId="learning-day:2026-09-11");
 f.bundle.assessment.probes.push({...f.bundle.assessment.probes[0],id:"provisional-fresh-check",contextId:"new-context"});
 f.bundle.activities!.push({id:"provisional-fresh-binding",nodeKey:skill.nodeKey,facetKey:skill.facetKey,mode:lessonDraft.mode,kind:"independent_check",status:"published",titleFr:"Synthetic fresh check",href:"/student/diagnostic",probeIds:["provisional-fresh-check"]});
 const before=publicAssessmentView(f.get(),f.bundle);
 expect(before.results[0]).toMatchObject({status:"uncertain",resolved:false});
 expect(before.results[0].modes[0]).toMatchObject({provisionalGap:true,distinctOccasions:1,confirmed:false});
 expect(before.learningActivities[0]).toMatchObject({activityId:"placement-lesson",action:"learn"});
 await f.send({type:"start_teaching",activityId:"placement-lesson"});
 await f.send({type:"begin_practice"});
 const first=f.lesson.practice[0];
 await f.send({type:"answer_practice",exerciseId:first.id,answer:first.answerFr});
 const revision=f.get().state.revision;
 const reloaded=await f.send({type:"view_teaching"});
 expect(reloaded).not.toHaveProperty("error");
 expect(f.get().state.revision).toBe(revision);
 expect(publicTeachingView(f.get(),f.bundle)?.exercise?.feedback?.correct).toBe(true);
 await f.send({type:"next_exercise"});
 for(const exercise of f.lesson.practice.slice(1)){
  await f.send({type:"answer_practice",exerciseId:exercise.id,answer:exercise.answerFr});
  await f.send({type:"next_exercise"});
 }
 const after=publicAssessmentView(f.get(),f.bundle);
 expect(after.results).toEqual(before.results);
 expect(after.learningActivities[0]).toMatchObject({activityId:"provisional-fresh-binding",action:"verify"});
 expect(f.get().state.refinements).toEqual([]);
 expect(await f.send({type:"start_teaching",activityId:"placement-lesson"})).toHaveProperty("error");
});

it("runs an explicitly permitted pending-review lesson without inventing approval or mastery",async()=>{
 const f=setup();
 const {review,...body}=f.lesson;void review;
 const pending={...body,status:"published_pending_review" as const};
 f.bundle.teachingContent=[pending];
 f.bundle.assessment.reviewPolicy={mode:"parallel_review",authorization:"product-owner-request-2026-09-11",reviewOwner:"product_owner",bankChecksum:f.bundle.assessment.bankChecksum,questionChecksums:{},teachingChecksums:{[pending.id]:teachingContentChecksum(pending)}};
 f.get().state.release=bindAssessmentRelease(f.bundle.assessment,f.bundle);
 const before=publicAssessmentView(f.get(),f.bundle).results;
 expect(await f.send({type:"start_teaching",activityId:"placement-lesson"})).not.toHaveProperty("error");
 expect(f.get().state.exposedLearningItemIds).toContain("overlapping-check");
 await f.send({type:"begin_practice"});
 for(const exercise of pending.practice){
  expect(await f.send({type:"answer_practice",exerciseId:exercise.id,answer:exercise.answerFr})).not.toHaveProperty("error");
  await f.send({type:"next_exercise"});
 }
 expect(f.get().state.completedTeachingIds).toContain(pending.id);
 expect(publicAssessmentView(f.get(),f.bundle).results).toEqual(before);
 expect(pending).not.toHaveProperty("review");
 expect(pending.status).toBe("published_pending_review");
});

it("projects teaching audio without authoring metadata and records lesson exposure",async()=>{
 const f=setup(true);
 await f.send({type:"start_teaching",activityId:"placement-lesson"});
 const view=publicTeachingView(f.get(),f.bundle)!;
 expect(view.steps[0].audio?.src).toBe(`/diagnostic-audio/${"a".repeat(64)}.mp3`);
 expect(view.steps[0]).not.toHaveProperty("audioStimulus");
 expect(f.get().state.exposedMaterialKeys).toContain(`audio:sha256:${"a".repeat(64)}`);
 expect(f.get().state.exposedMaterialKeys).toContain(`audio:sha256:${"b".repeat(64)}`);
 await f.send({type:"begin_practice"});
 const exercise=publicTeachingView(f.get(),f.bundle)!.exercise!;
 expect(exercise.audio?.src).toBe(`/diagnostic-audio/${"b".repeat(64)}.mp3`);
 expect(exercise).not.toHaveProperty("audioStimulus");expect(exercise).not.toHaveProperty("answerFr");
});

it('opens optional teaching for an untested skill without adding assessment evidence',async()=>{
 const f=setup();f.get().state.observations=[];
 const before=structuredClone(f.get().state.observations);
 const view=publicAssessmentView(f.get(),f.bundle);
 expect(view.optionalLearningActivities?.map(a=>a.activityId)).toContain('placement-lesson');
 expect(await runTeachingCommand(f.store,'other-student',{type:'start_teaching',sessionId:id,revision:f.get().state.revision,activityId:'placement-lesson'})).toHaveProperty('error');
 expect(await f.send({type:'start_teaching',activityId:'forged'})).toHaveProperty('error');
 expect(await f.send({type:'start_teaching',activityId:'placement-lesson'})).not.toHaveProperty('error');
 expect(f.get().state.observations).toEqual(before);
 expect(f.get().state.exposedLearningItemIds).toContain('overlapping-check');
 expect(publicTeachingView(f.get(),f.bundle)?.phase).toBe('lesson');
});
