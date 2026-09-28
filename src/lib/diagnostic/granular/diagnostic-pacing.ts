/** Client-side pacing for the adaptive diagnostic. These are display estimates
 * only: they never select questions and never change evidence or timing. */
export const DIAGNOSTIC_TOTAL_SECONDS=35*60;
const QUESTION_MILESTONE=15;
const BREAK_AFTER_SECONDS=12*60;
// Prior pace from the live session (about one question per minute), blended
// with the student's own pace so the first estimates do not swing wildly.
const PRIOR_SECONDS_PER_QUESTION=50,PRIOR_WEIGHT=3;

/** Approximate questions left at the student's pace; rounded to 5 above 10. */
export function estimateRemainingQuestions(done:number,remainingSeconds:number,totalSeconds=DIAGNOSTIC_TOTAL_SECONDS):number{
 if(remainingSeconds<=0)return 0;
 const elapsed=Math.max(0,totalSeconds-remainingSeconds);
 const pace=(elapsed+PRIOR_SECONDS_PER_QUESTION*PRIOR_WEIGHT)/(Math.max(0,done)+PRIOR_WEIGHT);
 const estimate=remainingSeconds/pace;
 return estimate<=10?Math.max(1,Math.round(estimate)):Math.round(estimate/5)*5;
}

export type PacePoint={done:number;remainingSeconds:number};
export type Interlude={milestone:"questions"|"half"|"three_quarters"|null;done:number;breakSuggested:boolean};

/** A celebration or break suggestion after an accepted answer or skip. It
 * praises effort and progress only, never correctness. */
export function interludeAfter(previous:PacePoint,next:PacePoint,breakAnchorSeconds:number|null,totalSeconds=DIAGNOSTIC_TOTAL_SECONDS):Interlude|null{
 if(next.done<=previous.done||next.remainingSeconds<=0)return null;
 const elapsed=(point:PacePoint)=>(totalSeconds-point.remainingSeconds)/totalSeconds;
 const crossed=(fraction:number)=>elapsed(previous)<fraction&&elapsed(next)>=fraction;
 const milestone=crossed(0.75)?"three_quarters":crossed(0.5)?"half"
  :Math.floor(previous.done/QUESTION_MILESTONE)<Math.floor(next.done/QUESTION_MILESTONE)?"questions":null;
 const breakSuggested=breakAnchorSeconds!==null&&breakAnchorSeconds-next.remainingSeconds>=BREAK_AFTER_SECONDS;
 return milestone||breakSuggested?{milestone,done:next.done,breakSuggested}:null;
}
