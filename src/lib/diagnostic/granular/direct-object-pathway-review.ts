import {reviewSentencePathways} from "./sentence-pathway-review";
export function reviewDirectObjectPathways(...args:Parameters<typeof reviewSentencePathways> extends [...infer Inputs,unknown]?Inputs:never){
 return reviewSentencePathways(...args,{sourcePrefix:"v3-direct-object:",version:"direct-object-pathway-review-v2",requiredReviews:["answer_and_supplied_analysis_validity","target_and_prerequisite_fit","teaching_and_semantic_overlap","material_annotation_completeness","construction_balance_and_answer_cues","recognition_not_independent_explanation","cross_activity_exposure","multiple_occasions"]});
}
