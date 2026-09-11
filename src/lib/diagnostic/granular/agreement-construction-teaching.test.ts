import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {AGREEMENT_CONSTRUCTION_TEACHING} from "./agreement-construction-teaching";
import {validateTeachingTargets,validatePublishedTeaching} from "./teaching-content";
import {teachingMaterialKeys,questionAssessedMaterialKeys} from "./material-annotations";
import {materialIdentity} from "./material-identity";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
it("separates explanation from correction for all four constructions and annotates corrected output",()=>{
 const bundle=read("docs/diagnostic/v3-parallel-review-candidate.json");
 expect(()=>validateTeachingTargets(bundle.assessment,AGREEMENT_CONSTRUCTION_TEACHING)).not.toThrow();
 expect(AGREEMENT_CONSTRUCTION_TEACHING).toHaveLength(8);
 for(const lesson of AGREEMENT_CONSTRUCTION_TEACHING){
  const materials=teachingMaterialKeys(lesson);
  expect(JSON.stringify(lesson)).not.toContain("—");
  expect(lesson.practice).toHaveLength(4);
  if(lesson.mode==="recognition"){
   expect(lesson.practice.filter(p=>p.answerFr.startsWith("L’accord est correct"))).toHaveLength(2);
   expect(lesson.practice.filter(p=>p.answerFr.startsWith("L’accord est incorrect"))).toHaveLength(2);
  }
  for(const p of lesson.practice){
   const shown=p.promptFr.split("\n\n")[0];
   expect(materials).toContain(materialIdentity("sentence",shown));
   if(p.choices)expect(p.choices.filter(c=>c===p.answerFr)).toHaveLength(1);
   else{
    expect(materials).toContain(materialIdentity("sentence",p.answerFr));
    expect(shown.split(" ").length).toBe(p.answerFr.split(" ").length);
    expect(shown.split(" ").filter((word,index)=>word!==p.answerFr.split(" ")[index])).toHaveLength(1);
   }
  }
 }
 const separated=AGREEMENT_CONSTRUCTION_TEACHING.find(l=>l.facetKey?.endsWith(":separated")&&l.mode==="production")!;
 expect(separated.practice[0].answerFr).toBe("Le collier de perles reste dans la boîte.");
 const inverted=AGREEMENT_CONSTRUCTION_TEACHING.find(l=>l.facetKey?.endsWith(":inverted")&&l.mode==="production")!;
 expect(inverted.practice[0].answerFr).toBe("Derrière les dunes apparaît un phare.");
});
it("preserves assessment material and fresh checks under pending-review permissions",()=>{
 const bundle=read("docs/diagnostic/v3-parallel-review-candidate.json");
 const bank=[...read("generated/french-v3-agreement-analysis-expansion.json").items,...read("generated/french-v3-agreement-correction-expansion.json").items];
 for(const draft of AGREEMENT_CONSTRUCTION_TEACHING){
  const lesson=bundle.teachingContent.find((l:{id:string})=>l.id===draft.id);
  expect(lesson.status).toBe("published_pending_review");expect(lesson.review).toBeUndefined();
  expect(()=>validatePublishedTeaching(bundle.assessment,[lesson])).not.toThrow();
  expect(bundle.teachingReadiness.find((r:{lessonId:string})=>r.lessonId===draft.id).freshCheckAvailable).toBe(true);
  const taught=new Set(teachingMaterialKeys(draft));
  for(const entry of bank)expect(questionAssessedMaterialKeys(entry.item).filter(key=>taught.has(key))).toEqual([]);
 }
});
