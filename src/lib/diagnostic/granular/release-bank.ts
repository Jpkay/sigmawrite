import {inspectReleaseScope} from "./release-scope";
import {assessmentQuestionIds} from "./parallel-review-policy";
import {readWritingRubric} from "./writing-rubric";
import {inspectAssessmentGraph} from "./release-graph";
import {canonicalProbeMetrics} from "./probe-metrics";
import {requiresWritingRevision} from "./writing-evidence";
import {questionMaterialKeys,questionAssessedMaterialKeys} from "./material-annotations";
import {assessesNegativeExample} from "./negative-examples";
import {contrastingErrorKeys} from "./contrasting-errors";
import {FRENCH_TAXONOMY_V3_CANDIDATE} from "@/lib/taxonomy/french-v3";
import {validateCanonicalDiagnosticBank} from "../item-bank";
import type {AssessmentBundle} from "./service";
import {readingContextId,readingTextType} from "./v3-adapter";
import {buildV3Facets} from "./facets";
import {readTextualSupport} from "./textual-support";
import {checksum} from "@/lib/taxonomy/validate";
import {materialIdentity} from "./material-identity";

// Approved release decision: docs/french-taxonomy-v3-release.md.
const APPROVED_V3_CHECKSUM="sha256:ef2b63974c580b3070c879125b23567cdf6be703c344d0365b998d1f0f14e880";

/** Canonical bank and approved-parent coverage checks. Facet approval, activity
 * coverage and calibration are separate release requirements. */
export function inspectReleaseBank(bundle:AssessmentBundle):boolean{
 try{
  if(bundle.assessment.taxonomyChecksum!==APPROVED_V3_CHECKSUM||bundle.bank.taxonomy.checksum!==APPROVED_V3_CHECKSUM||bundle.bank.taxonomy.releaseKey!=="french-taxonomy-v3")return false;
  const scope=bundle.assessment.releaseScope===undefined?undefined:inspectReleaseScope(bundle.assessment.skills,bundle.assessment.releaseScope);
  if(!inspectAssessmentGraph(bundle.assessment.skills))return false;
  if(new Set(bundle.assessment.probes.map(probe=>probe.id)).size!==bundle.assessment.probes.length)return false;
  const validated=validateCanonicalDiagnosticBank(bundle.bank,FRENCH_TAXONOMY_V3_CANDIDATE);
  if(validated.issues.length||validated.manifest.checksum!==bundle.assessment.bankChecksum)return false;
  const eligible=new Set(bundle.assessment.reviewPolicy===undefined?validated.eligibleItemKeys:assessmentQuestionIds(bundle.bank,FRENCH_TAXONOMY_V3_CANDIDATE,bundle.assessment.reviewPolicy)),items=new Map(bundle.bank.items.map(i=>[i.itemKey,i]));
  const skills=new Map(bundle.assessment.skills.map(s=>[s.id,s]));
  const readingFacets=new Set(buildV3Facets(FRENCH_TAXONOMY_V3_CANDIDATE).filter(f=>f.dimension==="text_type").map(f=>f.key));
  if(bundle.assessment.skills.some(skill=>!FRENCH_TAXONOMY_V3_CANDIDATE.nodes.some(n=>n.key===skill.nodeKey&&n.evidence.some(e=>e.key===skill.evidenceKey))))return false;
  for(const skill of bundle.assessment.skills){
   const node=FRENCH_TAXONOMY_V3_CANDIDATE.nodes.find(n=>n.key===skill.nodeKey)!;
   // Older bundles omit this routing field; new groupings must reflect the
   // approved strand rather than arbitrarily collapsing spelling coverage.
   if(skill.samplingGroup!==undefined&&skill.samplingGroup!==node.strand)return false;
   const evidence=node.evidence.find(e=>e.key===skill.evidenceKey)!,criteria=evidence.successCriteria;
   if(node.strand==="comprehension_ecrite"&&skill.facetKey&&!readingFacets.has(skill.facetKey))return false;
   const mode=evidence.expectation==="controlled_production"?"production":evidence.expectation==="independent_production"?"independent_production":node.strand==="comprehension_ecrite"?"interpretation":"recognition";
   const rule=skill.evidenceRequirements?.[mode];
   if(skill.modes.length!==1||skill.modes[0]!==mode||!rule)return false;
   if(rule.minimumItems<Number(criteria.minimumDistinctItems??criteria.minimumDistinctTexts??3)||rule.minimumOccasions<Number(criteria.minimumOccasions??2)||rule.minimumAccuracy<Number(criteria.minimumAccuracy??.8))return false;
   if(rule.minimumContexts<Number(criteria.minimumDistinctTexts??1))return false;
   if((rule.minimumEligibleTokens??0)<Number(criteria.minimumEligibleTokens??0))return false;
   if(mode==="independent_production"&&requiresWritingRevision(node.key)&&rule.revisionRequired!==true)return false;
   const genreFacet=skill.facetKey&&readingFacets.has(skill.facetKey);
   if(genreFacet){
    if((rule.minimumTextTypes??0)<1||(rule.parentMinimumTextTypes??0)<Number(criteria.minimumTextTypes??0))return false;
   }else if((rule.minimumTextTypes??0)<Number(criteria.minimumTextTypes??0))return false;
   if((rule.minimumContrastingErrors??0)<Number(criteria.minimumContrastingErrors??0))return false;
   if(criteria.negativeExamplesRequired===true&&rule.negativeExamplesRequired!==true)return false;
   if(criteria.novelWordsRequired===true&&rule.novelWordsRequired!==true)return false;
   if(criteria.novelSentencesRequired===true&&rule.novelSentencesRequired!==true)return false;
   if(criteria.evidenceSpanRequired===true&&rule.textualSupportRequired!==true)return false;
   if((criteria.unaidedResponseRequired===true||criteria.unaidedTransferRequired===true)&&!rule.unaidedRequired)return false;
   if(evidence.expectation==="independent_production"&&skill.assessmentStage!=="learning")return false;
  }
  // A small demonstration graph cannot masquerade as the complete approved graph.
  if(FRENCH_TAXONOMY_V3_CANDIDATE.nodes.some(node=>node.evidence.some(e=>!bundle.assessment.skills.some(s=>s.nodeKey===node.key&&s.evidenceKey===e.key))))return false;
  const assessedMcqSurfaces=new Set<string>();
  return bundle.assessment.probes.every(probe=>{
   if(scope&&!scope.assessmentSkillIds.has(probe.skillId))return false;
   const item=items.get(probe.id),skill=skills.get(probe.skillId);
   if(item&&skill){
    const metrics=canonicalProbeMetrics(item);
    if(probe.guessProbability!==metrics.guessProbability||probe.expectedSeconds!==metrics.expectedSeconds||probe.difficulty!==metrics.difficulty||probe.samplingCategory!==metrics.samplingCategory)return false;
    if(probe.mode==="independent_production")readWritingRubric(skill.nodeKey,item.item.validatorConfig?.writingRubric);
    if(item.sectionKey==="reading_comprehension"){
     if(probe.textType!==readingTextType(item.item.validatorConfig))return false;
     if(skill.facetKey&&readingFacets.has(skill.facetKey)&&!skill.facetKey.endsWith(`::text_type:${probe.textType}`))return false;
    }
    if(JSON.stringify([...(probe.contrastingErrorKeys??[])].sort())!==JSON.stringify(contrastingErrorKeys(item.item).sort()))return false;
    if(Boolean(probe.negativeExampleAssessed)!==assessesNegativeExample(item.item))return false;
    if(JSON.stringify([...(probe.materialKeys??[])].sort())!==JSON.stringify(questionMaterialKeys(item.item).sort()))return false;
    if(JSON.stringify([...(probe.assessedMaterialKeys??probe.materialKeys??[])].sort())!==JSON.stringify(questionAssessedMaterialKeys(item.item).sort()))return false;
    // Rewording instructions cannot make the same assessed sentence and choice
    // set independent evidence. Keep different skills or different choice sets on
    // a shared passage distinct; this is exact-duplicate detection, not a claim
    // that all other items are semantically independent.
    const sentences=questionAssessedMaterialKeys(item.item).filter(key=>key.startsWith("sentence:")).sort();
    if(item.item.responseType==="mcq"&&sentences.length){
     const identity=checksum({skillId:skill.id,mode:probe.mode,sentences,
      choices:(item.item.choices??[]).map(choice=>materialIdentity("sentence",choice.text)).sort()});
     if(assessedMcqSurfaces.has(identity))return false;
     assessedMcqSurfaces.add(identity);
    }
    const support=Boolean(readTextualSupport(item.item));
    if(Boolean(probe.textualSupportAssessed)!==support||skill.evidenceRequirements?.[probe.mode]?.textualSupportRequired&&!support)return false;
   }
   return eligible.has(probe.id)&&item&&skill&&item.item.nodeKey===skill.nodeKey&&item.evidenceKey===skill.evidenceKey&&skill.modes.includes(probe.mode)
    &&(item.sectionKey!=="reading_comprehension"||probe.contextId===readingContextId(item.item.validatorConfig,item.item.promptFr));
  });
 }catch{return false;}
}
