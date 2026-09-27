import {existsSync,readFileSync} from "node:fs";
import {homedir} from "node:os";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import type {LearningActivityBinding} from "./activity-plan";
import {runMixedProfileTrace} from "./testing/mixed-profile-trace";
import {REVISION_41_MIXED_TARGETS} from "./testing/revision-41-mixed-profile";
import type {V3Assessment} from "./v3-adapter";

const source=process.env.SIGMAWRITE_REVISION_41_CANDIDATE??join(homedir(),".codex/release-workspaces/sigmawrite-r41-evidence-773d3f7/docs/diagnostic/v3-scoped-review-candidate.json");
const available=existsSync(source);
const candidate=available?JSON.parse(readFileSync(source,"utf8")) as {checksum:string;assessment:V3Assessment;activities:LearningActivityBinding[]}:null;
const run=()=>runMixedProfileTrace({assessment:candidate!.assessment,activities:candidate!.activities,candidateChecksum:candidate!.checksum,
 profile:"reverse-contrasts-full-budget",targets:REVISION_41_MIXED_TARGETS});

describe.skipIf(!available)("revision 41 full-budget mixed profile trace",()=>{
 it("lets the production selector allocate the complete 2,100-second budget",()=>{
  const report=run();
  expect(report.activeSeconds).toBe(2100);
  expect(report.ending).toMatchObject({kind:"provisional",reason:"time_budget"});
  expect(Object.values(report.actualAllocation.byDomain).reduce((sum,value)=>sum+value.seconds,0)).toBe(report.activeSeconds);
  expect(Object.values(report.actualAllocation.bySamplingGroup).reduce((sum,value)=>sum+value.seconds,0)).toBe(report.activeSeconds);
  expect(Object.values(report.actualAllocation.byBranch).reduce((sum,value)=>sum+value.seconds,0)).toBe(report.activeSeconds);
 });

 it("reports every declared contrast and every released target left untested",()=>{
  const report=run();
  expect(report.declaredTargets.map(target=>({skillId:target.skillId,expected:target.expected}))).toEqual(REVISION_41_MIXED_TARGETS);
  expect(report.unmetDeclaredTargetIds).toEqual(report.declaredTargets.filter(target=>!target.withinOccasionResolved).map(target=>target.skillId));
  expect(report.releaseScope.directEvidenceSkillCount+report.releaseScope.untestedSkillCount).toBe(report.releaseScope.declaredSkillCount);
  expect(report.releaseScope.untestedSkillIds).toHaveLength(report.releaseScope.untestedSkillCount);
  expect(report.releaseScope.officiallyResolvedCount).toBe(0);
 });
});
