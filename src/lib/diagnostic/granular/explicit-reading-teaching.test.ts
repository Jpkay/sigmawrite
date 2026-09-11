import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {EXPLICIT_READING_TEACHING} from "./explicit-reading-teaching";
import {EXPLICIT_READING_DRAFTS} from "./explicit-reading-drafts";
import {validateTeachingTargets,validatePublishedTeaching} from "./teaching-content";
import {teachingMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
const read=()=>JSON.parse(readFileSync("docs/diagnostic/v3-parallel-review-candidate.json","utf8"));
it("separates finding the stated detail from selecting its actual supporting sentence",()=>{
 expect(()=>validateTeachingTargets(read().assessment,EXPLICIT_READING_TEACHING)).not.toThrow();
 for(const lesson of EXPLICIT_READING_TEACHING){
  const keys=teachingMaterialKeys(lesson),text=JSON.stringify(lesson);
  expect(text).not.toContain("—");
  for(const draft of EXPLICIT_READING_DRAFTS)expect(text).not.toContain(draft.passage);
  expect(lesson.practice).toHaveLength(6);
  for(let index=0;index<lesson.practice.length;index+=2){
   const answer=lesson.practice[index],support=lesson.practice[index+1];
   const passage=answer.promptFr.split("\n\n")[0];
   expect(passage.split(/\s+/).length).toBeLessThan(65);
   expect(support.promptFr.split("\n\n")[0]).toBe(passage);
   expect(passage).toContain(support.answerFr);
   expect(keys).toContain(materialIdentity("sentence",passage));
   for(const exercise of [answer,support])expect(exercise.choices?.filter(c=>c===exercise.answerFr)).toHaveLength(1);
  }
 }
});
it("keeps both exact reading lessons pending, with unexposed follow-up passages",()=>{
 const bundle=read();
 for(const draft of EXPLICIT_READING_TEACHING){
  const lesson=bundle.teachingContent.find((l:{id:string})=>l.id===draft.id);
  expect(lesson.status).toBe("published_pending_review");expect(lesson.review).toBeUndefined();
  expect(()=>validatePublishedTeaching(bundle.assessment,[lesson])).not.toThrow();
  expect(lesson.assessmentExposureIds).toEqual([]);
  expect(bundle.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===draft.id).freshCheckAvailable).toBe(true);
 }
});
