import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import type {LearningActivityBinding} from "../src/lib/diagnostic/granular/activity-plan";
import {runFullBudgetCounterparts} from "../src/lib/diagnostic/granular/testing/full-budget-counterparts";
import type {V3Assessment} from "../src/lib/diagnostic/granular/v3-adapter";

const source=resolve(process.env.SIGMAWRITE_PUBLISHED_R41_BUNDLE??"tmp/published-r41-profile-bundle.json");
const output=resolve(process.argv[2]??"docs/diagnostic/published-r41-full-budget-counterparts-2026-09-13.json");
const bundle=JSON.parse(readFileSync(source,"utf8")) as {sourceKind:string;releaseId:string;checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]};
const expectedChecksum="sha256:78f22b12b00b0c4a10be18a24d5dac693059392f10472a51ad659ab3a62b817b";
if(bundle.sourceKind!=="runtime_validated_published_bundle"||bundle.releaseId!=="ec46e0ac-94b7-425c-903b-d33a82ce0378"||bundle.checksum!==expectedChecksum)
 throw Error("Expected the runtime-validated published revision-41 bundle");
const checks=bundle.activities.filter(binding=>binding.kind==="independent_check");
if(checks.length!==360||checks.some(binding=>binding.status!=="published"))throw Error("Expected 360 published independent-check bindings");
const result=runFullBudgetCounterparts({assessment:bundle.assessment,activities:bundle.activities,checksum:bundle.checksum});
writeFileSync(output,`${JSON.stringify({...result,sourceArtifact:source,sourceKind:bundle.sourceKind,releaseId:bundle.releaseId},null,2)}\n`);
console.log(JSON.stringify({output,releaseId:bundle.releaseId,bundleChecksum:bundle.checksum,
 reverse:result.reverse.summary,broadStruggling:result.broadStruggling.summary},null,2));
