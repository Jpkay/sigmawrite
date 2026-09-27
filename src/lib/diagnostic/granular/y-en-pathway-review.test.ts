import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {assembleDraftBank} from "./assemble-drafts";
import {adaptV3ForAssessment} from "./v3-adapter";
import {applyFacetTargets} from "./facet-adapter";
import {buildV3Facets} from "./facets";
import {Y_EN_TEACHING} from "./y-en-teaching";
import {reviewYEnPathways} from "./y-en-pathway-review";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json");
const {bank,annotations}=assembleDraftBank(base,artifact.taxonomy,[read("generated/french-v3-y-en-expansion.json")]);
const assessment=applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank,annotations).assessment;
it("keeps all five constructions and pools with reserve capacity distinct without approval",()=>{
 const before=checksum({assessment,bank,annotations,lessons:Y_EN_TEACHING});
 const report=reviewYEnPathways(assessment,bank,artifact.taxonomy,annotations,Y_EN_TEACHING);
 expect(report.rows).toHaveLength(5);
 expect(Object.keys(report.reviewedLessonChecksums)).toHaveLength(5);
 for(const row of report.rows){
  expect(row).toMatchObject({eligibleQuestions:0,unapprovedCandidates:18,distinctTargetSentences:18,excludedTeachingOverlapQuestionIds:[],guessingFloorValues:[.5],minimumAllCorrectItemsForGuessGate:7,proposedAllocationStatus:"allocated",releaseReady:false});
  expect(row.proposedInitialQuestions).toHaveLength(9);expect(row.proposedLaterQuestions).toHaveLength(9);
  expect(row.proposedLaterQuestions.some(id=>row.proposedInitialQuestions.includes(id))).toBe(false);
  expect([...row.proposedInitialQuestions,...row.proposedLaterQuestions].every(id=>annotations.find(annotation=>annotation.itemKey===id)?.facetKey===row.facetKey)).toBe(true);
  expect(row.prerequisites).toEqual(assessment.skills.find(skill=>skill.id===row.skillId)!.prerequisites);
 }
 expect(checksum({assessment,bank,annotations,lessons:Y_EN_TEACHING})).toBe(before);
});
it("excludes a source sentence taught in a different y/en lesson",()=>{
 const lessons=structuredClone(Y_EN_TEACHING);
 lessons[2].steps.push({exampleFr:"Nous allons au gymnase.",explanationFr:"Contre-exemple de provenance montré dans cette fixture."});
 lessons[2].materialExposure!.sentences!.push("Nous allons au gymnase.");
 const report=reviewYEnPathways(assessment,bank,artifact.taxonomy,annotations,lessons);
 const row=report.rows.find(row=>row.facetKey?.endsWith(":y_place"))!;
 expect(row.excludedTeachingOverlapQuestionIds).toEqual(["v3-y-en:y_place-1"]);
 expect(row.proposedAllocationStatus).toBe("allocated");
 expect(row.proposedLaterQuestions.length).toBeGreaterThanOrEqual(7);
 expect([...row.proposedInitialQuestions,...row.proposedLaterQuestions]).not.toContain("v3-y-en:y_place-1");
 expect(report.reviewedLessonChecksums[lessons[2].id]).toBe(checksum(lessons[2]));
});
it("rejects an exposure annotation not present in its lesson",()=>{
 const lessons=structuredClone(Y_EN_TEACHING);lessons[0].materialExposure!.sentences!.push("Une phrase absente du contenu.");
 expect(()=>reviewYEnPathways(assessment,bank,artifact.taxonomy,annotations,lessons)).toThrow(/anchored/);
});

it("still refuses insufficient capacity after five sentences have been exposed",()=>{
 const lessons=structuredClone(Y_EN_TEACHING);
 const sentences=bank.items.filter(entry=>entry.itemKey.startsWith("v3-y-en:y_place-")).slice(0,5).map(entry=>entry.item.promptFr.split("\n\n")[0]);
 for(const sentence of sentences){lessons[2].steps.push({exampleFr:sentence,explanationFr:"Exemple montré dans cette fixture."});lessons[2].materialExposure!.sentences!.push(sentence);}
 const row=reviewYEnPathways(assessment,bank,artifact.taxonomy,annotations,lessons).rows.find(row=>row.facetKey?.endsWith(":y_place"))!;
 expect(row.excludedTeachingOverlapQuestionIds).toHaveLength(5);
 expect(row.proposedAllocationStatus).toBe("insufficient_coverage");
});
