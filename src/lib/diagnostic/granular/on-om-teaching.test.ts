import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {ON_OM_TEACHING} from "./on-om-teaching";
import {ON_OM_DRAFTS} from "./on-om-drafts";
import {validateTeachingTargets,validatePublishedTeaching} from "./teaching-content";
import {teachingMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
const candidate=()=>JSON.parse(readFileSync("docs/diagnostic/v3-parallel-review-candidate.json","utf8"));
it("teaches both usual spellings and the exception without exposing reserved assessed words",()=>{
 expect(()=>validateTeachingTargets(candidate().assessment,ON_OM_TEACHING)).not.toThrow();
 for(const lesson of ON_OM_TEACHING){
  const materials=teachingMaterialKeys(lesson);
  for(const draft of ON_OM_DRAFTS)expect(materials).not.toContain(materialIdentity("word",draft.word));
  expect(JSON.stringify(lesson)).not.toContain("—");
  for(const exercise of lesson.practice){
   if(exercise.choices)expect(exercise.choices.filter(c=>c===exercise.answerFr)).toHaveLength(1);
   else{
    expect(materials).toContain(materialIdentity("word",exercise.answerFr));
    const mask=exercise.promptFr.match(/[\p{L}_]*___[\p{L}_]*/u)![0];
    expect([mask.replace("___","n"),mask.replace("___","m")]).toContain(exercise.answerFr);
   }
  }
  expect(lesson.practice.some(p=>p.answerFr==="bonbon")).toBe(true);
  expect(lesson.practice.some(p=>["front","citron","bidon","plafond"].includes(p.answerFr))).toBe(true);
  expect(lesson.practice.some(p=>["bombe","pompon","compas","pompier","ombrelle"].includes(p.answerFr))).toBe(true);
 }
});
it("retains fresh assessment pools for both pending-review lessons",()=>{
 const bundle=candidate();
 for(const draft of ON_OM_TEACHING){
  const lesson=bundle.teachingContent.find((l:{id:string})=>l.id===draft.id);
  expect(lesson.status).toBe("published_pending_review");expect(lesson.review).toBeUndefined();
  expect(()=>validatePublishedTeaching(bundle.assessment,[lesson])).not.toThrow();
  expect(bundle.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===draft.id).freshCheckAvailable).toBe(true);
 }
});
