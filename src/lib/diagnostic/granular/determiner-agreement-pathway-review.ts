import {reviewSentencePathways} from "./sentence-pathway-review";
export function reviewDeterminerAgreementPathways(...args:Parameters<typeof reviewSentencePathways> extends [...infer Inputs,unknown]?Inputs:never){
 return reviewSentencePathways(...args,{sourcePrefix:"v3-determiner-agreement:",version:"determiner-agreement-pathway-review-v1",requiredReviews:["noun_as_agreement_controller","pronoun_versus_determiner_counterexamples","gender_neutral_plural_forms","possessor_versus_possessed_noun","target_and_prerequisite_fit","teaching_and_semantic_overlap","supplied_analysis_not_written_explanation","multiple_occasions"]});
}
