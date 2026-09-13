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

describe.skipIf(!available)("revision 41 profile trace",()=>{
 const present="produire_present_indicatif::writing-controlled-production::verb:aller";
 const imperfect="produire_imparfait::writing-controlled-production::verb:aller";
 const input=()=>({assessment:candidate!.assessment,activities:candidate!.activities,candidateChecksum:candidate!.checksum,profile:"aller_present_known_imparfait_weak",targets:[{skillId:present,expected:"known" as const},{skillId:imperfect,expected:"weak" as const}]});

 it("reproduces every question and the exact weak-target activity",()=>{
  const first=runProfileTrace(input()),second=runProfileTrace(input());
  expect(first).toEqual(second);
  expect(first.candidateChecksum).toBe("sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab");
  expect(first.passed).toBe(true);
  expect(first.contrast).toMatchObject({knownTargetsWithEvidence:[present],weakTargetsWithEvidence:[imperfect],knownTargetsUnresolved:[],weakTargetsUnresolved:[],sameBranchBoundaries:["conjugation:verb:aller"]});
  expect(first.trace.every(step=>step.mode==="production"&&step.difficulty===.5&&step.expectedSeconds===30)).toBe(true);
  expect(first.trace.filter(step=>step.skillId===present).every(step=>step.answer==="correct")).toBe(true);
  expect(first.trace.filter(step=>step.skillId===imperfect).every(step=>step.answer==="incorrect")).toBe(true);
  expect(first.activeSeconds).toBe(first.trace.length*30);
  expect(first.nextActivity).toMatchObject({skillId:imperfect,kind:"instruction",contentId:"french-v3-teaching:imparfait:aller",evidence:{status:"uncertain",evidence:"direct"}});
  const presentMode=first.targetResults.find(result=>result.skillId===present)?.modes[0];
  expect(presentMode?.confirmed).toBe(false);expect(presentMode?.provisionalGap).not.toBe(true);
  expect(first.targetResults.find(result=>result.skillId===imperfect)?.modes[0]).toMatchObject({confirmed:false,provisionalGap:true});
 });

 it("fails the contrast when one declared target has no resolved evidence",()=>{
  const report=runProfileTrace({...input(),stopAfterQuestions:3});
  expect(report.passed).toBe(false);
  expect(report.contrast.weakTargetsUnresolved).toEqual([imperfect]);
 });
});
