import {conjugationFormFamily} from "./conjugation-form-family";
import {refinedPrerequisites} from "./facet-prerequisites";
import {conjugationChallengeOrder,conjugationNodeChallengeOrder} from "./conjugation-challenge";
import {checksum} from "@/lib/taxonomy/validate";
import type {CanonicalDiagnosticBankArtifact} from "../item-bank";
import type {V3Assessment,EvidenceSkill} from "./v3-adapter";
import {readingContextId} from "./v3-adapter";
import {conjugationFacet,participleAgreementFacet,patternFeatureRequirements,conjugationEvidenceFeatures,type AssessmentFacet} from "./facets";
export type FacetAnnotation={itemKey:string;itemChecksum:string;facetKey:string;contextKey:string;evidenceFeatures?:string[];kind?:"facet";evidenceTarget?:never};
export type EvidenceAnnotation={itemKey:string;itemChecksum:string;contextKey:string;kind:"evidence";evidenceTarget:{nodeKey:string;evidenceKey:string};facetKey?:never;evidenceFeatures?:never};
export type TargetAnnotation=FacetAnnotation|EvidenceAnnotation;
/** An existing unrefined evidence target needs no invented facet. Conversely,
 * parent mappings cannot bypass distinctions already modeled by the catalogue. */
export function validateAnnotationTarget(annotation:TargetAnnotation,entry:CanonicalDiagnosticBankArtifact["items"][number],facets:readonly AssessmentFacet[]){
 if(annotation.kind==="evidence"){
  if(annotation.facetKey!==undefined||annotation.evidenceFeatures!==undefined||!annotation.evidenceTarget||
   annotation.evidenceTarget.nodeKey!==entry.item.nodeKey||annotation.evidenceTarget.evidenceKey!==entry.evidenceKey||
   facets.some(facet=>facet.nodeKey===entry.item.nodeKey))throw Error("Invalid or collapsed parent evidence mapping");
 }else{
  if(annotation.kind!==undefined&&annotation.kind!=="facet"||annotation.evidenceTarget!==undefined||
   !facets.some(facet=>facet.key===annotation.facetKey&&facet.nodeKey===entry.item.nodeKey))throw Error("Facet annotation targets another competency");
 }
}
/** Caller supplies the versioned, reviewed annotation set. Unknown mappings never
 * fall back to crediting the broad competency, and metadata is checked against content.
 */
export function applyFacetTargets(assessment:V3Assessment,facets:readonly AssessmentFacet[],bank:CanonicalDiagnosticBankArtifact,annotations:readonly TargetAnnotation[]=[]){
 if(new Set(facets.map(f=>f.key)).size!==facets.length)throw Error("Duplicate facet");
 const byNode=new Map<string,AssessmentFacet[]>();
 for(const facet of facets){
  if(!assessment.skills.some(s=>s.nodeKey===facet.nodeKey))throw Error(`Unknown parent ${facet.nodeKey}`);
  byNode.set(facet.nodeKey,[...(byNode.get(facet.nodeKey)??[]),facet]);
 }
 const replacements=new Map<string,EvidenceSkill[]>();
 for(const skill of assessment.skills){
  const nodeFacets=byNode.get(skill.nodeKey);
  const formFamily=conjugationFormFamily(skill.nodeKey);
  replacements.set(skill.id,nodeFacets?.map(facet=>({...skill,...(formFamily?{formFamily}:{}),id:`${skill.id}::${facet.dimension}:${facet.value}`,facetKey:facet.key,
   ...(conjugationChallengeOrder(facet)===undefined?{}:{challengeOrder:conjugationChallengeOrder(facet)}),
   labelFr:`${skill.labelFr} — ${facet.labelFr}`,
   branch:facet.dimension==="verb"||facet.dimension==="pattern"?`conjugation:${facet.dimension}:${facet.value}`:`${skill.domain}:${skill.nodeKey}`,
   evidenceRequirements:Object.fromEntries(Object.entries(skill.evidenceRequirements??{}).map(([mode,requirements])=>[mode,{...requirements,...(facet.dimension==="text_type"?{minimumTextTypes:1,parentMinimumTextTypes:requirements.minimumTextTypes??1}:{}),minimumContexts:facet.dimension==="pattern"?2:requirements.minimumContexts,featureRequirements:patternFeatureRequirements(facet)}]))
  }))??[{...skill,...(formFamily?{formFamily}:{}),...(conjugationNodeChallengeOrder(skill.nodeKey)===undefined?{}:{challengeOrder:conjugationNodeChallengeOrder(skill.nodeKey)})}]);
 }
 const skills=[...replacements.values()].flat();
 const facetByKey=new Map(facets.map(f=>[f.key,f]));
 for(const skill of skills)skill.prerequisites=skill.prerequisites.flatMap(id=>{
  const alternatives=replacements.get(id)??[];
  return refinedPrerequisites(skill,alternatives,facetByKey).map(prior=>prior.id);
 });
 const entries=new Map(bank.items.map(item=>[item.itemKey,item]));
 const annotationByItem=new Map<string,TargetAnnotation>();
 for(const annotation of annotations){
  if(annotationByItem.has(annotation.itemKey))throw Error("Multiple primary facets for one item");
  const entry=entries.get(annotation.itemKey);
  if(!entry||checksum(entry)!==annotation.itemChecksum)throw Error(`Stale facet annotation ${annotation.itemKey}`);
  if(!annotation.contextKey.trim())throw Error("Facet annotation requires a context");
  // Existing reviewed annotations identify their source by key. Accept that
  // provenance, but derive every runtime context from the actual passage below.
  if(entry.sectionKey==="reading_comprehension"&&annotation.contextKey!==`passage:${String(entry.item.validatorConfig?.sourceTextKey??"").trim()}`&&annotation.contextKey!==readingContextId(entry.item.validatorConfig,entry.item.promptFr))throw Error("Reading annotation cannot rename the source passage");
  validateAnnotationTarget(annotation,entry,facets);
  const allowedFeatures=annotation.kind==="evidence"?[]:patternFeatureRequirements(facetByKey.get(annotation.facetKey)!).map(r=>r.feature);
  if(annotation.evidenceFeatures?.some(feature=>!allowedFeatures.includes(feature)))throw Error("Undeclared evidence feature");
  annotationByItem.set(annotation.itemKey,annotation);
 }
 const unassigned:string[]=[];
 const probes=assessment.probes.flatMap(probe=>{
  const alternatives=replacements.get(probe.skillId)!;
  if(!alternatives[0].facetKey){
   const annotation=annotationByItem.get(probe.id);
   const entry=entries.get(probe.id)!;
   return [{...probe,...(annotation?{contextId:entry.sectionKey==="reading_comprehension"?readingContextId(entry.item.validatorConfig,entry.item.promptFr):annotation.contextKey}:{})}];
  }
  const entry=entries.get(probe.id);if(!entry)throw Error(`Missing bank item ${probe.id}`);
  const annotation=annotationByItem.get(probe.id);
  const config=entry.item.validatorConfig??{};
  const facetKey=annotation?.facetKey??(entry.item.validatorType==="conjugator"?(conjugationFacet(entry.item.nodeKey,config)??participleAgreementFacet(entry.item.nodeKey,config)):null);
  const target=alternatives.find(s=>s.facetKey===facetKey);
  if(!target){unassigned.push(probe.id);return[];}
  const targetFacet=facetByKey.get(target.facetKey!);
  if(targetFacet?.dimension==="text_type"&&probe.textType!==targetFacet.value)throw Error("Reading facet disagrees with source text type");
  const evidenceFeatures=annotation?.evidenceFeatures??(entry.item.validatorType==="conjugator"?conjugationEvidenceFeatures(entry.item.nodeKey,config):[]);
  return[{...probe,skillId:target.id,contextId:entry.sectionKey==="reading_comprehension"?readingContextId(entry.item.validatorConfig,entry.item.promptFr):annotation?.contextKey??`verb:${String(entry.item.validatorConfig?.verb)}`,evidenceFeatures}];
 });
 const facetChecksum=checksum({facets,annotations,skills,probes});
 return {assessment:{...assessment,skills,probes,facetChecksum},unassignedItemKeys:unassigned,
  facetChecksum,
  coverage:skills.filter(s=>s.facetKey).map(s=>({skillId:s.id,nodeKey:s.nodeKey,facetKey:s.facetKey,eligibleQuestions:probes.filter(p=>p.skillId===s.id).length}))};
}
