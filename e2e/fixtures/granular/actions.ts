import {DETERMINER_AGREEMENT_TEACHING} from "../../../src/lib/diagnostic/granular/determiner-agreement-teaching";
import {PERSON_NUMBER_TEACHING} from "../../../src/lib/diagnostic/granular/person-number-teaching";
import {shuffleChoices} from "../../../src/lib/content/choice-order";
import {Y_EN_TEACHING} from "../../../src/lib/diagnostic/granular/y-en-teaching";
import {DIRECT_OBJECT_TEACHING} from "../../../src/lib/diagnostic/granular/direct-object-teaching";
import {PERIPHRASTIC_RECOGNITION_TEACHING} from "../../../src/lib/diagnostic/granular/periphrastic-recognition-teaching";
import {SUBJECT_TEACHING} from "../../../src/lib/diagnostic/granular/subject-teaching";
import {AGREEMENT_TEACHING} from "../../../src/lib/diagnostic/granular/agreement-teaching";
import {SPELLING_TEACHING} from "../../../src/lib/diagnostic/granular/spelling-teaching";
import {CONJUGATION_TEACHING} from "../../../src/lib/diagnostic/granular/conjugation-teaching";
import {READING_TEACHING} from "../../../src/lib/diagnostic/granular/reading-teaching";
import {PRONOUN_PLACEMENT_TEACHING} from "../../../src/lib/diagnostic/granular/pronoun-teaching";
import type {AssessmentView,AssessmentResponse} from "../../..//src/lib/diagnostic/granular/client-state";
const question={id:"q1",promptFr:"Conjugue « finir » au présent avec « nous ».",instructionsFr:null,responseType:"short_answer",supportChoices:null,choices:[]} as const;
const initial={phase:"assessing",paused:true,provisional:true,remainingSeconds:2100,pendingItemId:null,results:[],priorities:[],sessionId:"11111111-1111-4111-8111-111111111111",revision:0,answeredCount:0,skippedCount:0,teaching:null,learningCheck:null,learningActivities:[],missingLearningActivityCount:0,deferredReviewCount:0,skillDetails:{s1:{labelFr:"Conjuguer finir au présent",nodeKey:"produire_present_indicatif",domain:"conjugation",mode:"production"}},question:null} as AssessmentView;
function load():AssessmentView{return JSON.parse(localStorage.getItem("granular-ui-fixture")??JSON.stringify(initial));}
function save(view:AssessmentView){localStorage.setItem("granular-ui-fixture",JSON.stringify(view));}
export async function startGranularDiagnostic():Promise<AssessmentResponse>{return{view:load()};}
export async function updateGranularDiagnostic(input:unknown):Promise<AssessmentResponse>{
 const command=input as {type:string;revision:number;answer?:string;supportChoiceId?:string};const view=load();
 await new Promise(resolve=>setTimeout(resolve,30));
 if(command.revision!==view.revision)return{view,conflict:true};
 if(command.type==="answer"&&!localStorage.getItem("granular-fixture-conflict")){localStorage.setItem("granular-fixture-conflict","1");view.revision++;save(view);return{conflict:true,view};}
 if(command.type==="answer"&&view.question?.supportChoices){
  if(!command.supportChoiceId)return {error:"Choisis aussi le passage qui justifie ta réponse."};
  if(!localStorage.getItem("reading-network")){localStorage.setItem("reading-network","1");throw Error("Fixture interrupted request");}
  localStorage.setItem("reading-submitted",JSON.stringify(command));
  view.question={...view.question,id:"reading-next",promptFr:"Lis le texte.\n\nLe portail est fermé. Nora attend devant l’entrée. Elle porte un sac rouge.\n\nPourquoi Nora attend-elle ?",choices:[{id:"next-answer",text:"Le portail est fermé."},{id:"next-wrong",text:"Son sac est rouge."}],supportChoices:[{id:"33333333-3333-4333-8333-333333333333",text:"Le portail est fermé."},{id:"44444444-4444-4444-8444-444444444444",text:"Elle porte un sac rouge."}]};
  view.pendingItemId=view.question.id;view.answeredCount++;view.revision++;save(view);return {view};
 }
 if(command.type==="skip"){
  localStorage.setItem("skip-submitted",JSON.stringify(command));
  if(!localStorage.getItem("skip-network")){localStorage.setItem("skip-network","1");throw Error("Fixture interrupted skip");}
  if(!localStorage.getItem("skip-conflict")){localStorage.setItem("skip-conflict","1");view.revision++;save(view);return {conflict:true,view};}
  view.skippedCount=(view.skippedCount??0)+1;
  view.question={...question,id:`skip-next-${view.skippedCount}`,choices:[]};view.pendingItemId=view.question.id;
 }
 if(command.type==="resume"){view.paused=false;view.question={...question,choices:[]};view.pendingItemId="q1";}
 if(command.type==="pause")view.paused=true;
 if(command.type==="pulse")view.remainingSeconds-=15;
 if(command.type==="answer"){
  view.phase="learning";view.paused=true;view.question=null;view.pendingItemId=null;view.answeredCount=1;
  view.results=[{skillId:"s1",status:"uncertain",resolved:false,evidence:"direct",modes:[{mode:"production",probability:.5,distinctItems:1,distinctContexts:1,distinctOccasions:1,accuracy:1,confirmed:false}]}];
  view.priorities=[{skillId:"s1",action:"verify",modes:["production"],reason:"insufficient_evidence"}];
  view.learningActivities=[{skillId:"s1",activityId:"check-finish",estimatedMinutes:1,kind:"independent_check",action:"verify",titleFr:"Vérifier finir au présent",href:"/student/diagnostic"}];
 }
 view.revision++;save(view);return{view};
}
export async function updateGranularLearningCheck(input:unknown):Promise<AssessmentResponse>{
 const command=input as {type:string;revision:number;answer?:string;checkId?:string};const view=load();
 await new Promise(resolve=>setTimeout(resolve,30));
 if(command.revision!==view.revision)return {view,conflict:true};
 if(command.type==="start_check"){
  if(!view.learningCheck)view.learningCheck={firstDraft:null,revisionRequired:false,id:"22222222-2222-4222-8222-222222222222",activityId:"check-finish",question:{id:"q2",promptFr:"Conjugue « finir » au présent avec « ils ».",instructionsFr:null,responseType:"short_answer",supportChoices:null,choices:[]}};
 }
 if(command.type==="answer_check"){
  if(view.learningCheck?.revisionRequired&&view.learningCheck.firstDraft===null){
   view.learningCheck.firstDraft=command.answer??"";view.revision++;save(view);return {view};
  }
  if(!localStorage.getItem("granular-learning-conflict")){localStorage.setItem("granular-learning-conflict","1");view.revision++;save(view);return {view,conflict:true};}
  if(!localStorage.getItem("granular-learning-network")){localStorage.setItem("granular-learning-network","1");throw Error("Fixture interrupted request");}
  if(view.learningCheck?.revisionRequired)localStorage.setItem("writing-fixture-submitted",JSON.stringify({firstDraft:view.learningCheck.firstDraft,answer:command.answer}));
  view.learningCheck=null;view.learningActivities=[];
  view.results[0].modes[0].distinctItems=2;
 }
 if(command.type==="abandon_check"){view.learningCheck=null;view.learningActivities=[];}
 view.revision++;save(view);return {view};
}

// Browser-only teaching fixture. Production content stays in the server release.
export async function updateGranularTeaching(input:unknown):Promise<AssessmentResponse>{
 const command=input as {type:string;revision:number;answer?:string};const view=load();
 if(command.revision!==view.revision)return {view,conflict:true};
 const lesson=DETERMINER_AGREEMENT_TEACHING.find(lesson=>lesson.id===localStorage.getItem("determiner-agreement-teaching"))??PERSON_NUMBER_TEACHING.find(lesson=>lesson.id===localStorage.getItem("person-number-teaching"))??Y_EN_TEACHING.find(lesson=>lesson.id===localStorage.getItem("y-en-teaching"))??DIRECT_OBJECT_TEACHING.find(lesson=>lesson.id===localStorage.getItem("direct-object-teaching"))??PERIPHRASTIC_RECOGNITION_TEACHING.find(lesson=>lesson.id===localStorage.getItem("periphrastic-recognition-teaching"))??SUBJECT_TEACHING.find(lesson=>lesson.id===localStorage.getItem("subject-teaching"))??AGREEMENT_TEACHING.find(lesson=>lesson.id===localStorage.getItem("agreement-teaching"))??CONJUGATION_TEACHING.find(lesson=>lesson.id===localStorage.getItem("conjugation-teaching"))??(localStorage.getItem("nasal-teaching")?SPELLING_TEACHING.find(lesson=>lesson.id==="spelling-m-before-mbp")!:localStorage.getItem("reading-teaching")?(READING_TEACHING.find(lesson=>lesson.id===localStorage.getItem("reading-teaching"))??READING_TEACHING[0]):PRONOUN_PLACEMENT_TEACHING[0]);
 const exerciseView=(index:number)=>({id:lesson.practice[index].id,promptFr:lesson.practice[index].promptFr,choices:lesson.practice[index].choices?shuffleChoices(lesson.practice[index].choices!.map((text,i)=>({id:`fixture-${index}-${i}`,text})),`${view.sessionId}:${lesson.id}:${lesson.practice[index].id}`):undefined,hintFr:null,feedback:null});
 if(command.type==="start_teaching")view.teaching={activityId:"fixture-lesson",contentId:lesson.id,titleFr:lesson.titleFr,learnerQuestionFr:lesson.learnerQuestionFr,steps:lesson.steps,takeawayFr:lesson.takeawayFr,boundaryFr:lesson.boundaryFr,phase:"lesson",exerciseIndex:0,totalExercises:lesson.practice.length,exercise:null};
 const teaching=view.teaching;
 if(teaching){
  if(command.type==="begin_practice"){teaching.phase="practice";teaching.exercise=exerciseView(0);}
  if(command.type==="teaching_hint"&&teaching.exercise)teaching.exercise.hintFr=lesson.practice[teaching.exerciseIndex].hintFr;
  if(command.type==="answer_practice"&&teaching.exercise){
   if(!localStorage.getItem("teaching-conflict")){localStorage.setItem("teaching-conflict","1");view.revision++;save(view);return {view,conflict:true};}
   if(!localStorage.getItem("teaching-network")){localStorage.setItem("teaching-network","1");throw Error("Fixture interrupted request");}
   const exercise=lesson.practice[teaching.exerciseIndex];
   const choice=teaching.exercise.choices?.find(choice=>choice.id===command.answer);
   if(exercise.choices&&!choice)return {error:"Choisis une des réponses proposées."};
   const answer=choice?.text??command.answer??"";
   teaching.exercise.feedback={answer,correct:answer===exercise.answerFr,answerFr:exercise.answerFr,explanationFr:exercise.explanationFr};
  }
  if(command.type==="next_exercise"){
   if(teaching.exerciseIndex+1===lesson.practice.length){view.teaching=null;view.learningActivities=[];}
   else{teaching.exerciseIndex++;teaching.exercise=exerciseView(teaching.exerciseIndex);}
  }
  if(command.type==="leave_teaching")view.teaching=null;
 }
 view.revision++;save(view);return {view};
}
