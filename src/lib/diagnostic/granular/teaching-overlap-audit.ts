import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import type {TargetTeachingContent} from "./teaching-content";
import {questionAssessedMaterialKeys,teachingMaterialKeys} from "./material-annotations";
import {readingPassageText} from "./v3-adapter";
import {materialIdentity} from "./material-identity";
/** Conditional exposure audit: an overlap matters when that lesson was shown.
 * This does not exclude every overlapping question for every learner. */
export function auditTeachingOverlap(bank:CanonicalDiagnosticBankArtifact,taxonomy:TaxonomyCandidate,lessons:readonly TargetTeachingContent[]){
 const validation=validateCanonicalDiagnosticBank(bank,taxonomy);
 if(validation.issues.length)throw Error("Invalid overlap source bank");
 if(bank.manifest&&bank.manifest.checksum!==validation.manifest.checksum)throw Error("Stale overlap source bank");
 if(new Set(lessons.map(lesson=>lesson.id)).size!==lessons.length)throw Error("Duplicate lesson identity");
 const materialLessons=new Map<string,string[]>();
 const lessonRows=lessons.map(lesson=>{
  if(!taxonomy.nodes.some(node=>node.key===lesson.nodeKey))throw Error("Lesson outside source graph");
  const keys=teachingMaterialKeys(lesson);
  for(const key of keys)materialLessons.set(key,[...(materialLessons.get(key)??[]),lesson.id]);
  return {id:lesson.id,checksum:checksum(lesson),nodeKey:lesson.nodeKey,mode:lesson.mode,materialKeys:keys};
 });
 const eligible=new Set(validation.eligibleItemKeys);
 const rows=bank.items.map(entry=>{
  const explicit=questionAssessedMaterialKeys(entry.item),keys=new Set(explicit);
  const configuredVerb=entry.item.validatorType==="conjugator"&&typeof entry.item.validatorConfig?.verb==="string"?entry.item.validatorConfig.verb.trim():"";
  const metadataKeys=configuredVerb?[materialIdentity("word",configuredVerb)]:[];
  let readingSourceMissing=false;
  if(entry.sectionKey==="reading_comprehension"){
   try{keys.add(materialIdentity("sentence",readingPassageText(entry.item.validatorConfig,entry.item.promptFr)));}
   catch{readingSourceMissing=true;}
  }
  const overlaps=[...keys].sort().flatMap(key=>(materialLessons.get(key)??[]).map(lessonId=>({lessonId,materialKey:key})));
  const configuredVerbOverlaps=metadataKeys.filter(key=>!keys.has(key)).flatMap(key=>(materialLessons.get(key)??[]).map(lessonId=>({lessonId,materialKey:key})));
  return {questionId:entry.itemKey,questionChecksum:checksum(entry),nodeKey:entry.item.nodeKey,evidenceKey:entry.evidenceKey,reviewStatus:entry.reviewStatus,canonicalEligible:eligible.has(entry.itemKey),
   explicitAssessedMaterial:explicit.length>0,readingSourceMissing,assessedMaterialKeys:[...keys].sort(),overlaps,
   configuredVerbMaterialKeys:metadataKeys,configuredVerbOverlaps};
 });
 const content={version:"french-teaching-overlap-audit-v1",status:"conditional_exact_overlap_review",taxonomyChecksum:bank.taxonomy.checksum,bankChecksum:validation.manifest.checksum,
  lessons:lessonRows,summary:{questions:rows.length,lessons:lessons.length,questionsWithExactOverlap:rows.filter(row=>row.overlaps.length).length,eligibleQuestionsWithExactOverlap:rows.filter(row=>row.canonicalEligible&&row.overlaps.length).length,questionsWithoutMaterialIdentity:rows.filter(row=>!row.assessedMaterialKeys.length).length,questionsWithConfiguredVerbOverlap:rows.filter(row=>row.configuredVerbOverlaps.length).length,questionsWithOnlyConfiguredVerbIdentity:rows.filter(row=>!row.assessedMaterialKeys.length&&row.configuredVerbMaterialKeys.length).length,questionsWithoutAnyReviewedOrConfiguredIdentity:rows.filter(row=>!row.assessedMaterialKeys.length&&!row.configuredVerbMaterialKeys.length).length,unresolvedReadingSources:rows.filter(row=>row.readingSourceMissing).length,lessonsWithoutMaterialIdentity:lessonRows.filter(row=>!row.materialKeys.length).length},rows};
 return {...content,checksum:checksum(content)};
}
