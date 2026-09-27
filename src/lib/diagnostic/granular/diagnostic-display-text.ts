import {skillEvidenceDisplay} from './skill-evidence-display';
import {DIAGNOSTIC_COPY} from '@/components/diagnostic/diagnostic-copy';
import type {AssessmentView} from './client-state';
import {diagnosticProgressText,diagnosticQuestionText,diagnosticAnswerCountText,teachingProgressText,featureCountText,writingCountText} from '@/components/diagnostic/diagnostic-copy';
/** Record runtime wording from the same formatters used by the client. This is
 * conservative branch coverage, not proof the student read each fragment. */
export function diagnosticDisplayText(view:AssessmentView):string[]{
 const text=[diagnosticProgressText(view.answeredCount,view.skippedCount??0,view.remainingSeconds),diagnosticQuestionText(view.answeredCount,view.skippedCount??0)];
 if(view.teaching)text.push(teachingProgressText(view.teaching.exerciseIndex,view.teaching.totalExercises));
 if(view.writingFeedback?.assessed)text.push(writingCountText(view.writingFeedback.checkedCount,view.writingFeedback.correctCount));
 for(const result of view.results??[]){
  text.push(...skillEvidenceDisplay(result,DIAGNOSTIC_COPY.mode));
  text.push(diagnosticAnswerCountText(result.modes.reduce((sum,mode)=>sum+mode.distinctItems,0)));
  for(const mode of result.modes)for(const row of mode.featureEvidence??[])if(row.distinctItems>0)text.push(featureCountText(row.correctItems,row.distinctItems));
 }
 return [...new Set(text)];
}
