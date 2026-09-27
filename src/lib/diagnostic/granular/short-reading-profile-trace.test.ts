import {existsSync,readFileSync} from "node:fs";
import {homedir} from "node:os";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import type {LearningActivityBinding} from "./activity-plan";
import {runProfileTrace} from "./testing/profile-trace-runner";
import type {V3Assessment} from "./v3-adapter";

const source=process.env.SIGMAWRITE_REVISION_41_CANDIDATE??join(homedir(),".codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json");
const available=existsSync(source);
const candidate=available?JSON.parse(readFileSync(source,"utf8")) as {checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]}:null;

describe.skipIf(!available)("revision 41 short-reading trace",()=>{
 const explicit="localiser_information_explicite::all-receptive::text_type:narrative";
 const cause="inferer_cause_locale::all-receptive::text_type:narrative";
 const input=()=>({assessment:candidate!.assessment,activities:candidate!.activities,candidateChecksum:candidate!.checksum,
  profile:"narrative_explicit_known_local_cause_weak",requireSameBranch:false,
  targets:[{skillId:explicit,expected:"known" as const},{skillId:cause,expected:"weak" as const}]});

 it("replays literal and inferential evidence from released short narratives",()=>{
  const first=runProfileTrace(input()),second=runProfileTrace(input());
  expect(first).toEqual(second);
  expect(first.candidateChecksum).toBe("sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab");
  expect(first.passed).toBe(true);
  expect(first.contrast).toMatchObject({requireSameBranch:false,knownTargetsWithEvidence:[explicit],weakTargetsWithEvidence:[cause],knownTargetsUnresolved:[],weakTargetsUnresolved:[]});
  expect(first.contrast.sameBranchBoundaries).toEqual([]);
  expect(first.trace).toHaveLength(7);expect(first.activeSeconds).toBe(420);
  expect(first.trace.map(step=>step.selectionReason)).toEqual(["branch_coverage","branch_coverage",...Array(5).fill("confirmation")]);
  expect(first.trace.every(step=>step.mode==="interpretation"&&step.difficulty===.5&&step.expectedSeconds===60)).toBe(true);
  expect(first.trace.filter(step=>step.skillId===explicit)).toHaveLength(4);
  expect(first.trace.filter(step=>step.skillId===cause)).toHaveLength(3);
  expect(first.trace.filter(step=>step.skillId===explicit).every(step=>step.answer==="correct")).toBe(true);
  expect(first.trace.filter(step=>step.skillId===cause).every(step=>step.answer==="incorrect")).toBe(true);
  expect(first.nextActivity).toMatchObject({skillId:cause,kind:"instruction",contentId:"french-v3-teaching:reading:inferer_cause_locale:narrative",evidence:{status:"uncertain",evidence:"direct"}});
 });

 it("cannot pass when one declared reading operation is omitted",()=>{
  const report=runProfileTrace({...input(),stopAfterQuestions:4});
  expect(report.passed).toBe(false);
  expect(report.contrast.knownTargetsUnresolved).toEqual([explicit]);
  expect(report.contrast.weakTargetsUnresolved).toEqual([]);
 });
});
