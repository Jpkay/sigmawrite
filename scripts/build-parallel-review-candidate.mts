import {allocateTeachingQuestionPools} from "../src/lib/diagnostic/granular/teaching-question-pools";
import {granularBankOptions} from "./lib/granular-bank-options";
import {selectedTeachingDrafts} from "./lib/granular-authoring-selection";
const FRENCH_TEACHING_DRAFTS=selectedTeachingDrafts(process.argv.slice(2));
import {teachingContentChecksum,validatePublishedTeaching,type ParallelReviewTeachingContent} from "../src/lib/diagnostic/granular/teaching-content";
import {questionAssessedMaterialKeys,teachingMaterialKeys} from "../src/lib/diagnostic/granular/material-annotations";
import {readingPassageText} from "../src/lib/diagnostic/granular/v3-adapter";
import {materialIdentity} from "../src/lib/diagnostic/granular/material-identity";
import {stableUuid} from "../src/lib/lexicon/baseline";
import type {LearningActivityBinding} from "../src/lib/diagnostic/granular/activity-plan";
import {readFileSync,writeFileSync} from "node:fs";
import {checksum} from "../src/lib/taxonomy/validate";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {selectedDraftExpansionSources} from "./lib/granular-authoring-selection";
const FRENCH_DRAFT_EXPANSION_SOURCES=selectedDraftExpansionSources(process.argv.slice(2));
import {validateAnnotationReviewDraft} from "../src/lib/diagnostic/granular/annotation-review";
import {adaptV3ForAssessment} from "../src/lib/diagnostic/granular/v3-adapter";
import {applyFacetTargets} from "../src/lib/diagnostic/granular/facet-adapter";
import {buildV3Facets} from "../src/lib/diagnostic/granular/facets";
import {isQuestionPoolSufficient} from "../src/lib/diagnostic/granular/question-pools";
import {buildLearningCheckRegistry} from "../src/lib/diagnostic/granular/check-registry";
import type {ParallelReviewPolicy} from "../src/lib/diagnostic/granular/parallel-review-policy";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const artifact=read("generated/french-taxonomy-v3.json"),base=read("generated/diagnostic-bank-v3-draft.json");
const assembled=assembleDraftBank(base,artifact.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)),granularBankOptions(process.argv.slice(2)));
const {bank}=assembled;
const bankRevision=granularBankOptions(process.argv.slice(2)).revision;
const corrections=[...read("docs/diagnostic/v3-answer-corrections.json"),...read("docs/diagnostic/v3-item-repairs.json")];
const selected=new Set([...assembled.annotations.map(row=>row.itemKey),...corrections.map((row:{itemKey:string})=>row.itemKey)]);
const policy:ParallelReviewPolicy={mode:"parallel_review",authorization:"product-owner-request-2026-09-11",reviewOwner:"product_owner",bankChecksum:bank.manifest!.checksum,
 questionChecksums:Object.fromEntries(bank.items.filter(entry=>selected.has(entry.itemKey)).map(entry=>[entry.itemKey,checksum(entry)]))};
if(Object.keys(policy.questionChecksums).length!==selected.size)throw Error("Parallel review selection is incomplete");
const annotations=[...validateAnnotationReviewDraft(read("docs/diagnostic/v3-facet-annotations.json"),base),...assembled.annotations];
const adapted=applyFacetTargets(adaptV3ForAssessment({artifact,bank,reviewPolicy:policy}),buildV3Facets(artifact.taxonomy,granularBankOptions(process.argv.slice(2))),bank,annotations);
// New tense-recognition and form-family pathways assess sentences. Older isolated
// form drills remain in the canonical bank and in historical published releases.
const sentenceFamilyTargets=new Set(adapted.assessment.probes.filter(p=>(p.id.startsWith("v3-past-tense-foundations:")||p.id.startsWith("v3-subjonctif-family-production:")||p.id.startsWith("v3-imperatif-family-production:")||p.id.startsWith("v3-passe-simple-family-production:")||p.id.startsWith("v3-passe-simple-verb-production:")||p.id.startsWith("v3-imperatif-verb-production:")||p.id.startsWith("v3-vouloir-imperative:")||p.id.startsWith("v3-imperatif-recognition:")||p.id.startsWith("v3-etre-participle-agreement:"))).map(p=>p.skillId));
const retiredIsolatedFamilyQuestions=adapted.assessment.probes.filter(p=>sentenceFamilyTargets.has(p.skillId)&&!p.assessedMaterialKeys?.some(k=>k.startsWith("sentence:"))).map(p=>p.id);
const retiredFamilyIds=new Set(retiredIsolatedFamilyQuestions);
const allocation=allocateTeachingQuestionPools({...adapted.assessment,probes:adapted.assessment.probes.filter(p=>!retiredFamilyIds.has(p.id))},FRENCH_TEACHING_DRAFTS);
for(const id of sentenceFamilyTargets){
 if(!allocation.coverage.some(row=>row.skillId===id&&row.status==="allocated"))throw Error(`Sentence applications lack sufficient pools: ${id}`);
}
const entries=new Map(bank.items.map(entry=>[entry.itemKey,entry]));
const materialQuestions=new Map<string,Set<string>>();
for(const probe of allocation.assessment.probes){
 const entry=entries.get(probe.id)!;
 const keys=questionAssessedMaterialKeys(entry.item);
 if(entry.sectionKey==="reading_comprehension")keys.push(materialIdentity("sentence",readingPassageText(entry.item.validatorConfig,entry.item.promptFr)));
 for(const key of keys){const ids=materialQuestions.get(key)??new Set<string>();ids.add(probe.id);materialQuestions.set(key,ids);}
}
const teachingContent:ParallelReviewTeachingContent[]=FRENCH_TEACHING_DRAFTS.map(lesson=>({...structuredClone(lesson),status:"published_pending_review",
 assessmentExposureIds:[...new Set(teachingMaterialKeys(lesson).flatMap(key=>[...(materialQuestions.get(key)??[])]))].sort()}));
policy.teachingChecksums=Object.fromEntries(teachingContent.map(lesson=>[lesson.id,teachingContentChecksum(lesson)]));
allocation.assessment.reviewPolicy=structuredClone(policy);
validatePublishedTeaching(allocation.assessment,teachingContent);
const teachingReadiness=teachingContent.map(lesson=>{
 const targets=allocation.assessment.skills.filter(skill=>skill.nodeKey===lesson.nodeKey&&skill.facetKey===lesson.facetKey&&skill.modes.includes(lesson.mode));
 if(targets.length!==1)throw Error(`Ambiguous teaching target: ${lesson.id}`);
 const target=targets[0];
 const poolsAllocated=allocation.coverage.some(row=>row.skillId===target.id&&row.mode===lesson.mode&&row.status==="allocated");
 const remaining=allocation.assessment.probes.filter(probe=>probe.skillId===target.id&&probe.mode===lesson.mode&&probe.usage==="learning"&&!lesson.assessmentExposureIds.includes(probe.id));
 const freshCheckAvailable=poolsAllocated&&isQuestionPoolSufficient(remaining,target,lesson.mode,true);
 return {lessonId:lesson.id,skillId:target.id,poolsAllocated,remainingCheckQuestions:remaining.length,freshCheckAvailable};
});
const teachingBindings:LearningActivityBinding[]=teachingContent.flatMap(lesson=>{
 if(!teachingReadiness.find(row=>row.lessonId===lesson.id)!.freshCheckAvailable)return [];
 return (["instruction","practice"] as const).map(kind=>({id:stableUuid("granular-parallel-teaching",`${lesson.id}:${kind}`),nodeKey:lesson.nodeKey,facetKey:lesson.facetKey,mode:lesson.mode,
  kind,status:"published",titleFr:lesson.titleFr,href:"/student/diagnostic",contentId:lesson.id,estimatedMinutes:kind==="instruction"?4:6}));
});
const teachingScope=new Set<string>();
const includePrerequisites=(id:string)=>{
 if(teachingScope.has(id))return;
 const skill=allocation.assessment.skills.find(skill=>skill.id===id);
 if(!skill)throw Error(`Unknown teaching prerequisite: ${id}`);
 teachingScope.add(id);skill.prerequisites.forEach(includePrerequisites);
};
teachingReadiness.filter(row=>row.freshCheckAvailable).forEach(row=>includePrerequisites(row.skillId));
const teachingPrerequisiteGaps=[...teachingScope].filter(id=>!allocation.coverage.some(row=>row.skillId===id&&row.status==="allocated")).sort();
const checks=buildLearningCheckRegistry(allocation.assessment,bank,artifact.taxonomy);
const summary={teachingScopeTargets:teachingScope.size,teachingPrerequisiteGapTargets:teachingPrerequisiteGaps.length,teachingLessons:teachingContent.length,teachingTargetsWithPools:teachingReadiness.filter(row=>row.poolsAllocated).length,teachingTargetsWithFreshChecks:teachingReadiness.filter(row=>row.freshCheckAvailable).length,guidedExercises:teachingContent.reduce((sum,lesson)=>sum+lesson.practice.length,0),selectedPendingOrRepairedQuestions:selected.size,canonicalReviewedQuestions:bank.manifest!.eligibleItemCount,mappedQuestions:adapted.assessment.probes.length,
 targets:allocation.assessment.skills.length,allocatedTargets:allocation.coverage.filter(row=>row.status==="allocated").length,
 incompleteTargets:allocation.coverage.filter(row=>row.status!=="allocated").length,fullPoolCoverage:allocation.ready,unsupportedEvidenceItemKeys:adapted.assessment.unsupportedEvidenceItemKeys??[],unassignedQuestionIds:adapted.unassignedItemKeys};
const content={retiredIsolatedFamilyQuestions,status:"parallel_review_release_preparation",reviewOwner:"product_owner",authorization:policy.authorization,policyChecksum:checksum(policy),summary,
 assessment:allocation.assessment,teachingPoolRepairs:allocation.teachingPoolRepairs,poolCoverage:allocation.coverage,checkBindings:checks.bindings,teachingContent,teachingBindings,teachingReadiness,teachingPrerequisiteGaps,
 limitations:["Content remains pending review; release permission does not create human approval", "No database publication or activation is performed by this builder", "Incomplete target pools remain visible; release scope and fresh post-teaching check capacity still need verification", "Structurally rejected content remains ineligible; semantic review continues in parallel"]};
const selectedOptions=granularBankOptions(process.argv.slice(2));
const refinementFlag=(selectedOptions.verbFamilyRecognition?" --verb-family-recognition":"")+(selectedOptions.etreParticipleAgreement?" --etre-participle-agreement":"");
const markdown=`# Parallel-review release preparation\n\nThe product owner authorized students to start while personally reviewing content (2026-09-11). This explicitly supersedes waiting for all human content review before an initial release. It does not certify the draft questions or alter the approved graph.\n\n${summary.selectedPendingOrRepairedQuestions} selected draft/repaired question versions, ${summary.canonicalReviewedQuestions} canonically reviewed questions, ${summary.mappedQuestions} mapped questions.\n\n${summary.allocatedTargets} of ${summary.targets} targets have allocated initial and follow-up pools; ${summary.incompleteTargets} remain incomplete. The JSON lists each target and the proposed check bindings. This is a release preparation artifact, not proof of activation or full coverage.\n\n${summary.teachingLessons} lessons and ${summary.guidedExercises} guided exercises are pinned as published_pending_review. ${summary.teachingTargetsWithPools} lesson targets have allocated initial/follow-up pools; ${summary.teachingTargetsWithFreshChecks} retain enough check questions after exact teaching overlap exclusions and have proposed instruction/practice bindings. ${summary.teachingPrerequisiteGapTargets} prerequisite targets in their ${summary.teachingScopeTargets}-target dependency scope still lack complete pools. Exact material matches populate exposure exclusions; semantic overlap review remains in progress.\n\nPolicy checksum: ${checksum(policy)}.\n\nReproduce: npx tsx scripts/build-parallel-review-candidate.mts${bankRevision===undefined?"":` --bank-revision ${bankRevision}`}${refinementFlag}; append --check to verify without writing.\n`;
for(const [path,value] of [["generated/french-v3-parallel-review-policy.json",JSON.stringify(policy,null,2)+"\n"],["docs/diagnostic/v3-parallel-review-candidate.json",JSON.stringify({...content,checksum:checksum(content)},null,2)+"\n"],["docs/diagnostic/v3-parallel-review-candidate.md",markdown]]){
 if(process.argv.includes("--check")){if(readFileSync(path,"utf8")!==value)throw Error(`Stale parallel review candidate: ${path}`);}else writeFileSync(path,value);
}
console.log(JSON.stringify(summary));
