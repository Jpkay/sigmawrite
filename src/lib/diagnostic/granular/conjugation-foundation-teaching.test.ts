import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {CONJUGATION_FOUNDATION_TEACHING} from "./conjugation-foundation-teaching";
import {CONJUGATION_FOUNDATION_DRAFTS} from "./conjugation-foundation-drafts";
import {validateTeachingTargets,validatePublishedTeaching} from "./teaching-content";
import {teachingMaterialKeys} from "./material-annotations";
const candidate=()=>JSON.parse(readFileSync("docs/diagnostic/v3-parallel-review-candidate.json","utf8"));
it("keeps foundation teaching separate from tested sentences and segmentation forms",()=>{
 const bundle=candidate();
 expect(()=>validateTeachingTargets(bundle.assessment,CONJUGATION_FOUNDATION_TEACHING)).not.toThrow();
 for(const lesson of CONJUGATION_FOUNDATION_TEACHING){
  expect(teachingMaterialKeys(lesson).length).toBeGreaterThan(0);
  const text=JSON.stringify(lesson);
  expect(text).not.toContain("—");
  for(const draft of CONJUGATION_FOUNDATION_DRAFTS.filter(d=>d.nodeKey===lesson.nodeKey)){
   if(draft.key.startsWith("segment-"))expect(text).not.toContain(draft.key.slice(8));
   else for(const sentence of [draft.answer,...draft.distractors])expect(text).not.toContain(sentence);
  }
  for(const exercise of lesson.practice){
   expect(exercise.choices?.filter(c=>c===exercise.answerFr)).toHaveLength(1);
   expect(exercise.hintFr.trim()).not.toBe("");expect(exercise.explanationFr.trim()).not.toBe("");
  }
 }
 // Do not teach the misleading shortcut that an action tomorrow must use future tense.
 const present=CONJUGATION_FOUNDATION_TEACHING.find(l=>l.nodeKey==="reconnaitre_present_indicatif")!;
 expect(present.practice.find(p=>p.id==="present-foundation-3")?.answerFr).toBe("Au présent de l’indicatif.");
 expect(present.practice.find(p=>p.id==="present-foundation-4")?.answerFr).toBe("a ronflé");
 const stem=CONJUGATION_FOUNDATION_TEACHING.find(l=>l.nodeKey==="reconnaitre_radical_terminaison")!;
 expect(stem.practice.find(p=>p.id==="stem-foundation-3")?.answerFr).toBe("jardin / ions");
 expect(stem.practice.find(p=>p.id==="stem-foundation-6")?.answerFr).toBe("éternu / ons");
});
it("admits both exact lessons under pending review and retains fresh follow-up capacity",()=>{
 const bundle=candidate();
 for(const draft of CONJUGATION_FOUNDATION_TEACHING){
  const lesson=bundle.teachingContent.find((l:{id:string})=>l.id===draft.id);
  expect(lesson.status).toBe("published_pending_review");expect(lesson.review).toBeUndefined();
  expect(()=>validatePublishedTeaching(bundle.assessment,[lesson])).not.toThrow();
  expect(lesson.assessmentExposureIds).toEqual([]);
  const row=bundle.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===draft.id);
  expect(row.freshCheckAvailable).toBe(true);
 }
});
