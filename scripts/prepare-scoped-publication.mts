import {granularBankOptions} from "./lib/granular-bank-options";
import {readFileSync,writeFileSync} from "node:fs";
import {prepareParallelPublication} from "../src/lib/diagnostic/granular/publication-contract";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
import type {AssessmentBundle} from "../src/lib/diagnostic/granular/service";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const candidate=read("docs/diagnostic/v3-scoped-review-candidate.json"),artifact=read("generated/french-taxonomy-v3.json");
const {bank}=assembleDraftBank(read("generated/diagnostic-bank-v3-draft.json"),artifact.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)),granularBankOptions(process.argv.slice(2)));
// Proposed publication statuses only. This script has no database credentials or writes.
const bundle:AssessmentBundle={assessment:candidate.assessment,bank,taxonomyId:"unpublished",bankId:"unpublished",teachingContent:candidate.teachingContent,activities:candidate.activities.map((a:object)=>({...a,status:"published"}))};
const report=prepareParallelPublication(bundle);
const path="docs/diagnostic/v3-publication-preflight.json",output=JSON.stringify({...report,limitation:"Preparation only. IDs are placeholders; the publisher must revalidate with actual parent IDs and persist the exact resulting bundle checksum. No human review is recorded."},null,2)+"\n";
if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==output)throw Error("Stale publication preparation");}else writeFileSync(path,output);
console.log(JSON.stringify({ready:report.ready,assessmentTargets:report.assessmentTargets,teachingTargets:report.teachingTargets,instructionGaps:report.instructionGapSkillIds.length,freshCheckGaps:report.freshCheckGapSkillIds.length}));
