import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {selectProbe,type Skill,type Probe,type Observation} from "./engine";
import {adaptV3ForAssessment} from "./v3-adapter";
import {applyFacetTargets} from "./facet-adapter";
import {buildV3Facets} from "./facets";
import {bindAssessmentRelease} from "./release-binding";
const nodes:Skill[]=[
 ...Array.from({length:12},(_,index)=>({id:`agreement-${index}`,branch:`agreement-${index}`,domain:"spelling",samplingGroup:"grammatical",level:0,modes:["production" as const],prerequisites:[]})),
 {id:"lexical",branch:"lexical",domain:"spelling",samplingGroup:"lexical",level:0,modes:["production"],prerequisites:[]},
 {id:"reading",branch:"reading",domain:"reading",samplingGroup:"reading",level:0,modes:["interpretation"],prerequisites:[]},
];
const bank:Probe[]=nodes.flatMap(skill=>Array.from({length:6},(_,index)=>({id:`${skill.id}-${index}`,skillId:skill.id,mode:skill.modes[0],contextId:`${skill.id}-context-${index}`,difficulty:.5,guessProbability:.05,expectedSeconds:20})));
function sample(count:number,seconds:number,skills=nodes,pool=bank){
 const observations:Observation[]=[];
 for(let index=0;index<count;index++){
  const next=selectProbe(skills,pool,observations);
  if(next.kind!=="question")throw Error("Expected fresh question");
  const prior=observations.filter(observation=>observation.skillId===next.item.skillId).length;
  observations.push({...next.item,itemId:next.item.id,correct:prior%2===0,activeSeconds:seconds,skipped:seconds===0?true:undefined});
 }
 return observations.map(observation=>skills.find(skill=>skill.id===observation.skillId)!);
}
it("samples lexical spelling despite many more grammatical branches, while preserving domain time",()=>{
 const sequence=sample(8,20);
 expect(sequence.filter(skill=>skill.domain==="reading")).toHaveLength(4);
 const spelling=sequence.filter(skill=>skill.domain==="spelling");
 expect(spelling.map(skill=>skill.samplingGroup)).toEqual(["grammatical","lexical","grammatical","lexical"]);
});
it("does not let zero-time skips starve another domain or spelling strand",()=>{
 const sequence=sample(8,0);
 expect(sequence.filter(skill=>skill.domain==="reading")).toHaveLength(4);
 expect(sequence.filter(skill=>skill.samplingGroup==="lexical")).toHaveLength(2);
});
it("continues available strands when one has no remaining question",()=>{
 const sequence=sample(4,20,nodes,bank.filter(item=>item.skillId!=="lexical"));
 expect(sequence.filter(skill=>skill.domain==="spelling")).toHaveLength(2);
 expect(sequence.some(skill=>skill.samplingGroup==="lexical")).toBe(false);
});
it("preserves each approved strand through refinement and pins sampling changes",()=>{
 const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
 const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
 const assessment=adaptV3ForAssessment({artifact,bank});
 const refined=applyFacetTargets(assessment,buildV3Facets(artifact.taxonomy),bank).assessment;
 for(const skill of refined.skills){
  expect(skill.samplingGroup).toBe(artifact.taxonomy.nodes.find((node:{key:string})=>node.key===skill.nodeKey).strand);
 }
 expect(new Set(refined.skills.filter(skill=>skill.domain==="spelling").map(skill=>skill.samplingGroup))).toEqual(new Set(["orthographe_lexicale","orthographe_grammaticale"]));
 const ids={taxonomyId:"taxonomy",bankId:"bank"};
 const changed=structuredClone(assessment);changed.skills[0].samplingGroup="different";
 expect(bindAssessmentRelease(assessment,ids).checksum).not.toBe(bindAssessmentRelease(changed,ids).checksum);
});
