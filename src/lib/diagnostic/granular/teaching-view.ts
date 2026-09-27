import {publicAudioFields} from "./audio-stimulus";
import {teachingChoices} from "./teaching-choices";
import type {AssessmentBundle,StoredSession} from "./service";
import {validatePublishedTeaching} from "./teaching-content";

export function publicTeachingView(session:StoredSession,bundle:AssessmentBundle){
  const progress=session.state.teaching;
  if(!progress)return null;
  const lesson=bundle.teachingContent?.find(item=>item.id===progress.contentId);
  if(!lesson)return null;
  validatePublishedTeaching(bundle.assessment,[lesson]);
  const exercise=lesson.practice[progress.exerciseIndex];
  const response=progress.responses.find(item=>item.exerciseId===exercise?.id);
  return {activityId:progress.activityId,contentId:lesson.id,titleFr:lesson.titleFr,learnerQuestionFr:lesson.learnerQuestionFr,
    phase:progress.phase,steps:lesson.steps.map(step=>({exampleFr:step.exampleFr,explanationFr:step.explanationFr,...publicAudioFields(step.audioStimulus)})),takeawayFr:lesson.takeawayFr,boundaryFr:lesson.boundaryFr,
    exerciseIndex:progress.exerciseIndex,totalExercises:lesson.practice.length,
    exercise:progress.phase==="practice"&&exercise?{id:exercise.id,promptFr:exercise.promptFr,...publicAudioFields(exercise.audioStimulus),...(exercise.choices?{choices:teachingChoices(session.id,lesson.id,exercise)}:{}),
      hintFr:progress.hintUsed?exercise.hintFr:null,
      feedback:response?{answer:response.answer,correct:response.correct,answerFr:exercise.answerFr,explanationFr:exercise.explanationFr}:null}:null};
}
