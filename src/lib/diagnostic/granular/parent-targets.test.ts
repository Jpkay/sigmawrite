import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {buildV3Facets} from "./facets";
import {adaptV3ForAssessment} from "./v3-adapter";
import {applyFacetTargets,type TargetAnnotation} from "./facet-adapter";
import {assembleDraftBank,type DraftExpansion} from "./assemble-drafts";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const facets=buildV3Facets(artifact.taxonomy),assessment=adaptV3ForAssessment({artifact,bank});
const probe=assessment.probes.find(p=>!facets.some(f=>f.nodeKey===assessment.skills.find(s=>s.id===p.skillId)!.nodeKey))!;
const entry=bank.items.find((entry:{itemKey:string})=>entry.itemKey===probe.id);
const annotation:TargetAnnotation={kind:"evidence",itemKey:entry.itemKey,itemChecksum:checksum(entry),contextKey:"reviewed-parent-context",
 evidenceTarget:{nodeKey:entry.item.nodeKey,evidenceKey:entry.evidenceKey}};
it("preserves an approved parent evidence target and its reviewed context",()=>{
 const result=applyFacetTargets(assessment,facets,bank,[annotation]);
 expect(result.assessment.probes.find(p=>p.id===probe.id)).toMatchObject({skillId:probe.skillId,contextId:annotation.contextKey});
 expect(result.assessment.skills.find(s=>s.id===probe.skillId)?.facetKey).toBeUndefined();
});
it("rejects wrong evidence, mixed mappings and bypassing an existing refinement",()=>{
 for(const bad of [
  {...annotation,evidenceTarget:{...annotation.evidenceTarget,evidenceKey:"unrelated"}},
  {...annotation,facetKey:"invented"},
 ])expect(()=>applyFacetTargets(assessment,facets,bank,[bad as TargetAnnotation])).toThrow(/mapping/);
 const refined=bank.items.find((item:{item:{nodeKey:string}})=>facets.some(f=>f.nodeKey===item.item.nodeKey));
 const collapsed:TargetAnnotation={kind:"evidence",itemKey:refined.itemKey,itemChecksum:checksum(refined),contextKey:"context",evidenceTarget:{nodeKey:refined.item.nodeKey,evidenceKey:refined.evidenceKey}};
 expect(()=>applyFacetTargets(assessment,facets,bank,[collapsed])).toThrow(/collapsed/);
});
it("assembles an unapproved parent-mapped draft without inventing a facet or copying approval",()=>{
 const draft=structuredClone(entry);draft.itemKey="test:parent-mapped-draft";draft.item.promptFr="Synthetic mapping fixture. "+draft.item.promptFr;draft.reviewStatus="needs_human_review";delete draft.review;
 draft.qcGates={...draft.qcGates,verdict:"needs_human_review"};
 const map={...annotation,itemKey:draft.itemKey,itemChecksum:checksum(draft)};
 const content={version:"test-parent-expansion",status:"draft_requires_review" as const,parentTaxonomyChecksum:artifact.manifest.contentChecksum,
 sourceBankChecksum:assessment.bankChecksum,items:[draft],annotations:[map]};
 const expansion:DraftExpansion={...content,checksum:checksum(content)};
 const result=assembleDraftBank(bank,artifact.taxonomy,[expansion]);
 expect(result.bank.items).toHaveLength(bank.items.length+1);
 expect(result.bank.manifest!.eligibleItemCount).toBe(238);
 expect(result.annotations[0]).toMatchObject({kind:"evidence",evidenceTarget:annotation.evidenceTarget});
});
