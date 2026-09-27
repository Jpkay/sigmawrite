import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {COI_PRONOUN_TEACHING} from "./coi-pronoun-teaching";
import {validateTeachingTargets,validatePublishedTeaching} from "./teaching-content";
import {teachingMaterialKeys,questionAssessedMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
const candidate=()=>JSON.parse(readFileSync("docs/diagnostic/v3-parallel-review-candidate.json","utf8"));
it("distinguishes direct and indirect human complements and preserves the unselected object",()=>{
 expect(()=>validateTeachingTargets(candidate().assessment,COI_PRONOUN_TEACHING)).not.toThrow();
 for(const lesson of COI_PRONOUN_TEACHING){
  const keys=teachingMaterialKeys(lesson);
  expect(JSON.stringify(lesson)).not.toContain("—");
  for(const p of lesson.practice){
   expect(keys).toContain(materialIdentity("sentence",p.promptFr.split("\n\n")[0]));
   expect(keys).toContain(materialIdentity("sentence",p.answerFr));
  }
 }
 const distinction=COI_PRONOUN_TEACHING[2];
 expect(distinction.practice[0].answerFr).toBe("La bibliothécaire le salue.");
 expect(distinction.practice[1].answerFr).toBe("La bibliothécaire lui écrit.");
 expect(distinction.practice[6].answerFr).toBe("L’entraîneur la présente aux joueuses.");
 expect(distinction.practice[7].answerFr).toBe("L’entraîneur leur présente la recrue.");
 expect(COI_PRONOUN_TEACHING[0].practice[5].answerFr).toBe("Le capitaine ne lui répond pas.");
 expect(COI_PRONOUN_TEACHING[1].practice[3].answerFr).toBe("Les scouts leur montrent leur carte.");
});
it("does not reuse assessed pronoun sentences and keeps fresh checks for all three pending lessons",()=>{
 const bundle=candidate(),bank=JSON.parse(readFileSync("generated/french-v3-pronouns-expansion.json","utf8"));
 for(const draft of COI_PRONOUN_TEACHING){
  const lesson=bundle.teachingContent.find((l:{id:string})=>l.id===draft.id);
  expect(lesson.status).toBe("published_pending_review");expect(lesson.review).toBeUndefined();
  expect(()=>validatePublishedTeaching(bundle.assessment,[lesson])).not.toThrow();
  expect(bundle.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===draft.id).freshCheckAvailable).toBe(true);
  const taught=new Set(teachingMaterialKeys(draft));
  for(const entry of bank.items)expect(questionAssessedMaterialKeys(entry.item).filter(key=>taught.has(key))).toEqual([]);
 }
});
