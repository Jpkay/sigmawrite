import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {adaptV3ForAssessment} from "./v3-adapter";
import {applyFacetTargets} from "./facet-adapter";
import {buildV3Facets} from "./facets";
import {materialIdentity} from "./material-identity";
import {FRENCH_TEACHING_DRAFTS} from "./draft-teaching-catalogue";
import {buildTeachingReviewCatalogue} from "./teaching-review-catalogue";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const assessment=applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank).assessment;
it("exports each exact target with source content and anchored exposure, never approvals",()=>{
 const before=checksum({assessment,lessons:FRENCH_TEACHING_DRAFTS});
 const {checksum:stored,...catalogue}=buildTeachingReviewCatalogue(assessment,FRENCH_TEACHING_DRAFTS);
 expect(checksum(catalogue)).toBe(stored);
 expect(catalogue.summary.lessons).toBe(FRENCH_TEACHING_DRAFTS.length);
 expect(catalogue.summary.missingExposureAnnotations).toEqual([]);
 for(const row of catalogue.rows){
  expect(row.content.status).toBe("draft_requires_review");expect(checksum(row.content)).toBe(row.contentChecksum);
  expect(assessment.skills.find(skill=>skill.id===row.skillId)?.modes).toContain(row.mode);
  expect(row).not.toHaveProperty("reviewerId");expect(row).not.toHaveProperty("published");
 }
 const pronoun=catalogue.rows.find(row=>row.lessonId==="french-v3-teaching:pronoun-placement:finite")!;
 for(const sentence of ["Lina le lit.","Sami regarde le match","Sami le regarde.","Je vais le regarder"])expect(pronoun.materialKeys).toContain(materialIdentity("sentence",sentence));
 expect(pronoun.materialKeys).not.toContain(materialIdentity("sentence",pronoun.content.practice[0].promptFr));
 pronoun.content.titleFr="Modified exported copy";
 expect(checksum({assessment,lessons:FRENCH_TEACHING_DRAFTS})).toBe(before);
});
it("rejects ambiguous target assignment and material not present in the lesson",()=>{
 const lesson=FRENCH_TEACHING_DRAFTS[0],target=assessment.skills.find(skill=>skill.nodeKey===lesson.nodeKey&&skill.facetKey===lesson.facetKey&&skill.modes.includes(lesson.mode))!;
 expect(()=>buildTeachingReviewCatalogue({...assessment,skills:[...assessment.skills,{...target,id:"duplicate-target"}]},[lesson])).toThrow(/Ambiguous/);
 const altered=structuredClone(lesson);altered.materialExposure={sentences:["Une phrase absente de la leçon."]};
 expect(()=>buildTeachingReviewCatalogue(assessment,[altered])).toThrow(/anchored/);
 const empty=structuredClone(lesson);empty.practice[0].hintFr=" ";expect(()=>buildTeachingReviewCatalogue(assessment,[empty])).toThrow(/Incomplete/);
});
