import {inspectReleaseScope} from "./release-scope";
import {parseParallelReviewPolicy} from "./parallel-review-policy";
import {teachingMaterialKeys,type MaterialExposureAnnotation} from "./material-annotations";
import type {Mode} from "./engine";
import type {V3Assessment} from "./v3-adapter";
import {checksum} from "@/lib/taxonomy/validate";

/** Teaching examples and guided exercises are exposure, never independent checks.
 * This catalogue contains authoring drafts, not publication approvals. */
export type TargetTeachingContent = {
  id:string;
  nodeKey:string;
  facetKey?:string;
  mode:Mode;
  status:"draft_requires_review";
  materialExposure?:MaterialExposureAnnotation;
  titleFr:string;
  learnerQuestionFr:string;
  steps:Array<{exampleFr:string;explanationFr:string}>;
  takeawayFr:string;
  boundaryFr:string;
  practice:Array<{id:string;promptFr:string;choices?:string[];answerFr:string;hintFr:string;explanationFr:string}>;
};

export type PublishedTeachingContent=Omit<TargetTeachingContent,"status">&{
  status:"published";
  /** Assessment questions semantically exposed by these examples/exercises.
   * Review must check content overlap, not only matching question IDs. */
  assessmentExposureIds:string[];
  review:{reviewerId:string;reviewedAt:string;contentChecksum:string;exposureMappingReviewed:true};
};
export type ParallelReviewTeachingContent=Omit<TargetTeachingContent,"status">&{
  status:"published_pending_review";
  assessmentExposureIds:string[];
  review?:never;
};
export type ReleasedTeachingContent=PublishedTeachingContent|ParallelReviewTeachingContent;
export function teachingContentChecksum(content:ReleasedTeachingContent){
  const {review,status,...body}=content;
  void review;void status;
  return checksum(body);
}
export function validatePublishedTeaching(assessment:V3Assessment,content:readonly ReleasedTeachingContent[]){
  validateTeachingTargets(assessment,content.map(lesson=>({...lesson,status:"draft_requires_review"})));
  const scope=assessment.releaseScope===undefined?undefined:inspectReleaseScope(assessment.skills,assessment.releaseScope);
  const policy=assessment.reviewPolicy===undefined?undefined:parseParallelReviewPolicy(assessment.reviewPolicy);
  if(policy&&policy.bankChecksum!==assessment.bankChecksum)throw Error("Teaching policy belongs to another bank version");
  for(const lesson of content){
    if(scope&&!assessment.skills.some(skill=>scope.teachingSkillIds.has(skill.id)&&skill.nodeKey===lesson.nodeKey&&skill.facetKey===lesson.facetKey&&skill.modes.includes(lesson.mode)))
      throw Error(`Teaching content outside release scope: ${lesson.id}`);
    if(lesson.status==="published_pending_review"){
      if(lesson.review!==undefined||!policy||policy.teachingChecksums?.[lesson.id]!==teachingContentChecksum(lesson))
        throw Error(`Teaching permission is missing or stale: ${lesson.id}`);
    }else if(lesson.status!=="published"||!lesson.review?.reviewerId.trim()||!Number.isFinite(Date.parse(lesson.review.reviewedAt))
      ||lesson.review.exposureMappingReviewed!==true||lesson.review.contentChecksum!==teachingContentChecksum(lesson))
      throw Error(`Teaching review is missing or stale: ${lesson.id}`);
    teachingMaterialKeys(lesson);
    if(new Set(lesson.assessmentExposureIds).size!==lesson.assessmentExposureIds.length
      ||lesson.assessmentExposureIds.some(id=>!assessment.probes.some(probe=>probe.id===id)))
      throw Error(`Invalid teaching exposure mapping: ${lesson.id}`);
  }
}

export function validateTeachingTargets(assessment:V3Assessment,content:readonly TargetTeachingContent[]){
  const ids=new Set<string>(),exerciseIds=new Set<string>();
  for(const lesson of content){
    if(ids.has(lesson.id))throw Error(`Duplicate teaching content: ${lesson.id}`);
    ids.add(lesson.id);
    if(!assessment.skills.some(skill=>skill.nodeKey===lesson.nodeKey&&skill.facetKey===lesson.facetKey&&skill.modes.includes(lesson.mode)))
      throw Error(`Teaching content has no exact assessment target: ${lesson.id}`);
    if(!lesson.steps.length||!lesson.practice.length)throw Error(`Teaching content is incomplete: ${lesson.id}`);
    for(const exercise of lesson.practice){
      if(exerciseIds.has(exercise.id)||assessment.probes.some(probe=>probe.id===exercise.id))
        throw Error(`Guided exercise identity overlaps: ${exercise.id}`);
      if(exercise.choices&&(exercise.choices.length<2||exercise.choices.length>6
        ||exercise.choices.some(choice=>!choice.trim())
        ||new Set(exercise.choices.map(choice=>choice.normalize("NFC").trim().toLocaleLowerCase("fr"))).size!==exercise.choices.length
        ||exercise.choices.filter(choice=>choice===exercise.answerFr).length!==1))
        throw Error(`Invalid guided answer choices: ${exercise.id}`);
      exerciseIds.add(exercise.id);
    }
  }
}
