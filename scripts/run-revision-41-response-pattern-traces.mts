import {readFileSync,writeFileSync} from "node:fs";
import {homedir} from "node:os";
import {join,resolve} from "node:path";
import type {LearningActivityBinding} from "../src/lib/diagnostic/granular/activity-plan";
import {runResponsePatternTrace,type FixedResponse} from "../src/lib/diagnostic/granular/testing/response-pattern-trace";
import type {V3Assessment} from "../src/lib/diagnostic/granular/v3-adapter";

const source=resolve(process.env.SIGMAWRITE_REVISION_41_CANDIDATE??join(homedir(),".codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json"));
const output=resolve(process.argv[2]??"docs/diagnostic/revision-41-response-pattern-traces-2026-09-13.json");
const candidate=JSON.parse(readFileSync(source,"utf8")) as {checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]};
const expectedChecksum="sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab";
if(candidate.checksum!==expectedChecksum)throw Error(`Expected revision-41 candidate ${expectedChecksum}, received ${candidate.checksum}`);
const skillId="orthographier_nasale_on_om::writing-controlled-production";
const patterns:Array<{profile:string;responses:FixedResponse[]}>= [
 {profile:"three_correct_high_guess_probability",responses:["correct","correct","correct"]},
 {profile:"three_skips",responses:["skip","skip","skip"]},
 {profile:"correct_incorrect_correct",responses:["correct","incorrect","correct"]},
];
const reports=patterns.map(pattern=>runResponsePatternTrace({assessment:candidate.assessment,activities:candidate.activities,
 candidateChecksum:candidate.checksum,skillId,...pattern}));
if(reports.some(report=>report.result.resolved||report.withinOccasionResolved||report.nextActivity?.kind==="instruction"))throw Error("Response-pattern matrix created a false resolution or lesson");
writeFileSync(output,`${JSON.stringify({version:"revision-41-response-pattern-matrix-v1",candidateChecksum:candidate.checksum,
 sourceArtifact:source,reports,remainingWork:["Mixed 35-minute profile across competing released branches","Separate deployed pause/resume journey","Learning-driven refinement after unresolved response patterns"]},null,2)}\n`);
console.log(JSON.stringify({output,reports:reports.map(report=>({profile:report.profile,activeSeconds:report.activeSeconds,
 status:report.result.status,withinOccasionResolved:report.withinOccasionResolved,followUp:report.followUp.kind,nextActivity:report.nextActivity}))},null,2));
