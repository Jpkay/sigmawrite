import type {AssessmentSession} from './session';
import type {EvidenceSkill} from './v3-adapter';
import {verifiedWritingEvidence} from './writing-evidence';

/** Feedback on the latest submitted writing only, derived from verified saved
 * spans. No provider protocol, rubric, first draft or answer key is exposed.
 * Authenticated callers supply the owned session to publicAssessmentView. */
export function latestWritingFeedback(state:AssessmentSession,skills:readonly EvidenceSkill[]){
 if(state.phase!=='learning'||state.learningCheck||state.teaching)return null;
 const last=state.refinements.at(-1);
 if(!last||last.mode!=='independent_production')return null;
 const skill=skills.find(skill=>skill.id===last.skillId);
 const evidence=verifiedWritingEvidence(last.writingEvidence,last.skillId);
 if(!skill||!evidence)return null;
 return {
  skillLabelFr:skill.labelFr,
  text:evidence.responseText,
  checkedCount:evidence.eligibleTokens,
  correctCount:evidence.correctTokens,
  passages:[...evidence.tokens].sort((a,b)=>a.start-b.start).map(token=>({
   start:token.start,end:token.end,text:token.text,correct:token.correct,
   explanationFr:token.reasonFr??(token.correct?'Cette forme convient ici.':'Relis ce passage en tenant compte du point travaillé.'),
  })),
 };
}
export type WritingFeedback=NonNullable<ReturnType<typeof latestWritingFeedback>>;
