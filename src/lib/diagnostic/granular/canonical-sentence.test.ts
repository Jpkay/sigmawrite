import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import type {V3Assessment} from "./v3-adapter";
import {canonicalProbeMetrics} from "./probe-metrics";
import {validateAnswer} from "@/lib/linguistic/validator";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const expansion=read("generated/french-v3-canonical-sentence-expansion.json") as {items:CanonicalDiagnosticBankItem[]};
it("accepts complete ordered sentences with or without final punctuation and rejects the supplied scrambled order",async()=>{
 for(const {item} of expansion.items.filter(e=>e.evidenceKey==="writing-controlled-production")){
  const spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig};
  expect((await validateAnswer(item.correctAnswer!,spec)).pass).toBe(true);
  expect((await validateAnswer(item.correctAnswer!.slice(0,-1),spec)).pass).toBe(true);
  const scrambled=item.promptFr.split("\n\n")[1].replaceAll(" / "," ");
  expect((await validateAnswer(scrambled,spec)).pass).toBe(false);
  expect(canonicalProbeMetrics(expansion.items.find(e=>e.item===item)!).guessProbability).toBeCloseTo(1/6);
 }
});
it("keeps genuine absent-verb examples in each recognition pool and reserves distinct production material",()=>{
 const candidate=read("docs/diagnostic/v3-parallel-review-candidate.json");
 const assessment=candidate.assessment as V3Assessment;
 for(const evidenceKey of ["reading-analysis","writing-controlled-production"]){
  const skillId=`construction_phrase_canonique::${evidenceKey}`;
  expect(candidate.teachingPrerequisiteGaps).not.toContain(skillId);
  const probes=assessment.probes.filter(p=>p.skillId===skillId);
  const initial=probes.filter(p=>p.usage==="initial"),learning=probes.filter(p=>p.usage==="learning");
  expect(initial.length).toBeGreaterThanOrEqual(8);expect(learning.length).toBeGreaterThanOrEqual(8);
  if(evidenceKey==="reading-analysis"){
   expect(initial.some(p=>p.negativeExampleAssessed)).toBe(true);
   expect(learning.some(p=>p.negativeExampleAssessed)).toBe(true);
  }
  const used=new Set(initial.flatMap(p=>p.assessedMaterialKeys??[]));
  expect(learning.flatMap(p=>p.assessedMaterialKeys??[]).filter(key=>used.has(key))).toEqual([]);
 }
 expect(expansion.items.every(e=>e.reviewStatus==="needs_human_review"&&!e.review)).toBe(true);
});
