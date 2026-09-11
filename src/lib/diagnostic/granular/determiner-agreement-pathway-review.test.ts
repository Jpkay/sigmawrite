import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {assembleDraftBank} from "./assemble-drafts";
import {adaptV3ForAssessment} from "./v3-adapter";
import {validateCanonicalDiagnosticBank} from "../item-bank";
import {assessesNegativeExample} from "./negative-examples";
import {DETERMINER_AGREEMENT_DRAFTS} from "./determiner-agreement-drafts";
import {DETERMINER_AGREEMENT_TEACHING as ALL_DETERMINER_TEACHING} from "./determiner-agreement-teaching";
const DETERMINER_AGREEMENT_TEACHING=ALL_DETERMINER_TEACHING.filter(lesson=>lesson.mode==="recognition");
import {reviewDeterminerAgreementPathways} from "./determiner-agreement-pathway-review";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json"),expansion=read("generated/french-v3-determiner-agreement-expansion.json");
const {bank,annotations}=assembleDraftBank(base,artifact.taxonomy,[expansion]);
const assessment=adaptV3ForAssessment({artifact,bank});
it("keeps recognition and counterexample evidence distinct from production or approval",()=>{
 const before=checksum({assessment,bank,annotations,lessons:DETERMINER_AGREEMENT_TEACHING});
 const row=reviewDeterminerAgreementPathways(assessment,bank,artifact.taxonomy,annotations,DETERMINER_AGREEMENT_TEACHING).rows[0];
 expect(row).toMatchObject({skillId:"construction_accord_determinant_nom::reading-analysis",unapprovedCandidates:16,proposedAllocationStatus:"allocated",releaseReady:false});
 for(const pool of [row.proposedInitialQuestions,row.proposedLaterQuestions]){
  expect(pool).toHaveLength(8);
  expect(pool.some(id=>assessesNegativeExample(bank.items.find(entry=>entry.itemKey===id)!.item))).toBe(true);
 }
 expect(new Set([...row.proposedInitialQuestions,...row.proposedLaterQuestions]).size).toBe(16);
 expect(validateCanonicalDiagnosticBank(bank,artifact.taxonomy).eligibleItemKeys.some(id=>id.startsWith("v3-determiner-agreement:"))).toBe(false);
 expect(checksum({assessment,bank,annotations,lessons:DETERMINER_AGREEMENT_TEACHING})).toBe(before);
});
it("cannot replace required counterexamples with twelve positive constructions and their wrong options",()=>{
 const lessons=structuredClone(DETERMINER_AGREEMENT_TEACHING);
 for(const draft of DETERMINER_AGREEMENT_DRAFTS.filter(draft=>draft.negative)){
  lessons[0].steps.push({exampleFr:draft.sentence,explanationFr:"Contre-exemple déjà montré."});lessons[0].materialExposure!.sentences!.push(draft.sentence);
 }
 const row=reviewDeterminerAgreementPathways(assessment,bank,artifact.taxonomy,annotations,lessons).rows[0];
 expect(row.excludedTeachingOverlapQuestionIds).toHaveLength(4);
 expect(row.proposedAllocationStatus).toBe("insufficient_coverage");
 expect(row.evidenceRequirements?.negativeExamplesRequired).toBe(true);
});
