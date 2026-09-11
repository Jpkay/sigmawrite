import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import type {V3Assessment} from "./v3-adapter";
import {AGREEMENT_CORRECTION_DRAFTS} from "./agreement-correction-drafts";
import {canonicalProbeMetrics} from "./probe-metrics";
import {validateAnswer} from "@/lib/linguistic/validator";
import {questionAssessedMaterialKeys} from "./material-annotations";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
it("accepts the corrected verb, rejects the displayed error, and retains the binary guessing floor",async()=>{
 const expansion=read("generated/french-v3-agreement-correction-expansion.json") as {items:CanonicalDiagnosticBankItem[]};
 expect(expansion.items).toHaveLength(56);
 const materials=new Set<string>();
 for(const draft of AGREEMENT_CORRECTION_DRAFTS){
  const entry=expansion.items.find(e=>e.itemKey===`v3-agreement-correction:${draft.key}`)!;
  const item=entry.item;
  expect(item.promptFr).toContain(draft.template.replace("___",draft.wrong));
  const spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,config:item.validatorConfig};
  expect((await validateAnswer(draft.correct,spec)).pass).toBe(true);
  expect((await validateAnswer(draft.wrong,spec)).pass).toBe(false);
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.5);
  const keys=questionAssessedMaterialKeys(item);expect(keys).toHaveLength(1);
  for(const key of keys){expect(materials.has(key)).toBe(false);materials.add(key);}
  expect(entry.reviewStatus).toBe("needs_human_review");expect(entry.review).toBeUndefined();
 }
});
it("reserves disjoint, sufficient production pools for each of the four agreement constructions",()=>{
 const candidate=read("docs/diagnostic/v3-parallel-review-candidate.json");
 const assessment=candidate.assessment as V3Assessment;
 for(const construction of ["adjacent","separated","inverted","coordinated"]){
  const skillId=`construction_accord_sujet_verbe::writing-controlled-production::construction:${construction}`;
  expect(candidate.teachingPrerequisiteGaps).not.toContain(skillId);
  const probes=assessment.probes.filter(p=>p.skillId===skillId);
  const initial=probes.filter(p=>p.usage==="initial"),learning=probes.filter(p=>p.usage==="learning");
  expect(initial.length).toBeGreaterThanOrEqual(7);expect(learning.length).toBeGreaterThanOrEqual(7);
  expect(candidate.poolCoverage.find((r:{skillId:string})=>r.skillId===skillId).status).toBe("allocated");
  const used=new Set(initial.flatMap(p=>p.assessedMaterialKeys??[]));
  expect(learning.flatMap(p=>p.assessedMaterialKeys??[]).filter(key=>used.has(key))).toEqual([]);
 }
});
