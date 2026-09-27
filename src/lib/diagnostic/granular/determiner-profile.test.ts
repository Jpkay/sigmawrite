import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {assembleDraftBank} from "./assemble-drafts";
import {auditDeterminerProfile} from "./testing/determiner-profile-audit";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json");
const {bank}=assembleDraftBank(read("generated/diagnostic-bank-v3-draft.json"),artifact.taxonomy,[read("generated/french-v3-determiner-agreement-expansion.json"),read("generated/french-v3-determiner-production-expansion.json")]);
it.each([[true,false],[false,true]])("keeps recognition=%s and production=%s distinct and routes to the exact weaker-mode lesson",(recognition,production)=>{
 const report=auditDeterminerProfile(artifact,bank,recognition,production);
 expect(report.activeSeconds).toBeLessThanOrEqual(2100);
 for(const result of report.results){
  const mode=result.modes[0],correct=mode.mode==="recognition"?recognition:production;
  expect(mode.distinctItems).toBeGreaterThanOrEqual(3);
  expect(mode.confirmed).toBe(false);expect(mode.distinctOccasions).toBe(1);
  if(correct)expect(mode.probability).toBeGreaterThan(.85);
  else expect(mode).toMatchObject({provisionalGap:true});
 }
 const lessons=report.activities.filter(activity=>activity.kind==="instruction");
 expect(lessons).toHaveLength(1);
 expect(lessons[0].contentId).toBe(recognition?"french-v3-teaching:determiner-production":"french-v3-teaching:determiner-agreement");
 expect(report.withoutPriorEvidence.activities.some(activity=>activity.kind==="instruction")).toBe(false);
 expect(report.withoutPriorEvidence.blockedSkillIds).toContain(lessons[0].skillId);
 const updated=report.afterFreshChecks.results.find(result=>result.skillId===lessons[0].skillId)!;
 expect(updated).toMatchObject({status:"mastered",resolved:true});
 expect(updated.modes[0].distinctOccasions).toBe(2);
 expect(report.afterFreshChecks.questionIds.some(id=>report.selected.some(probe=>probe.id===id))).toBe(false);
 expect(report.afterFreshChecks.activities.some(activity=>activity.skillId===updated.skillId&&activity.kind==="instruction")).toBe(false);
 const other=report.results.find(result=>result.skillId!==updated.skillId)!;
 expect(report.afterFreshChecks.results.find(result=>result.skillId===other.skillId)).toEqual(other);
});
