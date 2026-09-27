import {readFileSync} from "node:fs";
import {beforeAll,expect,it} from "vitest";
import {validateAnswer} from "@/lib/linguistic/validator";
import {checksum} from "@/lib/taxonomy/validate";
import type {CanonicalDiagnosticBankItem} from "../item-bank";
import {buildDiscourseRelationExpansion,type DiscourseRelationExpansion} from "./discourse-relation-expansion";
import {DISCOURSE_RELATIONS,DISCOURSE_RELATION_REVIEW,DISCOURSE_RELATION_TEACHING,RELATION_ANALYSES} from "./discourse-relation-family";
import {questionAssessedMaterialKeys,questionMaterialKeys,teachingMaterialKeys} from "./material-annotations";
import {assessesNegativeExample} from "./negative-examples";
import {canonicalProbeMetrics} from "./probe-metrics";
import {isQuestionPoolSufficient} from "./question-pools";
import {validateTeachingTargets} from "./teaching-content";
import type {V3Assessment} from "./v3-adapter";

const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const taxonomyArtifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json"),candidate=read("docs/diagnostic/v3-scoped-review-candidate.json"),registry=read("docs/diagnostic/remaining-target-goals-2026-09-13.json");
const targetIds=DISCOURSE_RELATIONS.flatMap(definition=>[`${definition.nodeKey}::reading-analysis`,`${definition.nodeKey}::writing-controlled-production`]);
let artifact:DiscourseRelationExpansion,items:CanonicalDiagnosticBankItem[];
beforeAll(async()=>{artifact=await buildDiscourseRelationExpansion(taxonomyArtifact,base);items=artifact.items;});

function assessment():V3Assessment{
 const skills=(candidate.assessment.skills as V3Assessment["skills"]).filter(skill=>targetIds.includes(skill.id));
 const annotations=new Map(artifact.annotations.map(annotation=>[annotation.itemKey,annotation])),initial=new Set(artifact.poolIntents.initial);
 return {taxonomyChecksum:candidate.assessment.taxonomyChecksum,bankChecksum:checksum(items),skills,probes:items.map(entry=>{
  const annotation=annotations.get(entry.itemKey);if(!annotation||annotation.kind!=="evidence")throw Error(`Missing evidence annotation for ${entry.itemKey}`);
  const skillId=`${annotation.evidenceTarget.nodeKey}::${annotation.evidenceTarget.evidenceKey}`,skill=skills.find(value=>value.id===skillId);if(!skill)throw Error(`Missing skill ${skillId}`);
  return {id:entry.itemKey,skillId,mode:skill.modes[0],contextId:annotation.contextKey,usage:initial.has(entry.itemKey)?"initial" as const:"learning" as const,materialKeys:questionMaterialKeys(entry.item),assessedMaterialKeys:questionAssessedMaterialKeys(entry.item),negativeExampleAssessed:assessesNegativeExample(entry.item),...canonicalProbeMetrics(entry)};
 })};
}

it("authors C083 to C090 against exact approved targets, prerequisites and evidence contracts",()=>{
 const prepared=assessment();expect(prepared.skills.map(skill=>skill.id).sort()).toEqual([...targetIds].sort());
 for(const definition of DISCOURSE_RELATIONS){
  for(const [registryId,evidenceKey] of [[definition.recognitionId,"reading-analysis"],[definition.productionId,"writing-controlled-production"]] as const){
   const tracked=registry.targets.find((target:{id:string})=>target.id===registryId),skill=prepared.skills.find(value=>value.id===`${definition.nodeKey}::${evidenceKey}`)!;
   expect(skill.prerequisites).toEqual(tracked.prerequisites);expect(skill.evidenceRequirements).toEqual(tracked.requirements);
   expect(tracked.tasks.map((task:{id:string;dependsOn:string[]})=>({id:task.id,dependsOn:task.dependsOn}))).toEqual([
    {id:`${registryId}.Q`,dependsOn:["P4.01"]},{id:`${registryId}.L`,dependsOn:["P4.01"]},{id:`${registryId}.V`,dependsOn:[`${registryId}.Q`,`${registryId}.L`,"P2.02"]},{id:`${registryId}.R`,dependsOn:[`${registryId}.V`]},{id:`${registryId}.O`,dependsOn:[`${registryId}.Q`,`${registryId}.L`]},
   ]);
  }
 }
});

it("provides sufficient recognition pools with real counterexamples for every relation",()=>{
 const prepared=assessment();
 for(const definition of DISCOURSE_RELATIONS){
  const skill=prepared.skills.find(value=>value.id===`${definition.nodeKey}::reading-analysis`)!;
  for(const usage of ["initial","learning"] as const){
   const pool=prepared.probes.filter(probe=>probe.skillId===skill.id&&probe.usage===usage);
   expect(pool).toHaveLength(6);expect(pool.filter(probe=>probe.negativeExampleAssessed)).toHaveLength(3);expect(new Set(pool.map(probe=>probe.difficulty))).toEqual(new Set([.25,.5,.75]));expect(isQuestionPoolSufficient(pool,skill,"recognition",usage==="learning")).toBe(true);
  }
  for(const entry of items.filter(value=>value.item.nodeKey===definition.nodeKey&&value.evidenceKey==="reading-analysis")){
   expect(entry.item.choices?.map(choice=>choice.text)).toEqual([...RELATION_ANALYSES]);expect(entry.item.choices?.filter(choice=>choice.correct)).toHaveLength(1);
  }
 }
});

it("provides sufficient production pools with unique assessed sentences",()=>{
 const prepared=assessment(),assessed=items.filter(entry=>entry.evidenceKey==="writing-controlled-production").flatMap(entry=>questionAssessedMaterialKeys(entry.item));
 expect(new Set(assessed).size).toBe(64);
 for(const definition of DISCOURSE_RELATIONS){
  const skill=prepared.skills.find(value=>value.id===`${definition.nodeKey}::writing-controlled-production`)!;
  for(const usage of ["initial","learning"] as const){
   const pool=prepared.probes.filter(probe=>probe.skillId===skill.id&&probe.usage===usage);
   expect(pool).toHaveLength(8);expect(new Set(pool.map(probe=>probe.difficulty))).toEqual(new Set([.25,.5,.75]));expect(pool.every(probe=>probe.guessProbability===.5)).toBe(true);expect(isQuestionPoolSufficient(pool,skill,"production",usage==="learning")).toBe(true);
  }
 }
});

it("grades only the requested controlled combination and rejects reversed order",async()=>{
 for(const entry of items.filter(value=>value.evidenceKey==="writing-controlled-production")){
  const item=entry.item,spec={validatorType:item.validatorType,correctAnswer:item.correctAnswer,acceptableAnswers:item.acceptableAnswers,config:item.validatorConfig},alternatives=item.validatorConfig?.finiteResponseSpace as {alternatives:string[]},exposure=item.validatorConfig?.materialExposure as {sentences:string[]};
  expect(exposure.sentences.slice(0,2).every(sentence=>item.promptFr.includes(sentence))).toBe(true);
  expect(exposure.sentences[2]).toBe(item.correctAnswer);
  expect(()=>questionMaterialKeys(item)).not.toThrow();
  expect((await validateAnswer(item.correctAnswer!,spec)).pass).toBe(true);expect((await validateAnswer(item.correctAnswer!.slice(0,-1),spec)).pass).toBe(true);expect((await validateAnswer(alternatives.alternatives[2],spec)).pass).toBe(false);
 }
});

it("keeps guided material disjoint and all review provenance pending",()=>{
 const prepared=assessment();expect(()=>validateTeachingTargets(prepared,DISCOURSE_RELATION_TEACHING)).not.toThrow();expect(DISCOURSE_RELATION_TEACHING).toHaveLength(8);
 const assessed=new Set(items.flatMap(entry=>questionAssessedMaterialKeys(entry.item)));
 for(const lesson of DISCOURSE_RELATION_TEACHING){expect(lesson.status).toBe("draft_requires_review");expect(lesson.steps).toHaveLength(3);expect(lesson.practice).toHaveLength(6);expect(teachingMaterialKeys(lesson).some(key=>assessed.has(key))).toBe(false);}
 expect(items).toHaveLength(112);expect(items.every(entry=>entry.reviewStatus==="needs_human_review"&&!entry.review)).toBe(true);expect(DISCOURSE_RELATION_REVIEW).toHaveLength(8);expect(DISCOURSE_RELATION_REVIEW.every(row=>row.status==="awaiting_real_review")).toBe(true);expect(artifact.claimScope).toBe("sentence_level_recognition_and_controlled_combination");
 const {checksum:recorded,...content}=artifact;expect(checksum(content)).toBe(recorded);
});
