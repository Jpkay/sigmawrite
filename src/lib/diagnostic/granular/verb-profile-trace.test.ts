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

describe.skipIf(!available)("revision 41 individual-verb trace",()=>{
 const etre="produire_present_indicatif::writing-controlled-production::verb:être";
 const avoir="produire_present_indicatif::writing-controlled-production::verb:avoir";
 const input=()=>({assessment:candidate!.assessment,activities:candidate!.activities,candidateChecksum:candidate!.checksum,
  profile:"present_etre_known_avoir_weak",requireSameBranch:false,
  targets:[{skillId:etre,expected:"known" as const},{skillId:avoir,expected:"weak" as const}]});

 it("replays both released verb targets and selects the exact weak-verb lesson",()=>{
  const first=runProfileTrace(input()),second=runProfileTrace(input());
  expect(first).toEqual(second);
  expect(first.candidateChecksum).toBe("sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab");
  expect(first.passed).toBe(true);
  expect(first.contrast).toMatchObject({requireSameBranch:false,knownTargetsWithEvidence:[etre],weakTargetsWithEvidence:[avoir],knownTargetsUnresolved:[],weakTargetsUnresolved:[]});
  expect(first.contrast.sameBranchBoundaries).toEqual([]);
  expect(first.trace.every(step=>step.mode==="production"&&step.difficulty===.5&&step.expectedSeconds===30)).toBe(true);
  expect(first.trace.filter(step=>step.skillId===etre).every(step=>step.answer==="correct")).toBe(true);
  expect(first.trace.filter(step=>step.skillId===avoir).every(step=>step.answer==="incorrect")).toBe(true);
  expect(first.nextActivity).toMatchObject({skillId:avoir,kind:"instruction",contentId:"french-v3-teaching:present:verb:avoir",evidence:{status:"uncertain",evidence:"direct"}});
 });

 it("cannot pass when the weak verb is omitted",()=>{
  const report=runProfileTrace({...input(),stopAfterQuestions:3});
  expect(report.passed).toBe(false);
  expect(report.contrast.knownTargetsUnresolved).toEqual([etre]);
  expect(report.contrast.weakTargetsUnresolved).toEqual([]);
 });
});
