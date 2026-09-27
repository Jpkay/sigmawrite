import {existsSync,readFileSync} from "node:fs";
import {homedir} from "node:os";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import type {LearningActivityBinding} from "./activity-plan";
import {runResponsePatternTrace,type FixedResponse} from "./testing/response-pattern-trace";
import type {V3Assessment} from "./v3-adapter";

const source=process.env.SIGMAWRITE_REVISION_41_CANDIDATE??join(homedir(),".codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json");
const available=existsSync(source);
const candidate=available?JSON.parse(readFileSync(source,"utf8")) as {checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]}:null;
const skillId="orthographier_nasale_on_om::writing-controlled-production";
const run=(profile:string,responses:FixedResponse[])=>runResponsePatternTrace({assessment:candidate!.assessment,activities:candidate!.activities,
 candidateChecksum:candidate!.checksum,profile,skillId,responses});

describe.skipIf(!available)("revision 41 guessing, skipping, and contradiction traces",()=>{
 it("does not resolve three correct binary-choice responses as knowledge",()=>{
  const report=run("three_correct_high_guess_probability",["correct","correct","correct"]);
  expect(report.activeSeconds).toBe(90);expect(report.answeredCount).toBe(3);expect(report.skippedCount).toBe(0);
  expect(report.trace.every(step=>step.guessProbability===.5&&step.expectedSeconds===30&&step.response==="correct")).toBe(true);
  expect(report.result).toMatchObject({status:"uncertain",evidence:"direct",resolved:false});
  expect(report.withinOccasionResolved).toBe(false);
  expect(report.followUp).toMatchObject({kind:"question",skillId,reason:"confirmation",guessProbability:.5});
  expect(report.nextActivity).toBeNull();expect(report.missingActivitySkillIds).toEqual([skillId]);
 });

 it("charges skipped-question time without treating exposure as evidence or a gap",()=>{
  const report=run("three_skips",["skip","skip","skip"]);
  expect(report.activeSeconds).toBe(90);expect(report.answeredCount).toBe(0);expect(report.skippedCount).toBe(3);
  expect(report.result).toMatchObject({status:"unknown",evidence:"untested",resolved:false});
  expect(report.result.modes[0].distinctItems).toBe(0);expect(report.result.modes[0].provisionalGap).not.toBe(true);
  expect(report.followUp).toMatchObject({kind:"question",skillId});
  expect(report.nextActivity).toBeNull();expect(report.missingActivitySkillIds).toEqual([skillId]);
 });

 it("keeps contradictory answers unresolved and asks a fresh question",()=>{
  const report=run("correct_incorrect_correct",["correct","incorrect","correct"]);
  expect(report.activeSeconds).toBe(90);expect(report.answeredCount).toBe(3);
  expect(report.result).toMatchObject({status:"uncertain",evidence:"direct",resolved:false});
  expect(report.result.modes[0].provisionalGap).not.toBe(true);
  expect(report.withinOccasionResolved).toBe(false);
  expect(report.followUp).toMatchObject({kind:"question",skillId,reason:"confirmation"});
  expect(report.nextActivity).toBeNull();expect(report.missingActivitySkillIds).toEqual([skillId]);
 });
});
