import {readFileSync,writeFileSync} from "node:fs";
import {homedir} from "node:os";
import {join,resolve} from "node:path";
import type {LearningActivityBinding} from "../src/lib/diagnostic/granular/activity-plan";
import {runLearningRefinementTrace} from "../src/lib/diagnostic/granular/testing/learning-refinement-trace";
import type {V3Assessment} from "../src/lib/diagnostic/granular/v3-adapter";

type Lesson=Parameters<typeof runLearningRefinementTrace>[0]["teachingContent"][number];
const source=resolve(process.env.SIGMAWRITE_REVISION_41_CANDIDATE??join(homedir(),".codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json"));
const output=resolve(process.argv[2]??"docs/diagnostic/revision-41-learning-refinement-trace-2026-09-13.json");
const candidate=JSON.parse(readFileSync(source,"utf8")) as {checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[];teachingContent:Lesson[]};
const expectedChecksum="sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab";
if(candidate.checksum!==expectedChecksum)throw Error(`Expected revision-41 candidate ${expectedChecksum}, received ${candidate.checksum}`);
const report=runLearningRefinementTrace({assessment:candidate.assessment,activities:candidate.activities,teachingContent:candidate.teachingContent,
 candidateChecksum:candidate.checksum,skillId:"orthographier_nasale_on_om::writing-controlled-production",firstLearningOccasionItems:3});
if(report.guidedLesson.evidenceAfter.resolved||report.guidedLesson.evidenceObservationCount!==0)throw Error("Guided practice incorrectly refined diagnostic evidence");
if(report.independentCheck.deliveryAvailable||report.independentCheck.bindingStatus!=="draft")throw Error("Revision-41 check availability changed; review the trace scope");
if(!report.independentCheck.finalEvidence.resolved||report.independentCheck.finalEvidence.status!=="mastered")throw Error("Independent evidence did not refine the exact target");
writeFileSync(output,`${JSON.stringify({...report,sourceArtifact:source},null,2)}\n`);
console.log(JSON.stringify({output,skillId:report.skillId,guidedEvidence:report.guidedLesson.evidenceAfter,
 independentCheck:{deliveryAvailable:report.independentCheck.deliveryAvailable,afterFirstOccasion:report.independentCheck.afterFirstOccasion,final:report.independentCheck.finalEvidence}},null,2));
