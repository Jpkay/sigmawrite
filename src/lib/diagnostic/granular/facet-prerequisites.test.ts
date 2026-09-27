import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
import {adaptV3ForAssessment} from "./v3-adapter";
import {applyFacetTargets} from "./facet-adapter";
import {buildV3Facets} from "./facets";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),bank=read("generated/diagnostic-bank-v3-draft.json");
const base=adaptV3ForAssessment({artifact,bank}),facets=buildV3Facets(artifact.taxonomy);
it("uses the conjugated support verb across every near-future and recent-past facet",()=>{
 const compiled=applyFacetTargets(base,facets,bank).assessment;
 for(const [node,verb] of [["produire_futur_proche","aller"],["produire_passe_recent","venir"]]){
  const targets=compiled.skills.filter(s=>s.nodeKey===node);expect(targets.length).toBeGreaterThan(14);
  for(const target of targets){
   const present=target.prerequisites.map(id=>compiled.skills.find(s=>s.id===id)!).filter(s=>s.nodeKey==="produire_present_indicatif");
   expect(present.map(s=>s.facetKey)).toEqual([`produire_present_indicatif::verb:${verb}`]);
   expect(target.prerequisites.some(id=>id.startsWith(node.replace("produire_","reconnaitre_")))).toBe(true);
  }
 }
});
it("keeps every refined edge within its approved parent prerequisite and leaves the graph unchanged",()=>{
 const snapshot=structuredClone(base),compiled=applyFacetTargets(base,facets,bank).assessment;
 const byId=new Map(compiled.skills.map(s=>[s.id,s]));
 for(const skill of compiled.skills){
  const parent=base.skills.find(s=>s.nodeKey===skill.nodeKey&&s.evidenceKey===skill.evidenceKey)!;
  const approved=new Set(parent.prerequisites.map(id=>base.skills.find(s=>s.id===id)!.nodeKey));
  expect(new Set(skill.prerequisites.map(id=>byId.get(id)!.nodeKey))).toEqual(approved);
 }
 expect(base).toEqual(snapshot);
});
it("rejects a missing support-verb facet instead of substituting the lexical verb",()=>{
 expect(()=>applyFacetTargets(base,facets.filter(f=>f.key!=="produire_present_indicatif::verb:aller"),bank)).toThrow(/Missing construction prerequisite/);
});
