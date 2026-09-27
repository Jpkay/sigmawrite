import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import type {LearningActivityBinding} from "../src/lib/diagnostic/granular/activity-plan";
import {runMixedProfileTrace} from "../src/lib/diagnostic/granular/testing/mixed-profile-trace";
import {REVISION_41_MIXED_TARGETS} from "../src/lib/diagnostic/granular/testing/revision-41-mixed-profile";
import type {V3Assessment} from "../src/lib/diagnostic/granular/v3-adapter";

const source=resolve(process.env.SIGMAWRITE_PUBLISHED_R41_BUNDLE??"tmp/published-r41-profile-bundle.json");
const output=resolve(process.argv[2]??"docs/diagnostic/published-r41-mixed-profile-trace-2026-09-13.json");
const bundle=JSON.parse(readFileSync(source,"utf8")) as {sourceKind:string;releaseId:string;checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]};
const expectedChecksum="sha256:78f22b12b00b0c4a10be18a24d5dac693059392f10472a51ad659ab3a62b817b";
if(bundle.sourceKind!=="runtime_validated_published_bundle"||bundle.releaseId!=="ec46e0ac-94b7-425c-903b-d33a82ce0378"||bundle.checksum!==expectedChecksum)
 throw Error("Expected the runtime-validated published revision-41 bundle");
const report=runMixedProfileTrace({assessment:bundle.assessment,activities:bundle.activities,candidateChecksum:bundle.checksum,
 profile:"reverse-contrasts-full-budget",targets:REVISION_41_MIXED_TARGETS});
if(report.activeSeconds!==2100||report.ending.kind!=="provisional"||report.ending.reason!=="time_budget")throw Error("Mixed profile did not consume the fixed budget");
writeFileSync(output,`${JSON.stringify({...report,sourceArtifact:source,sourceKind:bundle.sourceKind,releaseId:bundle.releaseId},null,2)}\n`);
console.log(JSON.stringify({output,releaseId:bundle.releaseId,bundleChecksum:bundle.checksum,activeSeconds:report.activeSeconds,
 actualAllocation:report.actualAllocation.byDomain,releaseScope:{...report.releaseScope,untestedSkillIds:undefined},
 unmetDeclaredTargetIds:report.unmetDeclaredTargetIds,nextActivities:report.nextActivities,missingActivityCount:report.missingActivitySkillIds.length,
 blockedSkillCount:report.blockedSkillIds.length},null,2));
