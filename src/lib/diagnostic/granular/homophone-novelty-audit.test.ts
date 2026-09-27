import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {adaptV3ForAssessment} from "./v3-adapter";
import {auditHomophoneNovelty} from "./homophone-novelty-audit";
it("demonstrates the fixed-pair novelty conflict without changing the approved assessment",()=>{
 const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
 const assessment=adaptV3ForAssessment({artifact:read("generated/french-taxonomy-v3.json"),bank:read("generated/diagnostic-bank-v3-draft.json")});
 const before=JSON.stringify(assessment),audit=auditHomophoneNovelty(assessment);
 expect(audit).toHaveLength(14);expect(new Set(audit.map(row=>row.nodeKey)).size).toBe(7);
 for(const row of audit){
  expect(row.currentRequirements.novelWordsRequired).toBe(true);
  expect(row.minimumItems).toBeGreaterThan(row.distinctTargetWords);
  expect(row.currentPoolsReady).toBe(false);expect(row.proposedPoolsReady).toBe(true);
  expect(row.proposedRequirements).toEqual({...row.currentRequirements,novelWordsRequired:false,novelSentencesRequired:true});
 }
 expect(JSON.stringify(assessment)).toBe(before);
});
