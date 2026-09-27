import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {CANONICAL_SENTENCE_TEACHING} from "./canonical-sentence-teaching";
import {CANONICAL_SENTENCE_EXAMPLES,CANONICAL_SENTENCE_PRODUCTION} from "./canonical-sentence-drafts";
import {validateTeachingTargets,validatePublishedTeaching} from "./teaching-content";
import {teachingMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
const candidate=()=>JSON.parse(readFileSync("docs/diagnostic/v3-parallel-review-candidate.json","utf8"));
it("keeps guided material distinct from the assessment and annotates completed production sentences",()=>{
 const bundle=candidate();
 expect(()=>validateTeachingTargets(bundle.assessment,CANONICAL_SENTENCE_TEACHING)).not.toThrow();
 for(const lesson of CANONICAL_SENTENCE_TEACHING){
  const materials=teachingMaterialKeys(lesson),text=JSON.stringify(lesson);
  expect(text).not.toContain("—");
  for(const row of [...CANONICAL_SENTENCE_EXAMPLES,...CANONICAL_SENTENCE_PRODUCTION]){
   expect(text).not.toContain(row.join(" ")+".");
   expect(text).not.toContain(`${row[0]}, ${row[2]}.`);
  }
  for(const exercise of lesson.practice){
   if(exercise.choices)expect(exercise.choices.filter(c=>c===exercise.answerFr)).toHaveLength(1);
   else{
    expect(materials).toContain(materialIdentity("sentence",exercise.answerFr));
    const groups=exercise.promptFr.split("\n\n")[1].split(" / ");
    expect(groups).toHaveLength(3);
    expect(exercise.answerFr).toBe(`${groups[2]} ${groups[1]} ${groups[0]}.`);
   }
  }
 }
 const recognition=CANONICAL_SENTENCE_TEACHING.find(l=>l.mode==="recognition")!;
 expect(recognition.practice.find(p=>p.id==="canonical-recognition-guide-3")?.answerFr).toBe("Un verbe conjugué.");
 expect(recognition.practice.find(p=>p.id==="canonical-recognition-guide-5")?.answerFr).toContain("n’exige pas de complément");
});
it("retains both exact pending-review lessons and sufficient fresh follow-up questions",()=>{
 const bundle=candidate();
 for(const draft of CANONICAL_SENTENCE_TEACHING){
  const lesson=bundle.teachingContent.find((l:{id:string})=>l.id===draft.id);
  expect(lesson.status).toBe("published_pending_review");expect(lesson.review).toBeUndefined();
  expect(()=>validatePublishedTeaching(bundle.assessment,[lesson])).not.toThrow();
  expect(lesson.assessmentExposureIds).toEqual([]);
  expect(bundle.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===draft.id).freshCheckAvailable).toBe(true);
 }
});
