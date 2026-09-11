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
import {READING_TEACHING} from "./reading-teaching";
import {reviewReadingPathways} from "./reading-pathway-review";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json");
const assembled=assembleDraftBank(base,artifact.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)));
const annotations=[...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"),base),...assembled.annotations];
const assessment=applyFacetTargets(adaptV3ForAssessment({artifact,bank:assembled.bank}),buildV3Facets(artifact.taxonomy),assembled.bank,annotations).assessment;
it("proposes eight disjoint reading pool pairs without approving drafts or changing graph contracts",()=>{
 const before=checksum({assessment,bank:assembled.bank,lessons:READING_TEACHING});
 const report=reviewReadingPathways(assessment,assembled.bank,artifact.taxonomy,READING_TEACHING);
 expect(report.rows).toHaveLength(8);
 for(const row of report.rows){
  expect(row).toMatchObject({eligibleQuestions:0,unapprovedCandidates:8,distinctPassages:8,proposedAllocationStatus:"allocated",releaseReady:false});
  expect(row.proposedInitialQuestions.length).toBeGreaterThanOrEqual(3);expect(row.proposedLaterQuestions.length).toBeGreaterThanOrEqual(3);
  expect(row.proposedInitialQuestions.some(id=>row.proposedLaterQuestions.includes(id))).toBe(false);
  const initialContexts=row.proposedInitialQuestions.map(id=>row.passageChecksums[id]);
  expect(row.proposedLaterQuestions.some(id=>initialContexts.includes(row.passageChecksums[id]))).toBe(false);
  expect(row.prerequisites).toEqual(assessment.skills.find(skill=>skill.id===row.skillId)!.prerequisites);
 }
 expect(checksum({assessment,bank:assembled.bank,lessons:READING_TEACHING})).toBe(before);
});
it("does not manufacture text diversity from repeated passages with distinct question IDs",()=>{
 const bank=structuredClone(assembled.bank),target=READING_TEACHING[0];
 const entries=bank.items.filter(entry=>entry.itemKey.startsWith("v3-short-reading:")&&entry.item.nodeKey===target.nodeKey);
 expect(entries).toHaveLength(8);
 const repeated=structuredClone(entries[0].item);
 for(const [index,entry] of entries.entries()){
  entry.item=structuredClone(repeated);
  entry.item.promptFr+=`\nVariante de consigne ${index+1}.`;
  entry.item.validatorConfig!.sourceTextKey=entry.itemKey;
 }
 const validation=validateCanonicalDiagnosticBank(bank,artifact.taxonomy);bank.manifest=validation.manifest;
 expect(validation.issues).toEqual([]);
 const report=reviewReadingPathways({...assessment,bankChecksum:validation.manifest.checksum},bank,artifact.taxonomy,[target]);
 expect(report.rows[0].distinctPassages).toBe(1);
 expect(report.rows[0].proposedAllocationStatus).not.toBe("allocated");
});
it("rejects a passage candidate without the required source-bound support question",()=>{
 const bank=structuredClone(assembled.bank),entry=bank.items.find(entry=>entry.itemKey.startsWith("v3-short-reading:"))!;
 delete entry.item.validatorConfig!.textualSupport;
 const validation=validateCanonicalDiagnosticBank(bank,artifact.taxonomy);bank.manifest=validation.manifest;
 expect(()=>reviewReadingPathways({...assessment,bankChecksum:validation.manifest.checksum},bank,artifact.taxonomy,READING_TEACHING)).toThrow();
});

it("excludes an assessment passage already shown in another lesson",()=>{
 const lessons=structuredClone(READING_TEACHING),entry=assembled.bank.items.find(entry=>entry.itemKey==="v3-short-reading:definition-pseudonym")!;
 const passage=String((entry.item.validatorConfig!.textualSupport as {passageText:string}).passageText);
 lessons[0].steps.push({exampleFr:passage,explanationFr:"Passage montré dans cette fixture."});
 lessons[0].materialExposure!.sentences!.push(passage);
 const report=reviewReadingPathways(assessment,assembled.bank,artifact.taxonomy,lessons);
 const row=report.rows.find(row=>row.facetKey==="deduire_mot_definition_locale::text_type:informational")!;
 expect(row.excludedTeachingOverlapQuestionIds).toEqual([entry.itemKey]);
 expect([...row.proposedInitialQuestions,...row.proposedLaterQuestions]).not.toContain(entry.itemKey);
 expect(row.proposedAllocationStatus).toBe("insufficient_coverage");
 expect(report.reviewedLessonChecksums[lessons[0].id]).toBe(checksum(lessons[0]));
});
