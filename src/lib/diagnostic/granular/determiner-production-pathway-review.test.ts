import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {validateAnswer,normalize} from "@/lib/linguistic/validator";
import {assembleDraftBank} from "./assemble-drafts";
import {adaptV3ForAssessment} from "./v3-adapter";
import {validateCanonicalDiagnosticBank} from "../item-bank";
import {canonicalProbeMetrics} from "./probe-metrics";
import {DETERMINER_PRODUCTION_TEACHING} from "./determiner-production-teaching";
import {reviewDeterminerProductionPathways} from "./determiner-production-pathway-review";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json"),expansion=read("generated/french-v3-determiner-production-expansion.json");
const {bank,annotations}=assembleDraftBank(base,artifact.taxonomy,[expansion]);
const assessment=adaptV3ForAssessment({artifact,bank});
it("grades the written correction, accepts apostrophe/case variants and rejects other declared forms",async()=>{
 const entries=bank.items.filter(entry=>entry.itemKey.startsWith("v3-determiner-production:"));expect(entries).toHaveLength(24);
 for(const entry of entries){
  const item=entry.item,spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig};
  expect((await validateAnswer(item.correctAnswer!.toLocaleLowerCase("fr").replaceAll("’","'"),spec)).pass).toBe(true);
  const alternatives=(item.validatorConfig!.finiteResponseSpace as {alternatives:string[]}).alternatives;
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(1/alternatives.length);
  for(const answer of alternatives.filter(answer=>normalize(answer)!==normalize(item.correctAnswer!)))expect((await validateAnswer(answer,spec)).pass).toBe(false);
 }
 expect(validateCanonicalDiagnosticBank(bank,artifact.taxonomy).eligibleItemKeys.some(id=>id.startsWith("v3-determiner-production:"))).toBe(false);
});
it("reserves fresh sentences for controlled production without borrowing recognition evidence",()=>{
 const report=reviewDeterminerProductionPathways(assessment,bank,artifact.taxonomy,annotations,DETERMINER_PRODUCTION_TEACHING),row=report.rows[0];
 expect(row).toMatchObject({skillId:"construction_accord_determinant_nom::writing-controlled-production",unapprovedCandidates:24,proposedAllocationStatus:"allocated",releaseReady:false});
 expect(row.evidenceRequirements).toMatchObject({novelSentencesRequired:true,minimumOccasions:2});
 expect(row.proposedInitialQuestions).toHaveLength(12);expect(row.proposedLaterQuestions).toHaveLength(12);
 expect(new Set([...row.proposedInitialQuestions,...row.proposedLaterQuestions]).size).toBe(24);
 const lessons=structuredClone(DETERMINER_PRODUCTION_TEACHING),sentence="Le chaises sont empilées.";
 lessons[0].steps.push({exampleFr:sentence,explanationFr:"Phrase montrée dans ce test."});lessons[0].materialExposure!.sentences!.push(sentence);
 const after=reviewDeterminerProductionPathways(assessment,bank,artifact.taxonomy,annotations,lessons).rows[0];
 expect(after.excludedTeachingOverlapQuestionIds).toContain("v3-determiner-production:defined-plural");
});
