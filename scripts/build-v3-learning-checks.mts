import {readFileSync,writeFileSync} from "node:fs";
import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {validateAnnotationReviewDraft} from "../src/lib/diagnostic/granular/annotation-review";
import {buildLearningCheckRegistry} from "../src/lib/diagnostic/granular/check-registry";
import {allocateQuestionPools} from "../src/lib/diagnostic/granular/question-pools";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const annotations=validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"),bank);
const allocation=allocateQuestionPools(applyFacetTargets(adaptV3ForAssessment({artifact,bank}),buildV3Facets(artifact.taxonomy),bank,annotations).assessment);
const assessment=allocation.assessment;
const registry=buildLearningCheckRegistry(assessment,bank,artifact.taxonomy);
writeFileSync("generated/french-v3-assessment-candidate.json",JSON.stringify({status:"draft_requires_review",assessment,poolAllocation:allocation.coverage,readingAllocationStatus:allocation.readingAllocationStatus,readingPassageConflicts:allocation.readingPassageConflicts,poolAllocationReady:allocation.ready},null,2)+"\n");
writeFileSync("generated/french-v3-learning-checks.json",JSON.stringify(registry,null,2)+"\n");
const report={status:registry.status,usesDraftFacetAnnotations:true,checkBindings:registry.bindings.length,eligibleQuestions:assessment.probes.length,
 readingAllocationStatus:allocation.readingAllocationStatus,readingPassageConflicts:allocation.readingPassageConflicts,poolAllocationReady:allocation.ready,poolAllocation:allocation.coverage,unsupportedEvidenceItemKeys:assessment.unsupportedEvidenceItemKeys??[],
 targets:registry.coverage.length,targetsWithoutAnyEligibleProbe:registry.coverage.filter(row=>!row.eligibleQuestions).length,
 targetsWithoutAnyCheck:registry.coverage.filter(row=>!row.availableLearningQuestions).length,
 targetsMissingInitialAndLearningCapacity:registry.coverage.filter(row=>row.additionalEligibleQuestionsNeeded>0).length,
 additionalEligibleQuestionsNeeded:registry.coverage.reduce((sum,row)=>sum+row.additionalEligibleQuestionsNeeded,0),
 instructionBindings:0,practiceBindings:0,limitations:["No registry publication or copied approval", "Counts are eligible coverage gaps; existing drafts may fill gaps after review", "Targets without enough independent initial and learning pools block release", "Instruction and guided-practice bindings need exact-target content and exposure tracking"],coverage:registry.coverage};
writeFileSync("docs/diagnostic/v3-learning-check-coverage.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({...report,coverage:undefined,poolAllocation:undefined},null,2));
