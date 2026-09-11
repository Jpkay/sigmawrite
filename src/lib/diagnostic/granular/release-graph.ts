import {conjugationFormFamily} from "./conjugation-form-family";
import {FRENCH_TAXONOMY_V3_CANDIDATE as graph} from "@/lib/taxonomy/french-v3";
import type {EvidenceSkill} from "./v3-adapter";
import {buildV3Facets} from "./facets";
import {refinedPrerequisites} from "./facet-prerequisites";
import {conjugationChallengeOrder,conjugationNodeChallengeOrder} from "./conjugation-challenge";

/** Validate the compiled graph, not merely the presence of approved node names.
 * This does not grant pedagogical approval to any draft refinement. */
export function inspectAssessmentGraph(skills:readonly EvidenceSkill[]):boolean{
 try{
  const facets=new Map(buildV3Facets(graph).map(facet=>[facet.key,facet]));
  const nodes=new Map(graph.nodes.map(node=>[node.key,node]));
  if(new Set(skills.map(skill=>skill.id)).size!==skills.length)return false;
  const slots=skills.map(skill=>JSON.stringify([skill.nodeKey,skill.evidenceKey,skill.facetKey??null]));
  if(new Set(slots).size!==slots.length)return false;
  const byEvidence=new Map<string,EvidenceSkill[]>();
  for(const skill of skills){
   const node=nodes.get(skill.nodeKey);
   if(!node?.evidence.some(evidence=>evidence.key===skill.evidenceKey))return false;
   if(skill.facetKey!==undefined&&facets.get(skill.facetKey)?.nodeKey!==skill.nodeKey)return false;
   if(skill.challengeOrder!==undefined&&skill.challengeOrder!==(skill.facetKey?conjugationChallengeOrder(facets.get(skill.facetKey)):conjugationNodeChallengeOrder(skill.nodeKey)))return false;
   if(skill.formFamily!==undefined&&skill.formFamily!==conjugationFormFamily(skill.nodeKey))return false;
   const key=JSON.stringify([skill.nodeKey,skill.evidenceKey]);
   byEvidence.set(key,[...(byEvidence.get(key)??[]),skill]);
  }
  // A parent and its refinements cannot coexist as competing mastery records.
  for(const alternatives of byEvidence.values())if(alternatives.length>1&&alternatives.some(skill=>skill.facetKey===undefined))return false;
  for(const node of graph.nodes)for(const evidence of node.evidence){
   if(!byEvidence.has(JSON.stringify([node.key,evidence.key])))return false;
  }
  const incoming=new Map(graph.nodes.map(node=>[node.key,graph.edges.filter(edge=>edge.type==="prerequisite"&&edge.prerequisiteClass==="hard"&&edge.target===node.key).map(edge=>edge.source)]));
  const levels=new Map<string,number>();
  const level=(key:string):number=>{
   if(levels.has(key))return levels.get(key)!;
   const parents=incoming.get(key)!;
   const value=parents.length?1+Math.max(...parents.map(level)):0;levels.set(key,value);return value;
  };
  for(const skill of skills){
   if(skill.level!==level(skill.nodeKey)||!Array.isArray(skill.prerequisites))return false;
   const expected=new Set(incoming.get(skill.nodeKey)!.flatMap(parent=>nodes.get(parent)!.evidence.flatMap(evidence=>
    refinedPrerequisites(skill,byEvidence.get(JSON.stringify([parent,evidence.key]))!,facets).map(prior=>prior.id))));
   if(skill.prerequisites.length!==expected.size||new Set(skill.prerequisites).size!==expected.size||skill.prerequisites.some(id=>!expected.has(id)))return false;
  }
  return true;
 }catch{return false;}
}
