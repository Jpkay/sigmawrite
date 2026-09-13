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

describe.skipIf(!available)("revision 41 grammar-construction trace",()=>{
 const relative="construction_subordonnee_relative::writing-controlled-production";
 const completive="construction_subordonnee_completive::writing-controlled-production";
 const input=()=>({assessment:candidate!.assessment,activities:candidate!.activities,candidateChecksum:candidate!.checksum,
  profile:"relative_clause_known_completive_clause_weak",
  targets:[{skillId:relative,expected:"known" as const},{skillId:completive,expected:"weak" as const}]});

 it("replays both released constructions and selects the exact weak-construction lesson",()=>{
  const first=runProfileTrace(input()),second=runProfileTrace(input());
  expect(first).toEqual(second);
  expect(first.candidateChecksum).toBe("sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab");
  expect(first.passed).toBe(true);
  expect(first.contrast).toMatchObject({requireSameBranch:true,knownTargetsWithEvidence:[relative],weakTargetsWithEvidence:[completive],knownTargetsUnresolved:[],weakTargetsUnresolved:[],sameBranchBoundaries:["grammar"]});
  expect(first.trace).toHaveLength(7);expect(first.activeSeconds).toBe(210);
  expect(first.trace.map(step=>step.selectionReason)).toEqual(["step_up","confirmation","confirmation","gap_check","confirmation","confirmation","confirmation"]);
  expect(first.trace.every(step=>step.mode==="production"&&step.difficulty===.5&&step.expectedSeconds===30)).toBe(true);
  expect(first.trace.filter(step=>step.skillId===relative)).toHaveLength(4);
  expect(first.trace.filter(step=>step.skillId===completive)).toHaveLength(3);
  expect(first.trace.filter(step=>step.skillId===relative).every(step=>step.answer==="correct")).toBe(true);
  expect(first.trace.filter(step=>step.skillId===completive).every(step=>step.answer==="incorrect")).toBe(true);
  expect(first.nextActivity).toMatchObject({skillId:completive,kind:"instruction",contentId:"french-v3-teaching:completive:production",evidence:{status:"uncertain",evidence:"direct"}});
 });

 it("cannot pass when either declared construction is omitted",()=>{
  const report=runProfileTrace({...input(),stopAfterQuestions:3});
  expect(report.passed).toBe(false);
  expect(report.contrast.knownTargetsUnresolved).toEqual([relative]);
  expect(report.contrast.weakTargetsUnresolved).toEqual([]);
 });
});
