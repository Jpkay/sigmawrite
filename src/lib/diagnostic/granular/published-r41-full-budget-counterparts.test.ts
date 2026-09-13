import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
import type {LearningActivityBinding} from "./activity-plan";
import {runFullBudgetCounterparts} from "./testing/full-budget-counterparts";
import type {V3Assessment} from "./v3-adapter";

const source=resolve(process.env.SIGMAWRITE_PUBLISHED_R41_BUNDLE??"tmp/published-r41-profile-bundle.json"),available=existsSync(source);
const bundle=available?JSON.parse(readFileSync(source,"utf8")) as {sourceKind:string;releaseId:string;checksum:string;
 assessment:V3Assessment;activities:LearningActivityBinding[]}:null;
const result=available?runFullBudgetCounterparts({assessment:bundle!.assessment,activities:bundle!.activities,checksum:bundle!.checksum}):null;

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
  expect(reverse.summary.complexityTransitions).toEqual([]);
  expect(broadStruggling.summary.complexityTransitions).toEqual([]);
  expect(result!.comparison).toMatchObject({questionSequenceDifferenceCount:43});
  expect(result!.comparison.branchSequenceDifferenceCount).toBeGreaterThan(0);
  expect(result!.comparison.firstDivergences[0]).toMatchObject({index:6,
   reverse:{skillId:"construction_subordonnee_completive::writing-controlled-production",selectionReason:"confirmation"},
   broadStruggling:{skillId:"construction_phrase_canonique::writing-controlled-production",selectionReason:"step_down"}});
 });
});
