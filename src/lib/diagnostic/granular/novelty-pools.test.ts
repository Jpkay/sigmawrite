import {expect,it} from "vitest";
import {allocateQuestionPools,inspectQuestionPools} from "./question-pools";
import {materialIdentity} from "./material-identity";
import type {V3Assessment,EvidenceSkill} from "./v3-adapter";
import type {Probe} from "./engine";
const skill:EvidenceSkill={id:"skill",nodeKey:"word-pattern",evidenceKey:"production",labelFr:"Orthographe",branch:"spelling",level:0,prerequisites:[],modes:["production"],evidenceRequirements:{production:{minimumItems:3,minimumContexts:2,minimumOccasions:1,minimumAccuracy:.8,unaidedRequired:true,novelWordsRequired:true}}};
function fixture():V3Assessment{
 const probes:Probe[]=Array.from({length:8},(_,i)=>({id:`q${i}`,skillId:skill.id,mode:"production",contextId:`context${i}`,difficulty:.5,expectedSeconds:20,guessProbability:.25,materialKeys:[materialIdentity("word",`mot-${i}`)]}));
 return {taxonomyChecksum:"test",bankChecksum:"test",skills:[structuredClone(skill)],probes};
}
it("does not count different question IDs as different words",()=>{
 const source=fixture();source.probes.forEach(probe=>probe.materialKeys=[materialIdentity("word","cheval")]);
 expect(allocateQuestionPools(source).ready).toBe(false);
 source.probes.forEach(probe=>delete probe.materialKeys);
 expect(allocateQuestionPools(source).ready).toBe(false);
});
it("excludes redundant inventory when enough distinct material exists for both pools",()=>{
 const source=fixture();source.probes.splice(1,0,{...source.probes[0],id:"q0-duplicate"});
 const result=allocateQuestionPools(source);
 expect(result.ready).toBe(true);
 expect(result.assessment.probes).toHaveLength(8);
 expect(result.coverage[0].excludedQuestionIds).toHaveLength(1);
 expect(source.probes).toHaveLength(9);
 expect(inspectQuestionPools(result.assessment).ok).toBe(true);
 const initial=result.assessment.probes.filter(p=>p.usage==="initial").flatMap(p=>p.materialKeys!);
 expect(result.assessment.probes.filter(p=>p.usage==="learning").flatMap(p=>p.materialKeys!).every(key=>!initial.includes(key))).toBe(true);
});
it("rejects a stored allocation that repeats material across its two pools",()=>{
 const result=allocateQuestionPools(fixture());
 const initial=result.assessment.probes.find(p=>p.usage==="initial")!;
 result.assessment.probes.find(p=>p.usage==="learning")!.materialKeys=initial.materialKeys;
 expect(inspectQuestionPools(result.assessment).ok).toBe(false);
});
it("reserves required features as well as fresh words, and reports bounded search honestly",()=>{
 const source=fixture();source.skills[0].evidenceRequirements!.production!.featureRequirements=[{feature:"exception",minimumItems:2,minimumContexts:2}];
 source.probes.forEach((p,i)=>p.evidenceFeatures=i<4?["exception"]:[]);
 // Two four-option checks are not sufficient evidence for each feature pool.
 expect(allocateQuestionPools(source).ready).toBe(false);
 source.probes.forEach(p=>p.guessProbability=.05);
 const result=allocateQuestionPools(source);
 expect(result.ready).toBe(true);
 for(const usage of ["initial","learning"])expect(result.assessment.probes.filter(p=>p.usage===usage&&p.evidenceFeatures?.includes("exception"))).toHaveLength(2);
 expect(allocateQuestionPools(source,1).coverage[0].status).toBe("search_limit");
});
it("enforces sentence novelty independently and keeps learning-only targets out of the initial pool",()=>{
 const source=fixture(),rule=source.skills[0].evidenceRequirements!.production!;
 rule.novelWordsRequired=false;rule.novelSentencesRequired=true;
 expect(allocateQuestionPools(source).ready).toBe(false);
 source.probes.forEach((p,i)=>p.materialKeys=[materialIdentity("sentence",`Phrase ${i}.`)]);
 source.skills[0].assessmentStage="learning";
 const result=allocateQuestionPools(source);
 expect(result.ready).toBe(true);
 expect(result.assessment.probes.every(p=>p.usage==="learning")).toBe(true);
});
it("allows shared context but not an assessed word exposed by another question",()=>{
 const source=fixture(),context=materialIdentity("word","voir");
 source.probes.forEach(probe=>{probe.assessedMaterialKeys=[...probe.materialKeys!];probe.materialKeys!.push(context);});
 expect(allocateQuestionPools(source).ready).toBe(true);
 source.probes[0].materialKeys!.push(source.probes[5].assessedMaterialKeys![0]);
 expect(allocateQuestionPools(source).ready).toBe(false);
});

it("retains surplus fresh material in both pools instead of discarding it after the minimum",()=>{
 const source=fixture();
 for(let index=8;index<12;index++)source.probes.push({...source.probes[0],id:`q${index}`,contextId:`context${index}`,materialKeys:[materialIdentity("word",`mot-${index}`)]});
 const before=JSON.stringify(source),result=allocateQuestionPools(source);
 expect(result.ready).toBe(true);
 expect(result.coverage[0]).toMatchObject({initialItems:6,learningItems:6,excludedQuestionIds:[]});
 expect(result.assessment.probes).toHaveLength(12);
 expect(inspectQuestionPools(result.assessment).ok).toBe(true);
 expect(allocateQuestionPools(source)).toEqual(result);
 expect(JSON.stringify(source)).toBe(before);
});
it("does not retain spare questions that expose another reserved target",()=>{
 const source=fixture();
 source.probes.forEach(probe=>probe.assessedMaterialKeys=[...probe.materialKeys!]);
 source.probes.push({...source.probes[0],id:"z-extra",contextId:"extra",materialKeys:[materialIdentity("word","nouveau"),source.probes[0].materialKeys![0]],assessedMaterialKeys:[materialIdentity("word","nouveau")]});
 const result=allocateQuestionPools(source);
 expect(result.ready).toBe(true);
 expect(result.coverage[0].excludedQuestionIds).toEqual(["z-extra"]);
 expect(result.assessment.probes).toHaveLength(8);
 expect(inspectQuestionPools(result.assessment).ok).toBe(true);
});
it("keeps every compatible fresh sentence for a learning-only target",()=>{
 const source=fixture();source.skills[0].assessmentStage="learning";
 source.skills[0].evidenceRequirements!.production!.novelWordsRequired=false;
 source.skills[0].evidenceRequirements!.production!.novelSentencesRequired=true;
 source.probes.forEach((probe,index)=>probe.materialKeys=[materialIdentity("sentence",`Un exemple différent ${index}.`)]);
 const result=allocateQuestionPools(source);
 expect(result.coverage[0]).toMatchObject({initialItems:0,learningItems:8,excludedQuestionIds:[]});
 expect(inspectQuestionPools(result.assessment).ok).toBe(true);
});
