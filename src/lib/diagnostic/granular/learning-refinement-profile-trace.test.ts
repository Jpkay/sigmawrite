import {existsSync,readFileSync} from "node:fs";
import {homedir} from "node:os";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import type {LearningActivityBinding} from "./activity-plan";
import {runLearningRefinementTrace} from "./testing/learning-refinement-trace";
import type {V3Assessment} from "./v3-adapter";

type Lesson=Parameters<typeof runLearningRefinementTrace>[0]["teachingContent"][number];
const source=process.env.SIGMAWRITE_REVISION_41_CANDIDATE??join(homedir(),".codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json");
const available=existsSync(source);
const candidate=available?JSON.parse(readFileSync(source,"utf8")) as {checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[];teachingContent:Lesson[]}:null;
const run=()=>runLearningRefinementTrace({assessment:candidate!.assessment,activities:candidate!.activities,teachingContent:candidate!.teachingContent,
 candidateChecksum:candidate!.checksum,skillId:"orthographier_nasale_on_om::writing-controlled-production",firstLearningOccasionItems:3});

describe.skipIf(!available)("revision 41 guided learning and independent refinement trace",()=>{
 it("keeps correct guided practice outside assessment evidence",()=>{
  const report=run();
  expect(report.initialDiagnostic).toMatchObject({activeSeconds:90,evidence:{status:"uncertain",resolved:false,provisionalGap:true},
   nextActivity:{activityId:"022a81f0-29de-5fc4-971c-a2e2240f9955",kind:"instruction",action:"learn",contentId:"french-v3-teaching:on-om:production"}});
  expect(report.guidedLesson.practice).toHaveLength(6);
  expect(report.guidedLesson.practice.every(step=>step.response==="correct"&&!step.evidenceObservationAdded)).toBe(true);
  expect(report.guidedLesson.evidenceObservationCount).toBe(0);
  expect(report.guidedLesson.evidenceAfter).toEqual(report.guidedLesson.evidenceBefore);
  expect(report.guidedLesson.nextActivity).toBeNull();
  expect(report.guidedLesson.missingActivitySkillIds).toEqual([report.skillId]);
 });

 it("requires fresh independent evidence across two later occasions to refine the exact target",()=>{
  const report=run();
  expect(report.independentCheck).toMatchObject({activityId:"0695008f-8cca-52d9-8baa-964b80988d54",bindingStatus:"draft",deliveryAvailable:false,
   activeSeconds:210,afterFirstOccasion:{status:"uncertain",resolved:false,distinctItems:3,distinctOccasions:1,confirmed:false},
   finalEvidence:{status:"mastered",resolved:true,distinctItems:7,distinctContexts:7,distinctOccasions:2,accuracy:1,confirmed:true}});
  expect(report.independentCheck.questions.every(step=>step.usage==="learning"&&step.guessProbability===.5&&step.expectedSeconds===30)).toBe(true);
  expect(new Set(report.independentCheck.questions.map(step=>step.occasionId))).toEqual(new Set(["learning-day:2026-09-14","learning-day:2026-09-15"]));
  expect(report.independentCheck.nextActivity).toBeNull();
  expect(report.independentCheck.missingActivitySkillIds).toEqual([]);
 });
});
