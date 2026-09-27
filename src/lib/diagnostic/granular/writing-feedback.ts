import type {AssessmentSession} from './session';
import type {EvidenceSkill} from './v3-adapter';
import {verifiedWritingEvidence} from './writing-evidence';

/** Feedback on the latest submitted writing only. Assessed passages come from
 * verified saved spans; unassessable submissions have no grade or passages. No provider protocol, rubric, first draft or answer key is exposed.
 * Authenticated callers supply the owned session to publicAssessmentView. */
export function latestWritingFeedback(state:AssessmentSession,skills:readonly EvidenceSkill[]){
 if(state.phase!=='learning'||state.learningCheck||state.teaching)return null;
 const unassessed=state.unassessedWritingResponses?.at(-1);
 if(unassessed&&unassessed.afterRefinementCount===state.refinements.length){
  const skill=skills.find(skill=>skill.id===unassessed.skillId&&skill.modes.includes('independent_production'));
  if(!skill||!unassessed.text.trim()||unassessed.text.length>3000)return null;
  return {assessed:false as const,skillLabelFr:skill.labelFr,text:unassessed.text,checkedCount:0,correctCount:0,passages:[]};
 }
 const last=state.refinements.at(-1);
 if(!last||last.mode!=='independent_production')return null;
 const skill=skills.find(skill=>skill.id===last.skillId);
 const evidence=verifiedWritingEvidence(last.writingEvidence,last.skillId);
 if(!skill||!evidence)return null;
 return {
  assessed:true as const,
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
