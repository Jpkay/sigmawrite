import {correctGuessChance,MAX_CONFIRMATION_GUESS_CHANCE} from "./engine";
import {checksum,type TaxonomyCandidate} from "@/lib/taxonomy/validate";
import {validateCanonicalDiagnosticBank,type CanonicalDiagnosticBankArtifact,type CanonicalDiagnosticBankItem} from "../item-bank";
import {canonicalProbeMetrics} from "./probe-metrics";
import {assessesNegativeExample} from "./negative-examples";
import {contrastingErrorKeys} from "./contrasting-errors";
import {questionMaterialKeys,questionAssessedMaterialKeys,teachingMaterialKeys} from "./material-annotations";
import {allocateQuestionPools,isQuestionPoolSufficient} from "./question-pools";
import {validateTeachingTargets,type TargetTeachingContent} from "./teaching-content";
import {validateAnnotationTarget,type TargetAnnotation} from "./facet-adapter";
import {buildV3Facets} from "./facets";
import type {V3Assessment} from "./v3-adapter";

/** Review preview only. Never return a publishable bank, approvals or bindings. */
export function reviewSentencePathways(assessment:V3Assessment,bank:CanonicalDiagnosticBankArtifact,
 taxonomy:TaxonomyCandidate,annotations:readonly TargetAnnotation[],lessons:readonly TargetTeachingContent[],options:{sourcePrefix:string;version:string;requiredReviews:readonly string[];candidateGroup?:(entry:CanonicalDiagnosticBankItem)=>string;expectedCandidateGroups?:readonly string[]}){
 if(!options.sourcePrefix.trim()||!options.version.trim())throw Error("Missing review source identity");
 validateTeachingTargets(assessment,lessons);
 const validation=validateCanonicalDiagnosticBank(bank,taxonomy);
 if(validation.issues.length||validation.manifest.checksum!==assessment.bankChecksum||bank.taxonomy.checksum!==assessment.taxonomyChecksum)throw Error("Review source bank mismatch");
 const eligible=new Set(validation.eligibleItemKeys),mapped=new Map(annotations.map(annotation=>[annotation.itemKey,annotation])),facets=buildV3Facets(taxonomy);
 if(mapped.size!==annotations.length)throw Error("Duplicate review mapping");
 const exposed=new Set(lessons.flatMap(lesson=>teachingMaterialKeys(lesson)));
 const rows=lessons.map(lesson=>{
  const skill=assessment.skills.find(skill=>skill.nodeKey===lesson.nodeKey&&skill.facetKey===lesson.facetKey&&skill.modes.includes(lesson.mode))!;
  const candidates=bank.items.filter(entry=>entry.itemKey.startsWith(options.sourcePrefix)&&entry.item.nodeKey===lesson.nodeKey&&entry.evidenceKey===skill.evidenceKey&&["human_approved","needs_human_review"].includes(entry.reviewStatus)).filter(entry=>{
   const annotation=mapped.get(entry.itemKey);
   if(!annotation||annotation.itemChecksum!==checksum(entry))throw Error(`Missing or stale sentence mapping: ${entry.itemKey}`);
   validateAnnotationTarget(annotation,entry,facets);
   return annotation.facetKey===lesson.facetKey;
  });
  for(const entry of candidates){
   const assessed=questionAssessedMaterialKeys(entry.item);
   if(assessed.length!==1||!assessed[0].startsWith("sentence:"))throw Error(`Missing exact assessed sentence: ${entry.itemKey}`);
  }
  const probes=candidates.map(entry=>({id:entry.itemKey,skillId:skill.id,mode:lesson.mode,
   contextId:questionAssessedMaterialKeys(entry.item).filter(key=>key.startsWith("sentence:")).join("|"),...canonicalProbeMetrics(entry),
   materialKeys:questionMaterialKeys(entry.item),assessedMaterialKeys:questionAssessedMaterialKeys(entry.item),negativeExampleAssessed:assessesNegativeExample(entry.item),contrastingErrorKeys:contrastingErrorKeys(entry.item)}));
  const repeated=probes.filter(probe=>probe.assessedMaterialKeys.some(key=>exposed.has(key)));
  // Conservatively exclude teaching overlap from both candidate pools. Runtime
  // must still check exposure outside the supplied lesson set and earlier sessions.
  const seenSentences=new Set<string>(),duplicateIds:string[]=[];
  const remaining=probes.filter(probe=>!repeated.includes(probe)).sort((a,b)=>a.id.localeCompare(b.id)).filter(probe=>{
   if(seenSentences.has(probe.contextId)){duplicateIds.push(probe.id);return false;}
   seenSentences.add(probe.contextId);return true;
  });
  const allocation=allocateQuestionPools({...assessment,probes:remaining});
  const coverage=allocation.coverage.find(row=>row.skillId===skill.id&&row.mode===lesson.mode)!;
  let selected=allocation.assessment.probes;
  const groups=new Map(candidates.map(entry=>[entry.itemKey,options.candidateGroup?.(entry)]));
  let groupBalance:"not_requested"|"balanced"|"insufficient_group_coverage"|"evidence_constraints"="not_requested";
  if(options.candidateGroup){
   if([...groups.values()].some(group=>!group?.trim()))throw Error("Missing candidate group");
   const categories=[...new Set([...(options.expectedCandidateGroups??[]),...groups.values()])].sort();
   // Repartition only already selected, unexposed questions. Never invent new
   // evidence, relax a graph criterion or recover discarded content for balance.
   const balanced=categories.flatMap(group=>selected.filter(probe=>groups.get(probe.id)===group).sort((a,b)=>a.id.localeCompare(b.id)).map((probe,index)=>({...probe,usage:skill.assessmentStage==="learning"||index%2===1?"learning" as const:"initial" as const})));
   const hasCoverage=categories.every(group=>{
    const subset=balanced.filter(probe=>groups.get(probe.id)===group);
    return subset.some(probe=>probe.usage==="learning")&&(skill.assessmentStage==="learning"||subset.some(probe=>probe.usage==="initial"));
   });
   if(!hasCoverage)groupBalance="insufficient_group_coverage";
   else if((skill.assessmentStage==="learning"||isQuestionPoolSufficient(balanced.filter(probe=>probe.usage==="initial"),skill,lesson.mode,false))&&isQuestionPoolSufficient(balanced.filter(probe=>probe.usage==="learning"),skill,lesson.mode,true)){
    selected=balanced;groupBalance="balanced";
   }else groupBalance="evidence_constraints";
  }
  return {lessonId:lesson.id,lessonChecksum:checksum(lesson),titleFr:lesson.titleFr,skillId:skill.id,facetKey:lesson.facetKey,
   prerequisites:skill.prerequisites,evidenceRequirements:skill.evidenceRequirements?.[lesson.mode],
   ...(options.candidateGroup?{groupBalance,candidateGroups:Object.fromEntries(groups),groupCoverage:[...new Set([...(options.expectedCandidateGroups??[]),...groups.values()])].sort().map(group=>({group,initial:selected.filter(probe=>probe.usage==="initial"&&groups.get(probe.id)===group).length,later:selected.filter(probe=>probe.usage==="learning"&&groups.get(probe.id)===group).length}))}:{}),
   eligibleQuestions:candidates.filter(entry=>eligible.has(entry.itemKey)).length,unapprovedCandidates:candidates.filter(entry=>!eligible.has(entry.itemKey)).length,
   guessingFloorValues:[...new Set(probes.map(probe=>probe.guessProbability))],
   minimumAllCorrectItemsForGuessGate:probes.length?Array.from({length:100},(_,index)=>index+1).find(count=>correctGuessChance(Array.from({length:count},()=>({guessProbability:Math.max(...probes.map(probe=>probe.guessProbability))})))<=MAX_CONFIRMATION_GUESS_CHANCE)??null:null,
   distinctTargetSentences:new Set(probes.flatMap(probe=>probe.assessedMaterialKeys.filter(key=>key.startsWith("sentence:")))).size,
   excludedTeachingOverlapQuestionIds:repeated.map(probe=>probe.id),excludedRepeatedSentenceQuestionIds:duplicateIds,proposedAllocationStatus:coverage.status,
   proposedInitialQuestions:selected.filter(probe=>probe.usage==="initial").map(probe=>probe.id),
   proposedLaterQuestions:selected.filter(probe=>probe.usage==="learning").map(probe=>probe.id),
   questionChecksums:Object.fromEntries(candidates.map(entry=>[entry.itemKey,checksum(entry)])),
   assessedMaterialKeys:Object.fromEntries(probes.map(probe=>[probe.id,probe.assessedMaterialKeys])),
   releaseReady:false as const,
   requiredReviews:[...options.requiredReviews],
  };
 });
 const content={version:options.version,reviewedLessonChecksums:Object.fromEntries(lessons.map(lesson=>[lesson.id,checksum(lesson)])),status:"draft_review_feasibility_only",taxonomyChecksum:assessment.taxonomyChecksum,bankChecksum:assessment.bankChecksum,facetChecksum:assessment.facetChecksum,rows};
 return {...content,checksum:checksum(content)};
}
