import {materialIdentity} from "./material-identity";
import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import {readTextualSupport} from "./textual-support";
import {canonicalProbeMetrics} from "./probe-metrics";
import {questionMaterialKeys,questionAssessedMaterialKeys,teachingMaterialKeys} from "./material-annotations";
import {allocateQuestionPools} from "./question-pools";
import {validateTeachingTargets,type TargetTeachingContent} from "./teaching-content";
import {readingContextId,type V3Assessment} from "./v3-adapter";

/** Nonpublishing feasibility audit. Pending review items never become approved,
 * and no publishable assessment or activity bindings leave this function. */
export function reviewReadingPathways(assessment:V3Assessment,bank:CanonicalDiagnosticBankArtifact,taxonomy:TaxonomyCandidate,lessons:readonly TargetTeachingContent[]){
 validateTeachingTargets(assessment,lessons);
 const validation=validateCanonicalDiagnosticBank(bank,taxonomy);
 if(validation.issues.length||validation.manifest.checksum!==assessment.bankChecksum)throw Error("Reading review source bank mismatch");
 const eligible=new Set(validation.eligibleItemKeys),preview=structuredClone(assessment);
 const targets=lessons.map(lesson=>assessment.skills.find(skill=>skill.nodeKey===lesson.nodeKey&&skill.facetKey===lesson.facetKey&&skill.modes.includes(lesson.mode))!);
 const ids=new Set(targets.map(skill=>skill.id));
 preview.probes=preview.probes.filter(probe=>!ids.has(probe.skillId));
 const sources=new Map<string,{passage:string;context:string}>();
 for(const entry of bank.items){
  if(!entry.itemKey.startsWith("v3-short-reading:")||!["human_approved","needs_human_review"].includes(entry.reviewStatus))continue;
  const support=readTextualSupport(entry.item);if(!support)throw Error(`Missing source-bound reading support: ${entry.itemKey}`);
  const type=entry.item.validatorConfig?.sourceTextType;
  const genre=type==="literary"?"narrative":type;
  const skill=targets.find(target=>target.nodeKey===entry.item.nodeKey&&target.evidenceKey===entry.evidenceKey&&target.facetKey===`${entry.item.nodeKey}::text_type:${genre}`);
  if(!skill)continue;
  // Different IDs for the exact same passage cannot manufacture text diversity.
  // Semantic paraphrases still require human overlap review.
  const context=readingContextId(entry.item.validatorConfig,entry.item.promptFr);
  sources.set(entry.itemKey,{passage:support.passageText,context});
  preview.probes.push({id:entry.itemKey,skillId:skill.id,mode:skill.modes[0],contextId:context,...canonicalProbeMetrics(entry),textType:String(genre),textualSupportAssessed:true,materialKeys:questionMaterialKeys(entry.item),assessedMaterialKeys:questionAssessedMaterialKeys(entry.item)});
 }
 const exposed=new Set(lessons.flatMap(lesson=>teachingMaterialKeys(lesson)));
 const candidateProbes=[...preview.probes];
 const repeated=preview.probes.filter(probe=>{const source=sources.get(probe.id);return source&&exposed.has(materialIdentity("sentence",source.passage));});
 preview.probes=preview.probes.filter(probe=>!repeated.includes(probe));
 const allocation=allocateQuestionPools(preview),entries=new Map(bank.items.map(entry=>[entry.itemKey,entry]));
 const rows=lessons.map(lesson=>{
  teachingMaterialKeys(lesson);
  const skill=targets.find(target=>target.nodeKey===lesson.nodeKey&&target.facetKey===lesson.facetKey)!;
  const coverage=allocation.coverage.find(row=>row.skillId===skill.id&&row.mode===lesson.mode)!;
  const probes=allocation.assessment.probes.filter(probe=>probe.skillId===skill.id);
  const candidates=candidateProbes.filter(probe=>probe.skillId===skill.id);
  return {lessonId:lesson.id,titleFr:lesson.titleFr,lessonChecksum:checksum(lesson),skillId:skill.id,facetKey:skill.facetKey,prerequisites:skill.prerequisites,evidenceRequirements:skill.evidenceRequirements?.[lesson.mode],eligibleQuestions:candidates.filter(probe=>eligible.has(probe.id)).length,unapprovedCandidates:candidates.filter(probe=>!eligible.has(probe.id)).length,distinctPassages:new Set(probes.map(probe=>probe.contextId)).size,proposedAllocationStatus:coverage.status,excludedTeachingOverlapQuestionIds:repeated.filter(probe=>probe.skillId===skill.id).map(probe=>probe.id),
   proposedInitialQuestions:probes.filter(probe=>probe.usage==="initial").map(probe=>probe.id),proposedLaterQuestions:probes.filter(probe=>probe.usage==="learning").map(probe=>probe.id),
   questionChecksums:Object.fromEntries(probes.map(probe=>[probe.id,checksum(entries.get(probe.id)!)])),passageChecksums:Object.fromEntries(probes.map(probe=>[probe.id,sources.get(probe.id)!.context])),releaseReady:false as const,
   requiredReviews:["question_correctness_and_textual_support","lesson_and_guided_practice","teaching_to_assessment_overlap","semantic_passage_independence","prerequisite_scope","evidence_criteria_enforcement","calibration"]};
 });
 const report={version:"reading-pathway-review-v2",reviewedLessonChecksums:Object.fromEntries(lessons.map(lesson=>[lesson.id,checksum(lesson)])),status:"draft_review_feasibility_only",taxonomyChecksum:assessment.taxonomyChecksum,bankChecksum:assessment.bankChecksum,facetChecksum:assessment.facetChecksum,rows};
 return {...report,checksum:checksum(report)};
}
