import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import type {V3Assessment} from "./v3-adapter";
import {AGREEMENT_ANALYSIS_DRAFTS} from "./agreement-analysis-drafts";
import {questionAssessedMaterialKeys} from "./material-annotations";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
it("uses complete subjects and real agreement violations as negative examples",()=>{
 const expansion=read("generated/french-v3-agreement-analysis-expansion.json") as {items:CanonicalDiagnosticBankItem[]};
 expect(expansion.items).toHaveLength(32);
 for(const draft of AGREEMENT_ANALYSIS_DRAFTS){
  const entry=expansion.items.find(e=>e.itemKey===`v3-agreement-analysis:${draft.key}`)!;
  expect(draft.sentence).toContain(draft.subject);
  expect(draft.sentence).toContain(draft.form);
  expect(draft.form===draft.correctForm).toBe(!draft.negative);
  const negative=entry.item.validatorConfig?.negativeExample as {excerptFr:string}|undefined;
  expect(Boolean(negative)).toBe(draft.negative);
  if(negative)expect(negative.excerptFr).toBe(draft.sentence);
  expect(entry.item.choices?.filter(c=>c.correct)).toHaveLength(1);
  expect(questionAssessedMaterialKeys(entry.item)).toHaveLength(1);
  expect(entry.reviewStatus).toBe("needs_human_review");expect(entry.review).toBeUndefined();
 }
});
it("allocates all four construction branches separately, with negative evidence and fresh follow-ups in each",()=>{
 const candidate=read("docs/diagnostic/v3-parallel-review-candidate.json");
 const assessment=candidate.assessment as V3Assessment;
 for(const construction of ["adjacent","separated","inverted","coordinated"]){
  const skillId=`construction_accord_sujet_verbe::reading-analysis::construction:${construction}`;
  expect(candidate.teachingPrerequisiteGaps).not.toContain(skillId);
  const probes=assessment.probes.filter(p=>p.skillId===skillId);
  expect(probes).toHaveLength(8);
  const initial=probes.filter(p=>p.usage==="initial"),learning=probes.filter(p=>p.usage==="learning");
  for(const pool of [initial,learning]){
   expect(pool).toHaveLength(4);expect(pool.some(p=>p.negativeExampleAssessed)).toBe(true);
  }
  const used=new Set(initial.flatMap(p=>p.assessedMaterialKeys??[]));
  expect(learning.flatMap(p=>p.assessedMaterialKeys??[]).filter(key=>used.has(key))).toEqual([]);
 }
});
