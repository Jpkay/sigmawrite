import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {prepareParallelPublication} from "./publication-contract";
import {assembleDraftBank} from "./assemble-drafts";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "./draft-expansion-sources";
import type {AssessmentBundle} from "./service";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const candidate=read("docs/diagnostic/v3-scoped-review-candidate.json"),artifact=read("generated/french-taxonomy-v3.json");
const {bank}=assembleDraftBank(read("generated/diagnostic-bank-v3-draft.json"),artifact.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)));
const bundle:AssessmentBundle={assessment:candidate.assessment,bank,taxonomyId:"test-taxonomy",bankId:"test-bank",teachingContent:candidate.teachingContent,activities:candidate.activities.map((a:object)=>({...a,status:"published"}))};
it("reports missing instruction rather than authorizing an incomplete pathway",()=>{
 const before=JSON.stringify(bundle),report=prepareParallelPublication(bundle);
 expect(report.instructionGapSkillIds).toEqual(candidate.missingInstructionSkillIds);
 expect(report.ready).toBe(report.instructionGapSkillIds.length===0&&report.freshCheckGapSkillIds.length===0);
 expect(report.freshCheckGapSkillIds).toEqual([]);
 expect(JSON.stringify(bundle)).toBe(before);
});
it("rejects the legacy bank and changed question provenance",()=>{
 const legacy=structuredClone(bundle);legacy.bank.bank.key="french-diagnostic-bank-v2";
 expect(()=>prepareParallelPublication(legacy)).toThrow(/restricted/);
 const changed=structuredClone(bundle);changed.bank.items[0].item.promptFr+=" changed";
 expect(()=>prepareParallelPublication(changed)).toThrow(/canonical bank/);
});
it("does not authorize a lesson without fresh bound follow-up questions",()=>{
 const missing=structuredClone(bundle);
 missing.activities=missing.activities!.filter(a=>a.kind!=="independent_check");
 const report=prepareParallelPublication(missing);
 expect(report.ready).toBe(false);
 expect(report.freshCheckGapSkillIds.length).toBeGreaterThan(0);
});
