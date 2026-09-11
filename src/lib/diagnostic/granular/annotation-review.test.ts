import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {validateAnnotationReviewDraft,type AnnotationReviewDraft} from "./annotation-review";
import {adaptV3ForAssessment,readingContextId} from "./v3-adapter";
import {applyFacetTargets} from "./facet-adapter";
import {buildV3Facets} from "./facets";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const bank=read("generated/diagnostic-bank-v3-draft.json"),artifact=read("generated/french-taxonomy-v3.json");
const draft=read("docs/diagnostic/v3-facet-annotations.json") as AnnotationReviewDraft;
it("assigns inspected items only to their exact target and preserves shared passage contexts",()=>{
 const annotations=validateAnnotationReviewDraft(draft,bank);
 const base=adaptV3ForAssessment({bank,artifact});
 const compiled=applyFacetTargets(base,buildV3Facets(artifact.taxonomy),bank,annotations);
 const unmapped=applyFacetTargets(base,buildV3Facets(artifact.taxonomy),bank).unassignedItemKeys;
 expect([...annotations.filter(a=>!base.unsupportedEvidenceItemKeys?.includes(a.itemKey)).map(a=>a.itemKey),...draft.holds.filter(h=>base.probes.some(p=>p.id===h.itemKey)).map(h=>h.itemKey)].sort()).toEqual([...unmapped].sort());
 for(const annotation of annotations){
  if(base.unsupportedEvidenceItemKeys?.includes(annotation.itemKey)){expect(compiled.assessment.probes.some(p=>p.id===annotation.itemKey)).toBe(false);continue;}
  const probe=compiled.assessment.probes.find(p=>p.id===annotation.itemKey)!;
  expect(probe).toBeDefined();
  expect(compiled.assessment.skills.find(s=>s.id===probe.skillId)?.facetKey).toBe(annotation.facetKey);
  const entry=bank.items.find((entry:{itemKey:string})=>entry.itemKey===annotation.itemKey);
  expect(probe.contextId).toBe(entry.sectionKey==="reading_comprehension"?readingContextId(entry.item.validatorConfig,entry.item.promptFr):annotation.contextKey);
 }
 const garden=compiled.assessment.probes.filter(p=>annotations.some(a=>a.itemKey===p.id&&a.contextKey==="passage:garden"));
 expect(garden.length).toBeGreaterThan(1);
 expect(new Set(garden.map(p=>p.contextId)).size).toBe(1);
 expect(compiled.assessment.probes.some(p=>p.id==="local-reading-v1:resoudre_pronom_objet:receptive:core")).toBe(false);
 expect(draft.holds.every(hold=>!compiled.assessment.probes.some(p=>p.id===hold.itemKey))).toBe(true);
});
it("rejects stale source approvals, tampered manifests and conflicting mapping decisions",()=>{
 const changed=structuredClone(bank);
 changed.items.find((i:{itemKey:string})=>i.itemKey===draft.annotations[0].itemKey).item.promptFr+=" Updated";
 expect(()=>validateAnnotationReviewDraft(draft,changed)).toThrow(/Stale/);
 expect(()=>validateAnnotationReviewDraft({...draft,checksum:"bad"},bank)).toThrow(/Invalid/);
 const {checksum:ignored,...duplicate}=draft;
 void ignored;
 duplicate.holds=[...duplicate.holds,{...draft.annotations[0],category:"conflict"}];
 expect(()=>validateAnnotationReviewDraft({...duplicate,checksum:checksum(duplicate)},bank)).toThrow(/Duplicate/);
});
