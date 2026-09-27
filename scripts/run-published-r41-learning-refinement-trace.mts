import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import type {LearningActivityBinding} from "../src/lib/diagnostic/granular/activity-plan";
import {runLearningRefinementTrace} from "../src/lib/diagnostic/granular/testing/learning-refinement-trace";
import type {V3Assessment} from "../src/lib/diagnostic/granular/v3-adapter";

type Lesson=Parameters<typeof runLearningRefinementTrace>[0]["teachingContent"][number];
const source=resolve(process.env.SIGMAWRITE_PUBLISHED_R41_BUNDLE??"tmp/published-r41-profile-bundle.json");
const output=resolve(process.argv[2]??"docs/diagnostic/published-r41-learning-refinement-trace-2026-09-13.json");
const bundle=JSON.parse(readFileSync(source,"utf8")) as {sourceKind:string;releaseId:string;checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[];teachingContent:Lesson[]};
const expectedChecksum="sha256:78f22b12b00b0c4a10be18a24d5dac693059392f10472a51ad659ab3a62b817b";
if(bundle.sourceKind!=="runtime_validated_published_bundle"||bundle.releaseId!=="ec46e0ac-94b7-425c-903b-d33a82ce0378"||bundle.checksum!==expectedChecksum)
 throw Error("Expected the runtime-validated published revision-41 bundle");
const report=runLearningRefinementTrace({assessment:bundle.assessment,activities:bundle.activities,teachingContent:bundle.teachingContent,
 candidateChecksum:bundle.checksum,skillId:"orthographier_nasale_on_om::writing-controlled-production",firstLearningOccasionItems:3});
if(report.guidedLesson.evidenceAfter.resolved||report.guidedLesson.evidenceObservationCount!==0)throw Error("Guided practice incorrectly refined diagnostic evidence");
if(!report.independentCheck.deliveryAvailable||report.independentCheck.bindingStatus!=="published")throw Error("Published revision-41 check is not deliverable");
if(report.guidedLesson.nextActivity?.activityId!==report.independentCheck.activityId)throw Error("Completed lesson did not route to its exact published check");
writeFileSync(output,`${JSON.stringify({...report,sourceArtifact:source,sourceKind:bundle.sourceKind,releaseId:bundle.releaseId},null,2)}\n`);
console.log(JSON.stringify({output,releaseId:bundle.releaseId,bundleChecksum:bundle.checksum,guidedEvidence:report.guidedLesson.evidenceAfter,
 publishedCheck:{activityId:report.independentCheck.activityId,deliveryAvailable:report.independentCheck.deliveryAvailable,
  afterFirstOccasion:report.independentCheck.afterFirstOccasion,final:report.independentCheck.finalEvidence}},null,2));
