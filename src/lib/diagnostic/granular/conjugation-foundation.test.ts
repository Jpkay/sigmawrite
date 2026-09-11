import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {checksum} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import {CONJUGATION_FOUNDATION_DRAFTS} from "./conjugation-foundation-drafts";
import type {V3Assessment} from "./v3-adapter";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
it("keeps foundation questions pending review, with unique correct options and checksum-bound mappings",()=>{
 const expansion=read("generated/french-v3-conjugation-foundation-expansion.json");
 const base=read("generated/diagnostic-bank-v3-draft.json") as CanonicalDiagnosticBankArtifact;
 const taxonomy=read("generated/french-taxonomy-v3.json").taxonomy;
 const validation=validateCanonicalDiagnosticBank({...base,manifest:undefined,items:[...base.items,...expansion.items]},taxonomy);
 expect(validation.issues).toEqual([]);
 expect(expansion.items).toHaveLength(CONJUGATION_FOUNDATION_DRAFTS.length);
 for(const entry of expansion.items){
  expect(entry.reviewStatus).toBe("needs_human_review");expect(entry.review).toBeUndefined();
  expect(validation.eligibleItemKeys).not.toContain(entry.itemKey);
  expect(expansion.annotations.find((a:{itemKey:string})=>a.itemKey===entry.itemKey).itemChecksum).toBe(checksum(entry));
 }
 for(const draft of CONJUGATION_FOUNDATION_DRAFTS)expect(new Set([draft.answer,...draft.distractors]).size).toBe(4);
});
it("provides separate initial and follow-up questions for both previously missing prerequisite targets",()=>{
 const candidate=read("docs/diagnostic/v3-parallel-review-candidate.json");
 const assessment=candidate.assessment as V3Assessment;
 for(const nodeKey of ["reconnaitre_present_indicatif","reconnaitre_radical_terminaison"]){
  const skillId=`${nodeKey}::reading-receptive`;
  expect(candidate.teachingPrerequisiteGaps).not.toContain(skillId);
  const probes=assessment.probes.filter(p=>p.skillId===skillId);
  const initial=probes.filter(p=>p.usage==="initial"),learning=probes.filter(p=>p.usage==="learning");
  expect(initial.length).toBeGreaterThanOrEqual(5);expect(learning.length).toBeGreaterThanOrEqual(5);
  const used=new Set(initial.flatMap(p=>p.assessedMaterialKeys??[]));
  expect(learning.flatMap(p=>p.assessedMaterialKeys??[]).filter(key=>used.has(key))).toEqual([]);
 }
});
