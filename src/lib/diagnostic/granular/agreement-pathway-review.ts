import {correctGuessChance,MAX_CONFIRMATION_GUESS_CHANCE} from "./engine";
import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact} from "../item-bank";
import {canonicalProbeMetrics} from "./probe-metrics";
import {questionMaterialKeys,questionAssessedMaterialKeys,teachingMaterialKeys} from "./material-annotations";
import {allocateQuestionPools} from "./question-pools";
import {validateTeachingTargets,type TargetTeachingContent} from "./teaching-content";
import {validateAnnotationTarget,type TargetAnnotation} from "./facet-adapter";
import {buildV3Facets} from "./facets";
import type {V3Assessment} from "./v3-adapter";

/** Review preview only. Never return a publishable bank, approvals or bindings. */
export function reviewAgreementPathways(assessment:V3Assessment,bank:CanonicalDiagnosticBankArtifact,
 taxonomy:TaxonomyCandidate,annotations:readonly TargetAnnotation[],lessons:readonly TargetTeachingContent[]){
 validateTeachingTargets(assessment,lessons);
 const validation=validateCanonicalDiagnosticBank(bank,taxonomy);
 if(validation.issues.length||validation.manifest.checksum!==assessment.bankChecksum||bank.taxonomy.checksum!==assessment.taxonomyChecksum)throw Error("Review source bank mismatch");
 const eligible=new Set(validation.eligibleItemKeys),mapped=new Map(annotations.map(annotation=>[annotation.itemKey,annotation])),facets=buildV3Facets(taxonomy);
 if(mapped.size!==annotations.length)throw Error("Duplicate review mapping");
 const rows=lessons.map(lesson=>{
  const skill=assessment.skills.find(skill=>skill.nodeKey===lesson.nodeKey&&skill.facetKey===lesson.facetKey&&skill.modes.includes(lesson.mode))!;
  const exposed=new Set(teachingMaterialKeys(lesson));
  const candidates=bank.items.filter(entry=>entry.itemKey.startsWith("v3-agreement:")&&entry.item.nodeKey===lesson.nodeKey&&entry.evidenceKey===skill.evidenceKey&&["human_approved","needs_human_review"].includes(entry.reviewStatus)).filter(entry=>{
   const annotation=mapped.get(entry.itemKey);
   if(!annotation||annotation.itemChecksum!==checksum(entry))throw Error(`Missing or stale agreement mapping: ${entry.itemKey}`);
   validateAnnotationTarget(annotation,entry,facets);
   return annotation.facetKey===lesson.facetKey;
  });
  const probes=candidates.map(entry=>({id:entry.itemKey,skillId:skill.id,mode:lesson.mode,
   contextId:mapped.get(entry.itemKey)!.contextKey,...canonicalProbeMetrics(entry),
   materialKeys:questionMaterialKeys(entry.item),assessedMaterialKeys:questionAssessedMaterialKeys(entry.item)}));
  const repeated=probes.filter(probe=>probe.assessedMaterialKeys.some(key=>exposed.has(key)));
  // Conservatively exclude teaching overlap from both candidate pools. Runtime
  // must still check exposure from other lessons, activities and earlier sessions.
  const remaining=probes.filter(probe=>!repeated.includes(probe));
  const allocation=allocateQuestionPools({...assessment,probes:remaining});
  const coverage=allocation.coverage.find(row=>row.skillId===skill.id&&row.mode===lesson.mode)!;
  const selected=allocation.assessment.probes;
  return {lessonId:lesson.id,lessonChecksum:checksum(lesson),titleFr:lesson.titleFr,skillId:skill.id,facetKey:lesson.facetKey,
   prerequisites:skill.prerequisites,evidenceRequirements:skill.evidenceRequirements?.[lesson.mode],
   eligibleQuestions:candidates.filter(entry=>eligible.has(entry.itemKey)).length,unapprovedCandidates:candidates.filter(entry=>!eligible.has(entry.itemKey)).length,
   guessingFloorValues:[...new Set(probes.map(probe=>probe.guessProbability))],
   minimumAllCorrectItemsForGuessGate:probes.length?Array.from({length:100},(_,index)=>index+1).find(count=>correctGuessChance(Array.from({length:count},()=>({guessProbability:Math.max(...probes.map(probe=>probe.guessProbability))})))<=MAX_CONFIRMATION_GUESS_CHANCE)??null:null,
   distinctTargetWords:new Set(probes.flatMap(probe=>probe.assessedMaterialKeys.filter(key=>key.startsWith("word:")))).size,
   excludedTeachingOverlapQuestionIds:repeated.map(probe=>probe.id),proposedAllocationStatus:coverage.status,
   proposedInitialQuestions:selected.filter(probe=>probe.usage==="initial").map(probe=>probe.id),
   proposedLaterQuestions:selected.filter(probe=>probe.usage==="learning").map(probe=>probe.id),
   questionChecksums:Object.fromEntries(candidates.map(entry=>[entry.itemKey,checksum(entry)])),
   assessedMaterialKeys:Object.fromEntries(probes.map(probe=>[probe.id,probe.assessedMaterialKeys])),
   releaseReady:false as const,
   requiredReviews:["answer_and_subject_validity","target_and_prerequisite_fit","teaching_and_semantic_overlap","material_annotation_completeness","difficulty_and_conjugation_confounding","conditional_binary_guessing_floor","cross_activity_exposure","multiple_occasions"],
  };
 });
 const content={version:"agreement-pathway-review-v1",status:"draft_review_feasibility_only",taxonomyChecksum:assessment.taxonomyChecksum,bankChecksum:assessment.bankChecksum,facetChecksum:assessment.facetChecksum,rows};
 return {...content,checksum:checksum(content)};
}
