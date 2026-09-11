import {reviewSentencePathways} from "./sentence-pathway-review";
import {PERSON_NUMBER_LABELS} from "./person-number-drafts";
export function reviewPersonNumberPathways(...args:Parameters<typeof reviewSentencePathways> extends [...infer Inputs,unknown]?Inputs:never){
 return reviewSentencePathways(...args,{sourcePrefix:"v3-person-number:",version:"person-number-pathway-review-v2",expectedCandidateGroups:PERSON_NUMBER_LABELS,candidateGroup:entry=>{
  const correct=entry.item.choices?.filter(choice=>choice.correct)??[];
  if(correct.length!==1||!PERSON_NUMBER_LABELS.some(label=>label===correct[0].text))throw Error(`Unknown person-number category: ${entry.itemKey}`);
  return correct[0].text;
 },requiredReviews:["grammatical_versus_referential_number","six_person_number_combinations_per_pool","coordinated_subjects","verb_ending_answer_cues","target_and_prerequisite_fit","teaching_and_semantic_overlap","material_annotation_completeness","supplied_subject_not_subject_identification","cross_activity_exposure","multiple_occasions"]});
}
