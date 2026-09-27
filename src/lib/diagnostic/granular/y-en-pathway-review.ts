import {reviewSentencePathways} from "./sentence-pathway-review";
export function reviewYEnPathways(...args:Parameters<typeof reviewSentencePathways> extends [...infer Inputs,unknown]?Inputs:never){
 return reviewSentencePathways(...args,{sourcePrefix:"v3-y-en:",version:"y-en-pathway-review-v1",requiredReviews:["verb_construction_and_reference","answer_variants_and_elision","quantity_retention","prerequisite_fit","conditional_binary_guessing_model","semantic_overlap_across_lessons","material_annotation_completeness","production_error_attribution","multiple_occasions"]});
}
