import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {adaptV3ForAssessment} from "./v3-adapter";
import {applyFacetTargets} from "./facet-adapter";
import {buildV3Facets} from "./facets";
import {inspectAssessmentGraph} from "./release-graph";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const base=adaptV3ForAssessment({artifact,bank});
const refined=applyFacetTargets(base,buildV3Facets(artifact.taxonomy),bank).assessment;
it("accepts the complete approved graph and its declared compiled refinements",()=>{
 expect(inspectAssessmentGraph(base.skills)).toBe(true);
 expect(inspectAssessmentGraph(refined.skills)).toBe(true);
});
it("rejects removed, injected, duplicate and cyclic prerequisites and altered challenge order",()=>{
 for(const mutation of ["removed","injected","duplicate","cycle","level"]){
  const skills=structuredClone(base.skills),target=skills.find(skill=>skill.prerequisites.length>0)!;
  if(mutation==="removed")target.prerequisites=[];
  if(mutation==="injected")target.prerequisites=[...target.prerequisites,"unrelated-skill"];
  if(mutation==="duplicate")target.prerequisites=[...target.prerequisites,target.prerequisites[0]];
  if(mutation==="cycle")target.prerequisites=[target.id];
  if(mutation==="level")target.level=0;
  expect(inspectAssessmentGraph(skills),mutation).toBe(false);
 }
});
it("rejects substituting a lexical verb for the support verb in a compound construction",()=>{
 const skills=structuredClone(refined.skills);
 const target=skills.find(skill=>skill.facetKey==="produire_futur_proche::verb:faire")!;
 const aller=skills.find(skill=>skill.facetKey==="produire_present_indicatif::verb:aller")!;
 const faire=skills.find(skill=>skill.facetKey==="produire_present_indicatif::verb:faire")!;
 expect(target.prerequisites).toContain(aller.id);
 target.prerequisites=target.prerequisites.map(id=>id===aller.id?faire.id:id);
 expect(inspectAssessmentGraph(skills)).toBe(false);
 const duplicated=structuredClone(refined.skills),multiple=duplicated.find(skill=>skill.prerequisites.length>1)!;
 multiple.prerequisites=multiple.prerequisites.map((id,index)=>index===1?multiple.prerequisites[0]:id);
 expect(inspectAssessmentGraph(duplicated)).toBe(false);
});
it("rejects unknown facets and duplicate or overlapping mastery records",()=>{
 const unknown=structuredClone(refined.skills);unknown[0].facetKey="invented-facet";
 expect(inspectAssessmentGraph(unknown)).toBe(false);
 expect(inspectAssessmentGraph([...base.skills,base.skills[0]])).toBe(false);
 expect(inspectAssessmentGraph([...base.skills,{...base.skills[0],id:"another-id"}])).toBe(false);
 const parent=base.skills.find(skill=>refined.skills.some(candidate=>candidate.nodeKey===skill.nodeKey&&candidate.facetKey))!;
 expect(inspectAssessmentGraph([...refined.skills,parent])).toBe(false);
});
