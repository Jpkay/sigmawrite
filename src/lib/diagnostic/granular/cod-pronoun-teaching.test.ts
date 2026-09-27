import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {COD_PRONOUN_TEACHING} from "./cod-pronoun-teaching";
import {validateTeachingTargets,validatePublishedTeaching} from "./teaching-content";
import {teachingMaterialKeys,questionAssessedMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
const candidate=()=>JSON.parse(readFileSync("docs/diagnostic/v3-parallel-review-candidate.json","utf8"));
it("keeps all four exact COD targets distinct and records source and completed guided sentences",()=>{
 const bundle=candidate();
 expect(()=>validateTeachingTargets(bundle.assessment,COD_PRONOUN_TEACHING)).not.toThrow();
 expect(new Set(COD_PRONOUN_TEACHING.map(l=>l.facetKey)).size).toBe(4);
 for(const lesson of COD_PRONOUN_TEACHING){
  const materials=teachingMaterialKeys(lesson);
  expect(lesson.practice).toHaveLength(6);expect(JSON.stringify(lesson)).not.toContain("—");
  for(const exercise of lesson.practice){
   expect(materials).toContain(materialIdentity("sentence",exercise.promptFr.split("\n\n")[0]));
   expect(materials).toContain(materialIdentity("sentence",exercise.answerFr));
  }
 }
 const elision=COD_PRONOUN_TEACHING.find(l=>l.facetKey?.endsWith(":elision"))!;
 expect(elision.practice[5].answerFr).toBe("Ma tante ne l’abandonne pas.");
 const plural=COD_PRONOUN_TEACHING.find(l=>l.facetKey?.endsWith(":les"))!;
 expect(plural.practice[4].answerFr).toBe("Les élèves les apportent.");
 expect(plural.steps.some(s=>s.exampleFr.includes("Emma les apporte."))).toBe(true);
});
it("keeps every lesson pending and leaves sufficient fresh assessment questions after all teaching exposure",()=>{
 const bundle=candidate();
 const bank=JSON.parse(readFileSync("generated/french-v3-pronouns-expansion.json","utf8"));
 for(const draft of COD_PRONOUN_TEACHING){
  const lesson=bundle.teachingContent.find((l:{id:string})=>l.id===draft.id);
  expect(()=>validatePublishedTeaching(bundle.assessment,[lesson])).not.toThrow();
  expect(lesson.status).toBe("published_pending_review");expect(lesson.review).toBeUndefined();
  expect(bundle.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===draft.id).freshCheckAvailable).toBe(true);
  const taught=new Set(teachingMaterialKeys(draft));
  for(const entry of bank.items.filter((e:{item:{nodeKey:string}})=>e.item.nodeKey==="produire_pronom_cod"))expect(questionAssessedMaterialKeys(entry.item).filter(key=>taught.has(key))).toEqual([]);
 }
});
