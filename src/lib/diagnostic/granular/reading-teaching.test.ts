import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {READING_TEACHING} from "./reading-teaching";
import {teachingContentChecksum,type PublishedTeachingContent} from "./teaching-content";
import {teachingMaterialKeys} from "./material-annotations";
import {adaptV3ForAssessment,type EvidenceSkill,type V3Assessment} from "./v3-adapter";
import {buildV3Facets} from "./facets";
import {applyFacetTargets} from "./facet-adapter";
import {createSession} from "./session";
import {bindAssessmentRelease} from "./release-binding";
import {runTeachingCommand,publicTeachingView} from "./teaching-service";
import {publicAssessmentView,type AssessmentBundle,type AssessmentStore,type StoredSession} from "./service";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json"),full=applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment;
const id="11111111-1111-4111-8111-111111111111";
function setup(withUnknownPrerequisite=false){
 const draft=READING_TEACHING[0],skill:EvidenceSkill={...full.skills.find(s=>s.facetKey===draft.facetKey)!,prerequisites:[]},assessment:V3Assessment={...full,skills:[skill],probes:[]};
 if(withUnknownPrerequisite){
  assessment.skills.push({...skill,id:"foundation",nodeKey:"fixture-foundation",facetKey:"fixture-foundation",prerequisites:[]});
  skill.prerequisites=["foundation"];
  assessment.probes.push({id:"foundation-check-item",skillId:"foundation",mode:"interpretation",contextId:"fresh-foundation",difficulty:.5,expectedSeconds:30,guessProbability:.25,usage:"learning"});
 }
 // Test-only publication to exercise the service; no source approval is created.
 const lesson:PublishedTeachingContent={...structuredClone(draft),status:"published",assessmentExposureIds:[],review:{reviewerId:"test-only",reviewedAt:"2026-09-11T00:00:00Z",contentChecksum:"",exposureMappingReviewed:true}};
 lesson.review.contentChecksum=teachingContentChecksum(lesson);
 const bundle:AssessmentBundle={bank,assessment,taxonomyId:"taxonomy",bankId:"bank",teachingContent:[lesson],activities:[{id:"reading-lesson",nodeKey:skill.nodeKey,facetKey:skill.facetKey,mode:"interpretation",kind:"instruction",status:"published",titleFr:lesson.titleFr,href:"/student/diagnostic",contentId:lesson.id}]};
 if(withUnknownPrerequisite)bundle.activities!.push({id:"foundation-check",nodeKey:"fixture-foundation",facetKey:"fixture-foundation",mode:"interpretation",kind:"independent_check",status:"published",titleFr:"Check fixture foundation",href:"/student/diagnostic",probeIds:["foundation-check-item"]});
 let stored:StoredSession={id,studentId:"student",releaseId:"release",state:{...createSession(bindAssessmentRelease(assessment,bundle)),phase:"learning",completionReason:"time_budget",observations:Array.from({length:3},(_,i)=>({itemId:`wrong-${i}`,skillId:skill.id,mode:"interpretation",correct:false,contextId:`text-${i}`,occasionId:`day-${i}`,textType:"narrative",unaided:true,guessProbability:.25,activeSeconds:30}))}};
 const store:AssessmentStore={load:async(student,session)=>student==="student"&&session===id?structuredClone(stored):null,release:async()=>bundle,save:async(_student,_id,revision,state)=>{if(revision!==stored.state.revision)return false;stored={...stored,state};return true;}};
 const send=(command:Record<string,unknown>)=>runTeachingCommand(store,"student",{sessionId:id,revision:stored.state.revision,...command});
 return {send,get:()=>stored,bundle,lesson};
}
it("grades guided selections on the server, retains hints and never changes mastery",async()=>{
 const f=setup(),before=publicAssessmentView(f.get(),f.bundle).results;
 expect(await f.send({type:"start_teaching",activityId:"reading-lesson"})).not.toHaveProperty("error");
 await f.send({type:"begin_practice"});
 const first=publicTeachingView(f.get(),f.bundle)!.exercise!;
 expect(first.choices).toHaveLength(4);expect(first.feedback).toBeNull();
 expect(JSON.stringify(first)).not.toContain('"answerFr"');expect(JSON.stringify(first)).not.toContain('"correct"');
 expect(publicTeachingView(JSON.parse(JSON.stringify(f.get())),f.bundle)!.exercise!.choices).toEqual(first.choices);
 expect(await f.send({type:"answer_practice",exerciseId:first.id,answer:f.lesson.practice[0].answerFr})).toHaveProperty("error");
 expect(await f.send({type:"answer_practice",exerciseId:first.id,answer:"forged-id"})).toHaveProperty("error");
 await f.send({type:"teaching_hint"});
 const wrong=first.choices!.find(choice=>choice.text!==f.lesson.practice[0].answerFr)!;
 await f.send({type:"answer_practice",exerciseId:first.id,answer:wrong.id});
 expect(publicTeachingView(f.get(),f.bundle)!.exercise!.feedback).toMatchObject({correct:false,answer:wrong.text});
 expect(f.get().state.teaching!.responses[0].hintUsed).toBe(true);
 await f.send({type:"next_exercise"});
 const next=publicTeachingView(f.get(),f.bundle)!.exercise!;
 expect(await f.send({type:"answer_practice",exerciseId:next.id,answer:first.choices![0].id})).toHaveProperty("error");
 for(const exercise of f.lesson.practice.slice(1)){
  const shown=publicTeachingView(f.get(),f.bundle)!.exercise!,correct=shown.choices!.find(choice=>choice.text===exercise.answerFr)!;
  await f.send({type:"answer_practice",exerciseId:shown.id,answer:correct.id});
  expect(publicTeachingView(f.get(),f.bundle)!.exercise!.feedback?.correct).toBe(true);
  await f.send({type:"next_exercise"});
 }
 expect(f.get().state.teaching).toBeNull();expect(f.get().state.completedTeachingIds).toContain(f.lesson.id);
 expect(publicAssessmentView(f.get(),f.bundle).results).toEqual(before);expect(f.get().state.refinements).toEqual([]);
});
it("binds choices into publication checksums and exposure annotations",()=>{
 const f=setup(),checksum=f.lesson.review.contentChecksum;
 f.lesson.materialExposure={sentences:[f.lesson.practice[0].choices![1]]};
 expect(teachingMaterialKeys(f.lesson)).toHaveLength(1);
 f.lesson.review.contentChecksum=teachingContentChecksum(f.lesson);
 expect(f.lesson.review.contentChecksum).not.toBe(checksum);
 f.lesson.practice[0].choices![1]="Changed after review";
 expect(teachingContentChecksum(f.lesson)).not.toBe(f.lesson.review.contentChecksum);
});

it("rejects a direct request for dependent teaching while its foundation still needs verification",async()=>{
 const f=setup(true),before=structuredClone(f.get());
 expect(publicAssessmentView(f.get(),f.bundle).learningActivities.map(activity=>activity.activityId)).toEqual(["foundation-check"]);
 expect(await f.send({type:"start_teaching",activityId:"reading-lesson"})).toEqual({error:"Cette leçon n’est pas proposée dans ton parcours."});
 expect(f.get()).toEqual(before);
});
