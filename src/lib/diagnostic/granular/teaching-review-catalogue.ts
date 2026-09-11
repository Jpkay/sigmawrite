import {checksum} from "@/lib/taxonomy/validate";
import type {V3Assessment} from "./v3-adapter";
import {validateTeachingTargets,type TargetTeachingContent} from "./teaching-content";
import {teachingMaterialKeys} from "./material-annotations";
/** Review export, not PublishedTeachingContent or an activity binding. */
export function buildTeachingReviewCatalogue(assessment:V3Assessment,lessons:readonly TargetTeachingContent[]){
 validateTeachingTargets(assessment,lessons);
 const rows=lessons.map(lesson=>{
  if(lesson.status!=="draft_requires_review")throw Error(`Not an authoring draft: ${lesson.id}`);
  const targets=assessment.skills.filter(skill=>skill.nodeKey===lesson.nodeKey&&skill.facetKey===lesson.facetKey&&skill.modes.includes(lesson.mode));
  if(targets.length!==1)throw Error(`Ambiguous teaching target: ${lesson.id}`);
  const skill=targets[0],materials=teachingMaterialKeys(lesson);
  const text=[lesson.titleFr,lesson.learnerQuestionFr,lesson.takeawayFr,lesson.boundaryFr,...lesson.steps.flatMap(step=>[step.exampleFr,step.explanationFr]),...lesson.practice.flatMap(exercise=>[exercise.promptFr,exercise.answerFr,exercise.hintFr,exercise.explanationFr])];
  if(text.some(value=>!value.trim()))throw Error(`Incomplete teaching text: ${lesson.id}`);
  return {lessonId:lesson.id,contentChecksum:checksum(lesson),skillId:skill.id,nodeKey:skill.nodeKey,facetKey:skill.facetKey??null,mode:lesson.mode,
   domain:skill.domain,prerequisites:skill.prerequisites,evidenceRequirements:skill.evidenceRequirements?.[lesson.mode],
   exposureAnnotationStatus:materials.length?"anchored_requires_completeness_review":"missing",materialKeys:materials,
   requiredReviews:["linguistic_validity","exact_target_and_mode_fit","worked_examples_and_guided_feedback","prerequisite_fit","assessment_overlap_and_exposure_completeness","learner_readability"],
   content:structuredClone(lesson)};
 });
 const content={version:"french-teaching-review-catalogue-v1",status:"draft_requires_review",taxonomyChecksum:assessment.taxonomyChecksum,facetChecksum:assessment.facetChecksum,
  assessmentSourceBankChecksum:assessment.bankChecksum,
  summary:{lessons:rows.length,guidedExercises:lessons.reduce((sum,lesson)=>sum+lesson.practice.length,0),targets:new Set(rows.map(row=>row.skillId)).size,missingExposureAnnotations:rows.filter(row=>row.exposureAnnotationStatus==="missing").map(row=>row.lessonId)},rows};
 return {...content,checksum:checksum(content)};
}
