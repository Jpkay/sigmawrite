import {existsSync,readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
import type {LearningActivityBinding} from "./activity-plan";
import {runLearningRefinementTrace} from "./testing/learning-refinement-trace";
import {runMixedProfileTrace} from "./testing/mixed-profile-trace";
import {REVISION_41_MIXED_TARGETS} from "./testing/revision-41-mixed-profile";
import type {V3Assessment} from "./v3-adapter";

type Lesson=Parameters<typeof runLearningRefinementTrace>[0]["teachingContent"][number];
const source=resolve(process.env.SIGMAWRITE_PUBLISHED_R41_BUNDLE??"tmp/published-r41-profile-bundle.json"),available=existsSync(source);
const bundle=available?JSON.parse(readFileSync(source,"utf8")) as {sourceKind:string;releaseId:string;checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[];teachingContent:Lesson[]}:null;

describe.skipIf(!available)("published revision-41 profile traces",()=>{
 it("routes completed guided work to the exact published fresh check without changing evidence",()=>{
  const report=runLearningRefinementTrace({assessment:bundle!.assessment,activities:bundle!.activities,teachingContent:bundle!.teachingContent,
   candidateChecksum:bundle!.checksum,skillId:"orthographier_nasale_on_om::writing-controlled-production",firstLearningOccasionItems:3});
  expect(bundle).toMatchObject({sourceKind:"runtime_validated_published_bundle",releaseId:"ec46e0ac-94b7-425c-903b-d33a82ce0378",
   checksum:"sha256:78f22b12b00b0c4a10be18a24d5dac693059392f10472a51ad659ab3a62b817b"});
  const independentChecks=bundle!.activities.filter(binding=>binding.kind==="independent_check");
  expect(independentChecks).toHaveLength(360);
  expect(independentChecks.every(binding=>binding.status==="published")).toBe(true);
  expect(report.guidedLesson.evidenceAfter).toEqual(report.guidedLesson.evidenceBefore);
  expect(report.guidedLesson.nextActivity).toMatchObject({activityId:"0695008f-8cca-52d9-8baa-964b80988d54",kind:"independent_check",action:"verify"});
  expect(report.guidedLesson.missingActivitySkillIds).toEqual([]);
  expect(report.independentCheck).toMatchObject({bindingStatus:"published",deliveryAvailable:true});
 });

 it("keeps unmet mixed targets explicit while published activities remain available",()=>{
  const report=runMixedProfileTrace({assessment:bundle!.assessment,activities:bundle!.activities,candidateChecksum:bundle!.checksum,
   profile:"reverse-contrasts-full-budget",targets:REVISION_41_MIXED_TARGETS});
  expect(report.activeSeconds).toBe(2100);
  expect(report.releaseScope).toMatchObject({declaredSkillCount:360,directEvidenceSkillCount:25,untestedSkillCount:335,
   resolvedWithinOccasionCount:11,officiallyResolvedCount:0});
  expect(report.unmetDeclaredTargetIds).toHaveLength(8);
  expect(report.nextActivities).not.toHaveLength(0);
  expect(report.nextActivities.every(activity=>activity.kind==="independent_check")).toBe(true);
 });
});
