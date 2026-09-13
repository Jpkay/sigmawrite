import {existsSync,readFileSync} from "node:fs";
import {homedir} from "node:os";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import type {LearningActivityBinding} from "./activity-plan";
import {assessWithinOccasion,type Observation} from "./engine";
import {runProfileTrace} from "./testing/profile-trace-runner";
import type {V3Assessment} from "./v3-adapter";

const source=process.env.SIGMAWRITE_REVISION_41_CANDIDATE??join(homedir(),".codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json");
const available=existsSync(source);
const candidate=available?JSON.parse(readFileSync(source,"utf8")) as {checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]}:null;

describe.skipIf(!available)("revision 41 spelling trace",()=>{
 const onOm="orthographier_nasale_on_om::writing-controlled-production";
 const beforeMbp="appliquer_m_devant_m_b_p::writing-controlled-production";
 const input=()=>({assessment:candidate!.assessment,activities:candidate!.activities,candidateChecksum:candidate!.checksum,
  profile:"on_om_known_m_before_mbp_weak",targets:[{skillId:onOm,expected:"known" as const},{skillId:beforeMbp,expected:"weak" as const}]});

 it("replays the related released spelling targets and selects the exact weak-rule lesson",()=>{
  const first=runProfileTrace(input()),second=runProfileTrace(input());
  expect(first).toEqual(second);
  expect(first.candidateChecksum).toBe("sha256:5e1a6ce496b93e4fd5d5bafc93caa6f26b68070e0ee103218bf7127f66cac8ab");
  expect(first.passed).toBe(true);
  expect(first.contrast).toMatchObject({requireSameBranch:true,knownTargetsWithEvidence:[onOm],weakTargetsWithEvidence:[beforeMbp],knownTargetsUnresolved:[],weakTargetsUnresolved:[],sameBranchBoundaries:["spelling"]});
  expect(first.trace).toHaveLength(10);expect(first.activeSeconds).toBe(300);
  expect(first.trace.map(step=>step.selectionReason)).toEqual(["step_up","step_down",...Array(6).fill("confirmation"),"recheck_boundary","confirmation"]);
  expect(first.trace.every(step=>step.mode==="production"&&step.difficulty===.5&&step.expectedSeconds===30)).toBe(true);
  expect(first.trace.filter(step=>step.skillId===onOm)).toHaveLength(7);
  expect(first.trace.filter(step=>step.skillId===beforeMbp)).toHaveLength(3);
  expect(first.trace.filter(step=>step.skillId===onOm).every(step=>step.answer==="correct")).toBe(true);
  expect(first.trace.filter(step=>step.skillId===beforeMbp).every(step=>step.answer==="incorrect")).toBe(true);
  expect(first.nextActivity).toMatchObject({skillId:beforeMbp,kind:"instruction",contentId:"spelling-m-before-mbp",evidence:{status:"uncertain",evidence:"direct"}});
 });

 it("cannot pass when one declared spelling target is omitted",()=>{
  const report=runProfileTrace({...input(),stopAfterQuestions:8});
  expect(report.passed).toBe(false);
  expect(report.contrast.knownTargetsUnresolved).toEqual([]);
  expect(report.contrast.weakTargetsUnresolved).toEqual([beforeMbp]);
 });

 it("does not satisfy the released novel-word prerequisite with sentence-only receipts",()=>{
  const recognition="orthographier_nasale_on_om::reading-receptive";
  const skill=candidate!.assessment.skills.find(entry=>entry.id===recognition)!;
  const probes=candidate!.assessment.probes.filter(probe=>probe.skillId===recognition&&probe.usage==="initial");
  const observations=(kind:"word"|"sentence"):Observation[]=>probes.map((probe,index)=>{
   const materialKey=`${kind}:sha256:${(index+1).toString(16).padStart(64,"0")}`;
   return {itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct:true,
    guessProbability:probe.guessProbability,activeSeconds:probe.expectedSeconds,unaided:true,occasionId:"synthetic-diagnostic-day",
    contrastingErrorKeys:probe.contrastingErrorKeys,negativeExampleAssessed:probe.negativeExampleAssessed,
    materialReceipt:{presentationId:`synthetic-novelty:${kind}:${probe.id}`,sourceChecksum:"synthetic-novelty",
     historyComplete:true,firstRecordedKeys:[materialKey],previouslySeenKeys:[],assessedMaterialKeys:[materialKey]}};
  });
  const sentenceOnly=assessWithinOccasion([skill],observations("sentence"))[0];
  expect(sentenceOnly).toMatchObject({status:"unknown",evidence:"untested",resolved:false});
  const wordEvidence=assessWithinOccasion([skill],observations("word"))[0];
  expect(wordEvidence).toMatchObject({status:"mastered",evidence:"direct",resolved:true});
 });
});
