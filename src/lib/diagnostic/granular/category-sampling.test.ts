import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {canonicalProbeMetrics} from "./probe-metrics";
import {assembleDraftBank} from "./assemble-drafts";
import {adaptV3ForAssessment} from "./v3-adapter";
import {allocateQuestionPools,isQuestionPoolSufficient} from "./question-pools";
import {selectProbe,assessSkills,type Observation,type Probe} from "./engine";
import {inspectReleaseBank} from "./release-bank";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json"),expansion=read("generated/french-v3-person-number-expansion.json");
const {bank}=assembleDraftBank(base,artifact.taxonomy,[expansion]);
const assessment=adaptV3ForAssessment({artifact,bank});
const target=assessment.skills.find(skill=>skill.nodeKey==="distinguer_personne_nombre")!;
// Capacity/routing fixture only: draft questions are not promoted to eligibility.
const probes:Probe[]=expansion.items.map((entry:typeof bank.items[number])=>({id:entry.itemKey,skillId:target.id,mode:target.modes[0],contextId:entry.itemKey,...canonicalProbeMetrics(entry)}));
it("derives categories only from the complete canonical six-choice format",()=>{
 expect(new Set(probes.map(probe=>probe.samplingCategory)).size).toBe(6);
 const changed=structuredClone(expansion.items[0]);changed.item.choices[0].text="different answer";
 expect(canonicalProbeMetrics(changed).samplingCategory).toBeUndefined();
 const unrelated=structuredClone(expansion.items[0]);unrelated.item.nodeKey="identifier_sujet";
 expect(canonicalProbeMetrics(unrelated).samplingCategory).toBeUndefined();
 const bundle={bank:base,assessment:adaptV3ForAssessment({artifact,bank:base}),taxonomyId:"t",bankId:"b"};
 expect(inspectReleaseBank(bundle)).toBe(true);
 bundle.assessment.probes[0].samplingCategory="invented";expect(inspectReleaseBank(bundle)).toBe(false);
});
it("allocates two questions per category to each reserve without changing evidence rules",()=>{
 const before=JSON.stringify({assessment,probes});
 const allocated=allocateQuestionPools({...assessment,probes}).assessment;
 for(const usage of ["initial","learning"]){
  const pool=allocated.probes.filter(probe=>probe.usage===usage);
  for(const category of new Set(probes.map(probe=>probe.samplingCategory)))expect(pool.filter(probe=>probe.samplingCategory===category)).toHaveLength(2);
  expect(isQuestionPoolSufficient(pool,target,target.modes[0],usage==="learning")).toBe(true);
 }
 expect(JSON.stringify({assessment,probes})).toBe(before);
 expect(allocated.skills).toEqual(assessment.skills);
});
it("samples less-tested categories without counting skipped answers as mastery evidence",()=>{
 const skill=structuredClone(target);skill.prerequisites=[];
 // Hold the test target unresolved long enough to inspect six selections.
 skill.evidenceRequirements![skill.modes[0]]!.minimumItems=12;
 const history:Observation[]=[],categories:string[]=[];
 for(let i=0;i<6;i++){
  const next=selectProbe([skill],probes,history);expect(next.kind).toBe("question");if(next.kind!=="question")throw Error("Unexpected end");
  categories.push(next.item.samplingCategory!);
  history.push({itemId:next.item.id,skillId:skill.id,mode:next.item.mode,contextId:next.item.contextId,correct:i!==0,...(i===0?{skipped:true as const}:{}),guessProbability:next.item.guessProbability,activeSeconds:10});
 }
 expect(new Set(categories).size).toBe(6);
 expect(assessSkills([skill],history)[0].modes[0].distinctItems).toBe(5);
});
it("does not trade required evidence for category balance",()=>{
 const skill=structuredClone(target);skill.prerequisites=[];
 skill.evidenceRequirements![skill.modes[0]]!.featureRequirements=[{feature:"distinctive",minimumItems:3,minimumContexts:2}];
 const source=probes.slice(0,12).map((probe,index)=>({...probe,id:`question-${String(index).padStart(2,"0")}`,guessProbability:.05,samplingCategory:index<6?"a":"b",evidenceFeatures:index%2===0?["distinctive"]:[]}));
 const result=allocateQuestionPools({...assessment,skills:[skill],probes:source});
 expect(result.ready).toBe(true);
 for(const usage of ["initial","learning"]){
  const pool=result.assessment.probes.filter(probe=>probe.usage===usage);
  expect(pool.filter(probe=>probe.evidenceFeatures?.includes("distinctive"))).toHaveLength(3);
  expect(isQuestionPoolSufficient(pool,skill,skill.modes[0],usage==="learning")).toBe(true);
 }
});
