import {existsSync,readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
import type {LearningActivityBinding} from "./activity-plan";
import {selectProbe,type Observation} from "./engine";
import {runFullBudgetCounterparts} from "./testing/full-budget-counterparts";
import type {V3Assessment} from "./v3-adapter";

type PublishedBundle={sourceKind:string;releaseId:string;checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]};
const source=resolve(process.env.SIGMAWRITE_PUBLISHED_R41_BUNDLE??"tmp/published-r41-profile-bundle.json"),available=existsSync(source);
const bundle=available?JSON.parse(readFileSync(source,"utf8")) as PublishedBundle:null;
const result=available?runFullBudgetCounterparts({assessment:bundle!.assessment,activities:bundle!.activities,checksum:bundle!.checksum}):null;
const r42Source=resolve(process.env.SIGMAWRITE_PUBLISHED_R42_BUNDLE??"tmp/published-r42-profile-bundle.json"),r42Available=existsSync(r42Source);
const r42Bundle=r42Available?JSON.parse(readFileSync(r42Source,"utf8")) as PublishedBundle:null;
const r42Result=r42Available?runFullBudgetCounterparts({assessment:r42Bundle!.assessment,activities:r42Bundle!.activities,checksum:r42Bundle!.checksum}):null;
const fingerprint=(questions:string[])=>createHash("sha256").update(JSON.stringify(questions)).digest("hex");

describe.skipIf(!available)("published revision-41 full-budget counterparts",()=>{
 it("uses only the runtime-validated published source and preserves the fixed selector budget",()=>{
  expect(bundle).toMatchObject({sourceKind:"runtime_validated_published_bundle",releaseId:"ec46e0ac-94b7-425c-903b-d33a82ce0378",
   checksum:"sha256:78f22b12b00b0c4a10be18a24d5dac693059392f10472a51ad659ab3a62b817b"});
  const checks=bundle!.activities.filter(binding=>binding.kind==="independent_check");
  expect(checks).toHaveLength(360);
  expect(checks.every(binding=>binding.status==="published")).toBe(true);
  for(const profile of [result!.reverse,result!.broadStruggling]){
   expect(profile.report.activeSeconds).toBe(2100);
   expect(profile.report.ending).toMatchObject({kind:"provisional",reason:"time_budget"});
   expect(profile.report.releaseScope.officiallyResolvedCount).toBe(0);
  }
 });

 it("keeps unknowns separate from direct gaps and routes broad struggle to published foundation lessons",()=>{
  const {reverse,broadStruggling}=result!,broad=broadStruggling.summary;
  expect(broad.responseCounts).toEqual({correct:0,incorrect:61,skip:0});
  expect(broad.evidence).toMatchObject({unknownSkillCount:332,officiallyResolvedCount:0});
  expect(broad.evidence.provisionalGapSkillIds).toHaveLength(15);
  expect(broad.evidence.resolvedWithinOccasionSkillIds).toHaveLength(15);
  expect(broad.evidence.provisionalGapSkillIds.some(id=>broad.evidence.unknownSkillIds.includes(id))).toBe(false);
  expect(broad.unmetDeclaredTargetIds).toHaveLength(10);
  expect(broad.missingActivitySkillIds).toEqual([]);
  expect(broad.nextActivities).toHaveLength(5);
  expect(broad.nextActivities.every(activity=>activity.kind==="instruction"&&activity.action==="learn")).toBe(true);
  expect(broad.nextActivities.every(activity=>bundle!.activities.find(binding=>binding.id===activity.activityId)?.status==="published")).toBe(true);
  expect(broad.nextActivities.every(activity=>bundle!.assessment.skills.find(skill=>skill.id===activity.skillId)?.prerequisites.length===0)).toBe(true);
  expect(reverse.summary.evidence).toMatchObject({unknownSkillCount:335,officiallyResolvedCount:0});
  expect(reverse.summary.evidence.provisionalGapSkillIds).toHaveLength(1);
 });

 it("records the response-driven graph transitions instead of imposing profile quotas",()=>{
  const {reverse,broadStruggling}=result!;
  expect(reverse.summary.allocation.byDomain).toEqual(broadStruggling.summary.allocation.byDomain);
  expect(reverse.summary.selectionReasonCounts).toEqual({branch_coverage:17,confirmation:36,gap_check:3,step_up:5});
  expect(broadStruggling.summary.selectionReasonCounts).toEqual({branch_coverage:14,confirmation:29,gap_check:6,step_down:12});
  expect(reverse.report.trace.filter(step=>step.selectionReason==="step_up").every(step=>step.selectionTransition.axis==="graph")).toBe(true);
  expect(broadStruggling.report.trace.filter(step=>step.selectionReason==="step_down").every(step=>step.selectionTransition.axis==="graph")).toBe(true);
  expect(reverse.summary.itemDifficultyTransitions).toEqual([]);
  expect(broadStruggling.summary.itemDifficultyTransitions).toEqual([]);
  expect(fingerprint(reverse.report.trace.map(step=>step.questionId))).toBe("ec84fcc13850e06b5f5d73ac193a0ee7f607794d9075a69d34887f7cff7af8ec");
  expect(fingerprint(broadStruggling.report.trace.map(step=>step.questionId))).toBe("bc53337041869cd874ad506d733043c1ce6806eaef02bcf2d6b7dc548ae6438e");
  expect(result!.comparison).toMatchObject({questionSequenceDifferenceCount:43});
  expect(result!.comparison.branchSequenceDifferenceCount).toBeGreaterThan(0);
  expect(result!.comparison.firstDivergences[0]).toMatchObject({index:6,
   reverse:{skillId:"construction_subordonnee_completive::writing-controlled-production",selectionReason:"confirmation"},
   broadStruggling:{skillId:"construction_phrase_canonique::writing-controlled-production",selectionReason:"step_down"}});
 });
});

describe.skipIf(!r42Available)("published revision-42 transition provenance",()=>{
 it("binds the evidence to the runtime-validated release",()=>{
  expect(r42Bundle).toMatchObject({sourceKind:"runtime_validated_published_bundle",releaseId:"0ec5a711-a643-4b13-9ae1-284e7152c095",
   checksum:"sha256:32a5bde008a6505a6caf9934bcc4c93ead3edb0483ebab8f8b115f3811315a09"});
  const checks=r42Bundle!.activities.filter(binding=>binding.kind==="independent_check");
  expect(r42Bundle!.assessment.releaseScope?.assessmentSkillIds).toHaveLength(362);
  expect(checks).toHaveLength(362);
  expect(checks.every(binding=>binding.status==="published")).toBe(true);
 });

 it("records the published cause-production error as an item-difficulty descent",()=>{
  const skillId="relation_cause::writing-controlled-production";
  const skill=r42Bundle!.assessment.skills.find(candidate=>candidate.id===skillId)!;
  const probes=r42Bundle!.assessment.probes.filter(probe=>probe.skillId===skillId&&probe.usage!=="learning");
  expect(Object.fromEntries([.25,.5,.75].map(difficulty=>[difficulty,probes.filter(probe=>probe.difficulty===difficulty).length]))).toEqual({
   "0.25":3,"0.5":3,"0.75":2});
  const first=selectProbe([skill],probes,[]);
  expect(first).toMatchObject({kind:"question",item:{id:"coverage-cause-relation:C082:initial:charged-phone",difficulty:.5},
   transition:{axis:"coverage",source:null,target:{skillId,challenge:0,difficulty:.5}}});
  if(first.kind!=="question")throw Error("Expected the published core cause-production probe");
  const probe=first.item;
  const wrong:Observation={itemId:probe.id,skillId:probe.skillId,mode:probe.mode,contextId:probe.contextId,correct:false,
   guessProbability:probe.guessProbability,activeSeconds:probe.expectedSeconds,unaided:true,occasionId:"r42-transition-provenance",
   materialReceipt:{presentationId:`r42:${probe.id}`,sourceChecksum:r42Bundle!.checksum,historyComplete:true,
    firstRecordedKeys:probe.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:probe.assessedMaterialKeys}};
  expect(selectProbe([skill],probes,[wrong])).toMatchObject({kind:"question",reason:"step_down",
   item:{id:"coverage-cause-relation:C082:initial:closed-bakery",difficulty:.25},transition:{axis:"item_difficulty",
    relation:"same_skill_lower_difficulty",source:{skillId,challenge:0,difficulty:.5},target:{skillId,challenge:0,difficulty:.25}}});
 });

 it("keeps both 2,100-second profiles deterministic and reports their axes truthfully",()=>{
  const {reverse,broadStruggling}=r42Result!;
  for(const profile of [reverse,broadStruggling]){
   expect(profile.report.activeSeconds).toBe(2100);
   expect(profile.report.trace).toHaveLength(61);
   expect(profile.report.ending).toMatchObject({kind:"provisional",reason:"time_budget"});
   const challengeBySkill=new Map(r42Bundle!.assessment.skills.map(skill=>[skill.id,skill.challengeOrder??skill.level]));
   for(const [index,step] of profile.report.trace.entries()){
    expect(step.selectionTransition.target).toEqual({skillId:step.skillId,challenge:challengeBySkill.get(step.skillId),difficulty:step.difficulty});
    const transitionSource=step.selectionTransition.source;
    if(transitionSource){
     expect(transitionSource.challenge).toBe(challengeBySkill.get(transitionSource.skillId));
     expect(profile.report.trace.slice(0,index).some(previous=>previous.skillId===transitionSource.skillId
      &&previous.difficulty===transitionSource.difficulty)).toBe(true);
    }
   }
  }
  expect(reverse.summary.allocation.byDomain).toEqual(broadStruggling.summary.allocation.byDomain);
  expect(reverse.summary.selectionReasonCounts).toEqual({branch_coverage:17,confirmation:36,gap_check:3,step_up:5});
  expect(broadStruggling.summary.selectionReasonCounts).toEqual({branch_coverage:13,confirmation:27,gap_check:6,step_down:15});
  expect(reverse.report.trace.filter(step=>step.selectionReason==="step_up").every(step=>step.selectionTransition.axis==="graph"
   &&step.selectionTransition.source?.difficulty===step.selectionTransition.target.difficulty)).toBe(true);
  expect(broadStruggling.summary.itemDifficultyTransitions).toEqual([{index:20,reason:"step_down",axis:"item_difficulty",
   relation:"same_skill_lower_difficulty",source:{skillId:"relation_cause::reading-analysis",challenge:0,difficulty:.5},
   target:{skillId:"relation_cause::reading-analysis",challenge:0,difficulty:.25}}]);
  expect(fingerprint(reverse.report.trace.map(step=>step.questionId))).toBe("ec84fcc13850e06b5f5d73ac193a0ee7f607794d9075a69d34887f7cff7af8ec");
  expect(fingerprint(broadStruggling.report.trace.map(step=>step.questionId))).toBe("8583b21543d965d8b5c590adca4537ffa2ab49e01b1cf5cd48bd7209458f7ef7");
  expect(r42Result!.comparison).toMatchObject({questionSequenceDifferenceCount:43,branchSequenceDifferenceCount:18});
 });
});
