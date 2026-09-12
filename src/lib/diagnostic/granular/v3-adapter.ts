import {applyWrittenSyllableCoverage} from "./written-syllable-coverage";
import {applyPhonemeGraphieCoverage} from "./phoneme-graphie-coverage";
import type {ReleaseScope} from "./release-scope";
import {assessmentQuestionIds,type ParallelReviewPolicy} from "./parallel-review-policy";
import {requiresWritingRevision} from "./writing-evidence";
import {canonicalProbeMetrics} from "./probe-metrics";
import {questionMaterialKeys,questionAssessedMaterialKeys} from "./material-annotations";
import {assessesNegativeExample} from "./negative-examples";
import {contrastingErrorKeys} from "./contrasting-errors";
import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import {sectionForStrand} from "../protocol";
import type { buildFrenchTaxonomyV3 } from "@/lib/taxonomy/french-v3";
import type {Mode,Probe,Skill,SkillResult} from "./engine";
import {readTextualSupport} from "./textual-support";
import {splitExercisePrompt} from "@/lib/content/exercise-prompt";
export type EvidenceSkill=Skill & {nodeKey:string;evidenceKey:string;labelFr:string;facetKey?:string};
export type V3Assessment={skills:EvidenceSkill[];probes:Probe[];taxonomyChecksum:string;bankChecksum:string;facetChecksum?:string;poolChecksum?:string;unsupportedEvidenceItemKeys?:string[];reviewPolicy?:ParallelReviewPolicy;releaseScope?:ReleaseScope};

/** Several questions or source IDs for identical text remain one context.
 * Source IDs retain provenance; they cannot manufacture independent texts. */
export function readingPassageText(config:Record<string,unknown>|undefined,promptFr?:string):string{
 const key=config?.sourceTextKey;
 if(typeof key!=="string"||!key.trim())throw Error("Reading evidence requires a source passage identity");
 const support=config?.textualSupport;
 const passage=support&&typeof support==="object"&&"passageText" in support?support.passageText:promptFr?splitExercisePrompt(promptFr).passage.join("\n\n"):undefined;
 if(typeof passage!=="string"||!passage.trim())throw Error("Reading evidence requires source passage content");
 return passage;
}
export function readingContextId(config:Record<string,unknown>|undefined,promptFr?:string):string{
 return `passage-content:${checksum(readingPassageText(config,promptFr).normalize("NFC").replace(/\s+/g," ").trim())}`;
}

/** Canonical genre identity comes from reviewed item content, never client input. */
export function readingTextType(config:Record<string,unknown>|undefined):string|undefined{
 const type=config?.sourceTextType;
 return type==="literary"||type==="narrative"?"narrative":type==="informational"||type==="argumentative"?type:undefined;
}

/** Compile the approved graph's evidence contracts; never reinterpret a sample graph as curriculum.
 * Publication and authentication remain the responsibility of the persistence adapter.
 */
export function adaptV3ForAssessment(input:{artifact:ReturnType<typeof buildFrenchTaxonomyV3>;bank:CanonicalDiagnosticBankArtifact;reviewPolicy?:ParallelReviewPolicy}):V3Assessment {
 const {manifest,...content}=input.artifact;
 if(checksum(content)!==manifest.contentChecksum)throw Error("Taxonomy content checksum mismatch");
 const taxonomy:TaxonomyCandidate=input.artifact.taxonomy;
 const taxonomyChecksum=manifest.contentChecksum;
 if(input.bank.taxonomy.releaseKey!=="french-taxonomy-v3"||input.bank.taxonomy.checksum!==taxonomyChecksum)throw Error("Mismatched taxonomy release");
 const validated=validateCanonicalDiagnosticBank(input.bank,taxonomy);
 if(validated.issues.length)throw Error(`Invalid assessment bank: ${validated.issues.join("; ")}`);
 if(input.bank.manifest&&input.bank.manifest.checksum!==validated.manifest.checksum)throw Error("Bank checksum mismatch");
 const eligible=new Set(input.reviewPolicy===undefined?validated.eligibleItemKeys:assessmentQuestionIds(input.bank,taxonomy,input.reviewPolicy));
 const skills:EvidenceSkill[]=taxonomy.nodes.flatMap(node=>node.evidence.map(e=>{
  const mode:Mode=e.expectation==="independent_production"?"independent_production":e.expectation==="controlled_production"?"production":node.strand==="comprehension_ecrite"?"interpretation":"recognition";
  const criteria=e.successCriteria;
  return {id:`${node.key}::${e.key}`,nodeKey:node.key,evidenceKey:e.key,labelFr:node.labelFr,
   domain:sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0])!,branch:sectionForStrand(node.strand as Parameters<typeof sectionForStrand>[0])!,
   samplingGroup:node.strand,
   // The approved graph supplies challenge order, not school-grade ceilings.
   level:0,prerequisites:[],modes:[mode],assessmentStage:e.expectation==="independent_production"?"learning":"initial",
   evidenceRequirements:{[mode]:{minimumItems:Number(criteria.minimumDistinctItems??criteria.minimumDistinctTexts??3),minimumContexts:Number(criteria.minimumDistinctTexts??1),
    minimumOccasions:Number(criteria.minimumOccasions??2),minimumAccuracy:Number(criteria.minimumAccuracy??.8),
    textualSupportRequired:criteria.evidenceSpanRequired===true,
    minimumTextTypes:Number(criteria.minimumTextTypes??0),
    minimumEligibleTokens:Number(criteria.minimumEligibleTokens??0),
    revisionRequired:mode==="independent_production"&&requiresWritingRevision(node.key),
    minimumContrastingErrors:Number(criteria.minimumContrastingErrors??0),
    negativeExamplesRequired:criteria.negativeExamplesRequired===true,
    novelWordsRequired:criteria.novelWordsRequired===true,novelSentencesRequired:criteria.novelSentencesRequired===true,
    unaidedRequired:criteria.unaidedResponseRequired===true||criteria.unaidedTransferRequired===true}},
  } as EvidenceSkill;
 }));
 const byNode=new Map(taxonomy.nodes.map(node=>[node.key,skills.filter(s=>s.nodeKey===node.key)]));
 for(const skill of skills){
  skill.prerequisites=taxonomy.edges.filter(e=>e.type==="prerequisite"&&e.prerequisiteClass==="hard"&&e.target===skill.nodeKey)
   .flatMap(e=>(byNode.get(e.source)??[]).map(s=>s.id));
 }
 const byId=new Map(skills.map(s=>[s.id,s]));
 const levels=new Map<string,number>(),visiting=new Set<string>();
 const level=(id:string):number=>{
  if(levels.has(id))return levels.get(id)!;
  if(visiting.has(id))throw Error("Cyclic assessment prerequisites");visiting.add(id);
  const skill=byId.get(id);if(!skill)throw Error(`Missing assessment prerequisite ${id}`);
  const value=skill.prerequisites.length?1+Math.max(...skill.prerequisites.map(level)):0;
  visiting.delete(id);levels.set(id,value);return value;
 };
 for(const skill of skills)skill.level=level(skill.id);
 const unsupportedEvidenceItemKeys:string[]=[];
 const probes:Probe[]=input.bank.items.filter(i=>eligible.has(i.itemKey)).flatMap(i=>{
  const skill=byId.get(`${i.item.nodeKey}::${i.evidenceKey}`);if(!skill)throw Error(`Unknown evidence ${i.itemKey}`);
  const support=readTextualSupport(i.item);
  if(skill.evidenceRequirements?.[skill.modes[0]]?.textualSupportRequired&&!support){unsupportedEvidenceItemKeys.push(i.itemKey);return [];}
  return [{id:i.itemKey,skillId:skill.id,mode:skill.modes[0],contextId:i.sectionKey==="reading_comprehension"?readingContextId(i.item.validatorConfig,i.item.promptFr):`surface:${checksum(i.item.promptFr)}`,
   ...canonicalProbeMetrics(i),textualSupportAssessed:Boolean(support),materialKeys:questionMaterialKeys(i.item),assessedMaterialKeys:questionAssessedMaterialKeys(i.item),contrastingErrorKeys:contrastingErrorKeys(i.item),negativeExampleAssessed:assessesNegativeExample(i.item),textType:i.sectionKey==="reading_comprehension"?readingTextType(i.item.validatorConfig):undefined}];
 });
 // Legacy unannotated sound items cannot establish the approved novel-word contract.
 // Only retire them when this bank supplies the replacement auditory format.
 const trackedSubjunctiveTargets=new Set(probes.filter(p=>(p.samplingCategory?.startsWith("subjonctif-recognition:")||p.skillId==="produire_subjonctif_present_frequent::writing-controlled-production")&&p.assessedMaterialKeys?.some(k=>k.startsWith("sentence:"))).map(p=>p.skillId));
 const auditoryTargets=new Set(probes.filter(p=>p.evidenceFeatures?.some(f=>f.startsWith("phoneme-graphie:"))).map(p=>p.skillId));
 for(let index=probes.length-1;index>=0;index--){
  const probe=probes[index];
  if((auditoryTargets.has(probe.skillId)&&!probe.assessedMaterialKeys?.some(key=>key.startsWith("word:")))||(trackedSubjunctiveTargets.has(probe.skillId)&&!probe.assessedMaterialKeys?.length)){unsupportedEvidenceItemKeys.push(probe.id);probes.splice(index,1);}
 }
 applyPhonemeGraphieCoverage(skills,probes);
 applyWrittenSyllableCoverage(skills,probes);
 return {skills,probes,taxonomyChecksum:taxonomyChecksum,bankChecksum:validated.manifest.checksum,unsupportedEvidenceItemKeys,...(input.reviewPolicy?{reviewPolicy:structuredClone(input.reviewPolicy)}:{})};
}

/** A node's recognition evidence can never substitute for its production evidence. */
export function rollUpV3Evidence(assessment:V3Assessment,results:readonly SkillResult[]){
 const byId=new Map(results.map(r=>[r.skillId,r]));
 return [...new Set(assessment.skills.map(s=>s.nodeKey))].map(nodeKey=>{
  const skills=assessment.skills.filter(s=>s.nodeKey===nodeKey);
  const evidence=skills.map(s=>({evidenceKey:s.evidenceKey,stage:s.assessmentStage,result:byId.get(s.id)??null}));
  const genreCoverage=skills.every(skill=>skill.modes.every(mode=>{
   const required=skill.evidenceRequirements?.[mode]?.parentMinimumTextTypes??skill.evidenceRequirements?.[mode]?.minimumTextTypes??0;
   const siblings=skills.filter(s=>s.evidenceKey===skill.evidenceKey);
   const types=new Set(siblings.flatMap(s=>byId.get(s.id)?.modes.filter(m=>m.mode===mode&&m.confirmed).flatMap(m=>m.textTypes??[])??[]));
   return types.size>=required;
  }));
  const confirmedMastery=genreCoverage&&evidence.every(e=>e.result?.resolved&&e.result.status==="mastered");
  return {nodeKey,labelFr:skills[0].labelFr,confirmedMastery,evidence,
   untestedEvidenceKeys:evidence.filter(e=>!e.result||e.result.evidence==="untested").map(e=>e.evidenceKey)};
 });
}
