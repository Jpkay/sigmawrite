import {FRENCH_DRAFT_EXPANSION_SOURCES} from "./draft-expansion-sources";
import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank} from "../item-bank";
import {assembleDraftBank} from "./assemble-drafts";
import {adaptV3ForAssessment} from "./v3-adapter";
import {buildV3Facets} from "./facets";
import {applyFacetTargets} from "./facet-adapter";
import {validateAnnotationReviewDraft} from "./annotation-review";
import {AGREEMENT_TEACHING} from "./agreement-teaching";
import {reviewAgreementPathways} from "./agreement-pathway-review";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json");
const assembled=assembleDraftBank(base,artifact.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)));
const annotations=[...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"),base),...assembled.annotations];
const assessment=applyFacetTargets(adaptV3ForAssessment({artifact,bank:assembled.bank}),buildV3Facets(artifact.taxonomy),assembled.bank,annotations).assessment;
it("reserves sufficient fresh-word pools under the binary number-choice model",()=>{
 const before=checksum({assessment,bank:assembled.bank,lessons:AGREEMENT_TEACHING});
 const report=reviewAgreementPathways(assessment,assembled.bank,artifact.taxonomy,annotations,AGREEMENT_TEACHING);
 expect(report.rows).toHaveLength(4);
 for(const row of report.rows){
  expect(row).toMatchObject({eligibleQuestions:0,unapprovedCandidates:14,distinctTargetWords:14,proposedAllocationStatus:"allocated",guessingFloorValues:[.5],minimumAllCorrectItemsForGuessGate:7,releaseReady:false});
  expect(row.proposedInitialQuestions).toHaveLength(7);
  expect(row.proposedLaterQuestions).toHaveLength(7);
  const initialWords=new Set(row.proposedInitialQuestions.flatMap(id=>row.assessedMaterialKeys[id].filter(key=>key.startsWith("word:"))));
  expect(row.proposedLaterQuestions.flatMap(id=>row.assessedMaterialKeys[id]).some(key=>initialWords.has(key))).toBe(false);
  expect(row.prerequisites).toEqual(assessment.skills.find(skill=>skill.id===row.skillId)!.prerequisites);
 }
 expect(checksum({assessment,bank:assembled.bank,lessons:AGREEMENT_TEACHING})).toBe(before);
});
it("does not turn copied verb evidence into fresh words by renaming questions",()=>{
 const bank=structuredClone(assembled.bank),mapped=structuredClone(annotations);
 const entries=bank.items.filter(entry=>entry.itemKey.startsWith("v3-agreement:")&&annotations.some(annotation=>annotation.itemKey===entry.itemKey&&annotation.facetKey===AGREEMENT_TEACHING[0].facetKey));
 const original=structuredClone(entries[0].item);
 for(const [index,entry] of entries.entries()){entry.item=structuredClone(original);entry.item.promptFr+=`\nVariante de consigne ${index+1}.`;mapped.find(annotation=>annotation.itemKey===entry.itemKey)!.itemChecksum=checksum(entry);}
 const validation=validateCanonicalDiagnosticBank(bank,artifact.taxonomy);
 expect(validation.issues).toEqual([]);bank.manifest=validation.manifest;
 const report=reviewAgreementPathways({...assessment,bankChecksum:validation.manifest.checksum},bank,artifact.taxonomy,mapped,[AGREEMENT_TEACHING[0]]);
 expect(report.rows[0].distinctTargetWords).toBe(1);
 expect(report.rows[0].proposedAllocationStatus).toBe("insufficient_coverage");
 expect(()=>reviewAgreementPathways({...assessment,bankChecksum:validation.manifest.checksum},bank,artifact.taxonomy,annotations,[AGREEMENT_TEACHING[0]])).toThrow(/stale/);
});
it("excludes questions whose target verbs have already been taught",()=>{
 const lesson=structuredClone(AGREEMENT_TEACHING[0]);
 const entries=assembled.bank.items.filter(entry=>entry.itemKey.startsWith("v3-agreement:")&&annotations.some(annotation=>annotation.itemKey===entry.itemKey&&annotation.facetKey===AGREEMENT_TEACHING[0].facetKey));
 lesson.steps.push({exampleFr:entries.map(entry=>entry.item.promptFr).join("\n"),explanationFr:"Exemples montrés pour ce test."});
 lesson.materialExposure!.words!.push(...entries.map(entry=>({lemma:String(entry.item.validatorConfig!.verb),form:String(entry.item.validatorConfig!.verb)})));
 const report=reviewAgreementPathways(assessment,assembled.bank,artifact.taxonomy,annotations,[lesson]);
 expect(report.rows[0].excludedTeachingOverlapQuestionIds).toHaveLength(14);
 expect(report.rows[0].proposedAllocationStatus).toBe("insufficient_coverage");
 expect(report.rows[0].proposedLaterQuestions).toEqual([]);
});

it("rejects the earlier eight-item capacity under the binary number-choice model",()=>{
 const bank=structuredClone(assembled.bank);
 bank.items=bank.items.filter(entry=>!entry.itemKey.startsWith("v3-agreement:additional-"));
 const validation=validateCanonicalDiagnosticBank(bank,artifact.taxonomy);bank.manifest=validation.manifest;
 const report=reviewAgreementPathways({...assessment,bankChecksum:validation.manifest.checksum},bank,artifact.taxonomy,annotations,AGREEMENT_TEACHING);
 expect(report.rows.every(row=>row.proposedAllocationStatus==="insufficient_coverage"&&row.proposedLaterQuestions.length===0)).toBe(true);
});
