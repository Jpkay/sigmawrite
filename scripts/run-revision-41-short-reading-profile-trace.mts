import {readFileSync,writeFileSync} from "node:fs";
import {homedir} from "node:os";
import {join,resolve} from "node:path";
import type {LearningActivityBinding} from "../src/lib/diagnostic/granular/activity-plan";
import {runProfileTrace} from "../src/lib/diagnostic/granular/testing/profile-trace-runner";
import type {V3Assessment} from "../src/lib/diagnostic/granular/v3-adapter";

const source=resolve(process.env.SIGMAWRITE_REVISION_41_CANDIDATE??join(homedir(),".codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json"));
const output=resolve(process.argv[2]??"docs/diagnostic/revision-41-short-reading-trace-2026-09-13.json");
const candidate=JSON.parse(readFileSync(source,"utf8")) as {checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]};
const expectedChecksum="sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab";
if(candidate.checksum!==expectedChecksum)throw Error(`Expected revision-41 candidate ${expectedChecksum}, received ${candidate.checksum}`);
const base={assessment:candidate.assessment,activities:candidate.activities,candidateChecksum:candidate.checksum,requireSameBranch:false,targets:[
 {skillId:"localiser_information_explicite::all-receptive::text_type:narrative",expected:"known" as const},
 {skillId:"inferer_cause_locale::all-receptive::text_type:narrative",expected:"weak" as const},
]};
const report=runProfileTrace({...base,profile:"narrative_explicit_known_local_cause_weak"});
if(!report.passed)throw Error(`Unresolved revision-41 contrast: ${JSON.stringify(report.contrast)}`);
const omission=runProfileTrace({...base,profile:"narrative_explicit_known_local_cause_weak_omission_counterexample",stopAfterQuestions:4});
if(omission.passed)throw Error("Omitted revision-41 reading target incorrectly passed");
writeFileSync(output,`${JSON.stringify({report,omissionCounterexample:omission,sourceArtifact:source},null,2)}\n`);
console.log(JSON.stringify({output,profile:report.profile,questions:report.trace.length,activeSeconds:report.activeSeconds,
 ending:report.ending,nextActivity:report.nextActivity?.activityId,passed:report.passed,omissionPassed:omission.passed},null,2));
