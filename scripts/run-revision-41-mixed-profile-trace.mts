import {readFileSync,writeFileSync} from "node:fs";
import {homedir} from "node:os";
import {join,resolve} from "node:path";
import type {LearningActivityBinding} from "../src/lib/diagnostic/granular/activity-plan";
import {runMixedProfileTrace} from "../src/lib/diagnostic/granular/testing/mixed-profile-trace";
import {REVISION_41_MIXED_TARGETS} from "../src/lib/diagnostic/granular/testing/revision-41-mixed-profile";
import type {V3Assessment} from "../src/lib/diagnostic/granular/v3-adapter";

const source=resolve(process.env.SIGMAWRITE_REVISION_41_CANDIDATE??join(homedir(),".codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json"));
const output=resolve(process.argv[2]??"docs/diagnostic/revision-41-mixed-profile-trace-2026-09-13.json");
const candidate=JSON.parse(readFileSync(source,"utf8")) as {checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]};
const expectedChecksum="sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab";
if(candidate.checksum!==expectedChecksum)throw Error(`Expected revision-41 candidate ${expectedChecksum}, received ${candidate.checksum}`);
const report=runMixedProfileTrace({assessment:candidate.assessment,activities:candidate.activities,candidateChecksum:candidate.checksum,
 profile:"reverse-contrasts-full-budget",targets:REVISION_41_MIXED_TARGETS});
if(report.activeSeconds!==2100||report.ending.kind!=="provisional"||report.ending.reason!=="time_budget")throw Error("Mixed profile did not consume the fixed budget");
if(report.declaredTargets.length!==REVISION_41_MIXED_TARGETS.length)throw Error("Mixed profile omitted a declared target");
writeFileSync(output,`${JSON.stringify({...report,sourceArtifact:source},null,2)}\n`);
console.log(JSON.stringify({output,activeSeconds:report.activeSeconds,answeredCount:report.answeredCount,skippedCount:report.skippedCount,
 actualAllocation:report.actualAllocation.byDomain,releaseScope:{...report.releaseScope,untestedSkillIds:undefined},
 declaredTargets:report.declaredTargets.map(target=>({skillId:target.skillId,expected:target.expected,questions:target.questions,withinOccasionResolved:target.withinOccasionResolved})),
 unmetDeclaredTargetIds:report.unmetDeclaredTargetIds,nextActivities:report.nextActivities},null,2));
