"use client";
import {DIAGNOSTIC_COPY,teachingProgressText} from "./diagnostic-copy";
import {useState} from "react";
import {QuestionAudio} from "./question-audio";
import {Button} from "@/components/ui/button";
import {AccentTextarea} from "@/components/accent-textarea";
import type {AssessmentView} from "@/lib/diagnostic/granular/client-state";
const copy=DIAGNOSTIC_COPY.child;
export type TeachingCommand="start_teaching"|"begin_practice"|"teaching_hint"|"answer_practice"|"next_exercise"|"leave_teaching";
export function GuidedTeaching({teaching,busy,draft,edit,send}:{teaching:NonNullable<AssessmentView["teaching"]>;busy:boolean;draft:string;edit:(value:string)=>void;send:(type:TeachingCommand)=>void}){
 const exercise=teaching.exercise;
 const [played,setPlayed]=useState<string|null>(null);
 const audioKey=exercise?.audio?`${teaching.activityId}:${exercise.id}:${exercise.audio.src}`:null;
 const canAnswer=!audioKey||played===audioKey;
 return <section className="rounded-xl border border-border p-5 sm:p-7">
  {teaching.phase==="lesson"?<>
   <h2 className="mb-5 text-xl font-semibold">{teaching.learnerQuestionFr}</h2>
   <ol className="space-y-6">{teaching.steps.map((step,index)=><li key={index}><p className="mb-2 whitespace-pre-line font-semibold">{step.exampleFr}</p><p className="text-muted-foreground">{step.explanationFr}</p>{step.audio&&<QuestionAudio key={step.audio.src} src={step.audio.src} onComplete={()=>{}} onFailure={()=>{}} teaching/>}</li>)}</ol>
   <p className="mt-6 rounded-lg bg-primary/5 p-4">{teaching.takeawayFr}</p>
   <p className="my-5 text-sm text-muted-foreground">{teaching.boundaryFr}</p>
   <Button disabled={busy} onClick={()=>send("begin_practice")}>{copy.beginPractice}</Button>
  </>:exercise?<form onSubmit={event=>{event.preventDefault();if(canAnswer&&!busy&&!exercise.feedback&&draft.trim())send("answer_practice");}}>
   <p className="mb-3 text-sm text-muted-foreground">{teachingProgressText(teaching.exerciseIndex,teaching.totalExercises)}</p>
   <h2 className="mb-5 whitespace-pre-line text-lg font-semibold">{exercise.promptFr}</h2>
   {exercise.audio&&<QuestionAudio key={audioKey} src={exercise.audio.src} onComplete={()=>setPlayed(audioKey)} onFailure={()=>setPlayed(null)} teaching/>}
   {!exercise.feedback?<>
    {exercise.choices?<fieldset disabled={busy} className="mb-4 space-y-3"><legend className="sr-only">{copy.chooseAnswer}</legend>{exercise.choices.map(choice=><label key={choice.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${draft===choice.id?"border-primary bg-primary/5":"border-border"}`}><input type="radio" name="guided-choice" checked={draft===choice.id} onChange={()=>edit(choice.id)} className="mt-1"/><span>{choice.text}</span></label>)}</fieldset>:<>
    <label htmlFor="guided-answer" className="mb-2 block text-sm font-semibold">{copy.yourAnswer}</label>
    <AccentTextarea id="guided-answer" value={draft} onChange={edit} disabled={busy} maxLength={1000} rows={3} className="mb-4 w-full rounded-md border border-border bg-background p-3"/>
    </>}
    {exercise.hintFr&&<p role="status" className="mb-4 rounded-md bg-primary/5 p-3">{exercise.hintFr}</p>}
    <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy||!draft.trim()||!canAnswer}>{busy?copy.saving:copy.checkAnswer}</Button>
     {!exercise.hintFr&&<Button type="button" variant="outline" disabled={busy} onClick={()=>send("teaching_hint")}>{copy.hint}</Button>}
    </div>
   </>:<>
    <div role="status" className="mb-5 space-y-3 rounded-lg bg-primary/5 p-4">
     <p className="font-semibold">{exercise.feedback.correct?copy.correct:copy.correction}</p>
     <p>{copy.answerPrefix} {exercise.feedback.answer}</p>
     <p className="font-semibold">{exercise.feedback.answerFr}</p><p>{exercise.feedback.explanationFr}</p>
    </div>
    <Button type="button" disabled={busy} onClick={()=>send("next_exercise")}>{teaching.exerciseIndex+1===teaching.totalExercises?copy.finishPractice:copy.nextExercise}</Button>
   </>}
  </form>:<p role="status">{copy.loadingExercise}</p>}
  <div className="mt-6 border-t border-border pt-4"><p className="mb-3 text-sm text-muted-foreground">{copy.leaveHelp}</p><Button variant="ghost" disabled={busy} onClick={()=>send("leave_teaching")}>{copy.leave}</Button></div>
 </section>;
}
