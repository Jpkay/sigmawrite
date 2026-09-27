import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import type {V3Assessment} from "./v3-adapter";
import {canonicalProbeMetrics} from "./probe-metrics";
import {questionAssessedMaterialKeys} from "./material-annotations";
import {contrastingErrorKeys} from "./contrasting-errors";
import {validateAnswer} from "@/lib/linguistic/validator";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
it("keeps distinct assessed words and tests actual binary answer keys without granting review",async()=>{
 const expansion=read("generated/french-v3-on-om-expansion.json") as {items:CanonicalDiagnosticBankItem[]};
 expect(expansion.items).toHaveLength(28);
 const seen=new Set<string>();
 for(const entry of expansion.items){
  const item=entry.item;
  expect(entry.reviewStatus).toBe("needs_human_review");expect(entry.review).toBeUndefined();
  expect(canonicalProbeMetrics(entry).guessProbability).toBe(.5);
  const keys=questionAssessedMaterialKeys(item);expect(keys).toHaveLength(1);
  expect(seen.has(keys[0])).toBe(false);seen.add(keys[0]);
  if(item.responseType==="mcq"){
   expect(item.choices?.filter(c=>c.correct)).toHaveLength(1);
   expect(contrastingErrorKeys(item)).toHaveLength(1);
  }else{
   const space=item.validatorConfig?.finiteResponseSpace as {alternatives:string[]};
   const spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,config:item.validatorConfig};
   expect((await validateAnswer(space.alternatives[0],spec)).pass).toBe(true);
   expect((await validateAnswer(space.alternatives[1],spec)).pass).toBe(false);
  }
 }
});
it("allocates independent new-word pools and both recognition error families",()=>{
 const candidate=read("docs/diagnostic/v3-parallel-review-candidate.json");
 const assessment=candidate.assessment as V3Assessment;
 for(const evidence of ["reading-receptive","writing-controlled-production"]){
  const skillId=`orthographier_nasale_on_om::${evidence}`;
  expect(candidate.teachingPrerequisiteGaps).not.toContain(skillId);
  const probes=assessment.probes.filter(p=>p.skillId===skillId);
  const initial=probes.filter(p=>p.usage==="initial"),learning=probes.filter(p=>p.usage==="learning");
  for(const pool of [initial,learning]){
   expect(pool.length).toBeGreaterThanOrEqual(7);
   if(evidence==="reading-receptive")expect(new Set(pool.flatMap(p=>p.contrastingErrorKeys??[])).size).toBeGreaterThanOrEqual(2);
  }
  const used=new Set(initial.flatMap(p=>p.assessedMaterialKeys??[]));
  expect(learning.flatMap(p=>p.assessedMaterialKeys??[]).filter(key=>used.has(key))).toEqual([]);
 }
});
