"use client";
import {SkillEvidenceResults} from "./skill-evidence-results";
import {diagnosticProgressPercent,diagnosticProgressText,diagnosticQuestionText,diagnosticAnswerCountText} from "./diagnostic-copy";
import {DIAGNOSTIC_COPY as copy} from "./diagnostic-copy";
import {WritingFeedbackCard} from "./writing-feedback";
import {SkillFeatureResults} from "./skill-feature-results";
import {consumedActivityHref,linkedActivityCommand} from "@/lib/diagnostic/granular/activity-navigation";
import {persistAssessmentDraft,restoreAssessmentDraft} from "@/lib/diagnostic/granular/assessment-draft-cache";
import {persistGuidedDraft,restoreGuidedDraft} from "@/lib/diagnostic/granular/guided-draft-cache";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {replaceStudentState} from "@/lib/student-store";
import {PageHeader} from "@/components/page";
import {Button,buttonVariants} from "@/components/ui/button";
import {AccentTextarea} from "@/components/accent-textarea";
import {ExercisePrompt} from "@/components/exercise-prompt";
import {startGranularDiagnostic,updateGranularDiagnostic,updateGranularLearningCheck,updateGranularTeaching} from "@/lib/actions/granular-diagnostic";
import {reconcileAssessmentResponse,type AssessmentView,type AssessmentResponse} from "@/lib/diagnostic/granular/client-state";
import {QuestionAudio} from "./question-audio";
import {GuidedTeaching,type TeachingCommand} from "./guided-teaching";
import {groupAssessmentResults} from "@/lib/diagnostic/granular/result-groups";
import {StudentResultSummary} from "./student-result-summary";
import {STUDENT_RESULT_SUMMARY_COPY as resultCopy,studentActivityTitle,studentSkillTitle,studentSummaryLabel} from "@/lib/diagnostic/granular/student-results-display";

export function GranularDiagnostic({initialActivityId,start=startGranularDiagnostic,update=updateGranularDiagnostic,updateLearning=updateGranularLearningCheck,updateTeaching=updateGranularTeaching}:{initialActivityId?:string;start?:()=>Promise<AssessmentResponse>;update?:(input:unknown)=>Promise<AssessmentResponse>;updateLearning?:(input:unknown)=>Promise<AssessmentResponse>;updateTeaching?:(input:unknown)=>Promise<AssessmentResponse>}){
 const [view,setView]=useState<AssessmentView|null>(null),[draft,setDraft]=useState(""),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(true),[notice,setNotice]=useState<string|null>(null);
 const [audioPlayedKey,setAudioPlayedKey]=useState<string|null>(null);
 const [supportDraft,setSupportDraft]=useState<{questionId:string;choiceId:string}|null>(null);
 const supportRef=useRef<{questionId:string;choiceId:string}|null>(null);
 const current=useRef<AssessmentView|null>(null),draftRef=useRef(""),locked=useRef(false),pauseQueued=useRef(false),queuedAnswer=useRef<{itemId:string;type:"answer"|"skip"}|null>(null),mounted=useRef(true);
 const accept=useCallback((response:AssessmentResponse)=>{
  if(!mounted.current)return;
  if(response.studentState)replaceStudentState(response.studentState);
  const next=reconcileAssessmentResponse(current.current,draftRef.current,response);
  if(!current.current)next.draft=restoreGuidedDraft(next.view)??next.draft;
  persistGuidedDraft(next.view,next.draft);
  const question=next.view?.learningCheck?.question??next.view?.question;
  if(supportRef.current?.questionId!==question?.id||current.current?.sessionId!==next.view?.sessionId||current.current?.learningCheck?.id!==next.view?.learningCheck?.id){supportRef.current=null;setSupportDraft(null);}
  if(!current.current){
   const restored=restoreAssessmentDraft(next.view);
   if(restored){next.draft=restored.draft;supportRef.current=restored.supportChoiceId&&question?{questionId:question.id,choiceId:restored.supportChoiceId}:null;setSupportDraft(supportRef.current);}
  }
  persistAssessmentDraft(next.view,next.draft,supportRef.current?.choiceId??null);
  current.current=next.view;draftRef.current=next.draft;setView(next.view);setDraft(next.draft);setError(next.error);
 },[]);
 const send=useCallback(async function dispatch(type:"resume"|"pause"|"pulse"|"answer"|"skip"|"start_check"|"answer_check"|"abandon_check"|TeachingCommand,activityId?:string){
  const state=current.current;if(!state)return;
  if(locked.current){if(type==="pause")pauseQueued.current=true;else if((type==="answer"||type==="skip")&&state.question){queuedAnswer.current={itemId:state.question.id,type};setBusy(true);}return;}
  locked.current=true;if(type!=="pulse"){setBusy(true);setNotice(null);}
  try{
   const command={type,sessionId:state.sessionId,revision:state.revision,...(type==="answer"?{itemId:state.question?.id,answer:draftRef.current,...(supportRef.current?{supportChoiceId:supportRef.current.choiceId}:{})}:type==="skip"?{itemId:state.question?.id}:(type==="start_check"||type==="start_teaching")?{activityId}:type==="answer_practice"?{exerciseId:state.teaching?.exercise?.id,answer:draftRef.current}:type==="answer_check"?{checkId:state.learningCheck?.id,answer:draftRef.current,...(supportRef.current?{supportChoiceId:supportRef.current.choiceId}:{})}:type==="abandon_check"?{checkId:state.learningCheck?.id}:{})};
   const teachingCommand=["start_teaching","begin_practice","teaching_hint","answer_practice","next_exercise","leave_teaching"].includes(type);
   const response=await (teachingCommand?updateTeaching:type.endsWith("_check")?updateLearning:update)(command);
   accept(response);
   if(mounted.current&&type==="skip"&&!response.error&&!response.conflict&&response.view)setNotice(copy.skippedNotice);
   if(mounted.current&&type==="answer_check"&&!response.error&&!response.conflict&&response.view&&!response.view.learningCheck)setNotice(response.view.writingFeedback?.assessed===false?copy.writingSavedNotice:copy.answerSavedNotice);
   if(mounted.current&&type==="next_exercise"&&!response.error&&!response.conflict&&response.view&&!response.view.teaching)setNotice(copy.practiceSavedNotice);
   if(pauseQueued.current){
    pauseQueued.current=false;
    const latest=current.current;
    if(latest?.phase==="assessing"&&!latest.paused)accept(await update({type:"pause",sessionId:latest.sessionId,revision:latest.revision}));
   }
  }catch{if(mounted.current)setError(copy.connectionError);}
  finally{
   locked.current=false;if(mounted.current)setBusy(false);
   const queued=queuedAnswer.current;queuedAnswer.current=null;
   if(mounted.current&&queued&&queued.itemId===current.current?.question?.id&&!current.current.paused)void dispatch(queued.type);
  }
 },[accept,update,updateLearning,updateTeaching]);
 useEffect(()=>{
  mounted.current=true;let cancelled=false;
  start().then(async response=>{
   if(cancelled)return;
   accept(response);
   const href=response.view?consumedActivityHref(window.location.href,initialActivityId):null;
   const command=href?linkedActivityCommand(response.view??null,initialActivityId):null;
   if(href)window.history.replaceState(window.history.state,"",href);
   if(command)await send(command.type,command.activityId);
  }).catch(()=>{if(!cancelled)setError(copy.loadingError);}).finally(()=>{if(!cancelled)setBusy(false);});
  return()=>{cancelled=true;mounted.current=false;};
 },[start,accept,send,initialActivityId]);
 useEffect(()=>{
  const timer=setInterval(()=>{if(document.visibilityState==="visible"&&current.current?.phase==="assessing"&&!current.current.paused)void send("pulse");},15000);
  const visibility=()=>{if(document.visibilityState==="hidden"&&current.current?.phase==="assessing"&&!current.current.paused)void send("pause");};
  document.addEventListener("visibilitychange",visibility);
  return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",visibility);};
 },[send]);
 const edit=(value:string)=>{draftRef.current=value;setDraft(value);persistGuidedDraft(current.current,value);persistAssessmentDraft(current.current,value,supportRef.current?.choiceId??null);};
 if(!view)return <><PageHeader title={copy.startTitle} description={copy.loadingDescription}/><p role={error?"alert":"status"}>{error??copy.loading}</p></>;
 const checking=Boolean(view.learningCheck);
 const question=view.learningCheck?.question??view.question;
 return <div className="max-w-4xl">
  <PageHeader title={view.teaching?view.teaching.titleFr:checking?copy.checkTitle:view.phase==="learning"?copy.resultsTitle:copy.startTitle} description={view.teaching?copy.teachingDescription:checking?copy.checkDescription:view.phase==="learning"?copy.resultsDescription:copy.assessmentDescription}/>
  {view.contentReviewStatus==="ongoing"&&<p role="note" className="mb-5 rounded-md border border-border p-4 text-sm text-muted-foreground">{copy.reviewNotice}</p>}
  {notice&&<p role="status" className="mb-5 rounded-md border border-border p-4">{notice}</p>}
  {error&&<p role="alert" className="mb-5 rounded-md border border-border p-4">{error}</p>}
  {view.teaching?<GuidedTeaching teaching={view.teaching} busy={busy} draft={draft} edit={edit} send={type=>void send(type)}/>:view.phase==="assessing"||checking?<>
   {!checking&&<div className="mb-6 grid gap-3 text-sm text-muted-foreground"><div className="flex flex-wrap items-center justify-between gap-3"><p>{diagnosticProgressText(view.answeredCount,view.skippedCount??0,view.remainingSeconds)}</p>{!view.paused&&<Button variant="outline" disabled={busy} onClick={()=>void send("pause")}>{copy.pause}</Button>}</div><div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={copy.timeProgressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={diagnosticProgressPercent(view.remainingSeconds)} aria-valuetext={`Environ ${Math.ceil(view.remainingSeconds/60)} min restantes`}><div className="h-full rounded-full bg-primary" style={{width:`${diagnosticProgressPercent(view.remainingSeconds)}%`}}/></div><p className="text-xs">{copy.adaptiveProgressHelp}</p></div>}
   {view.paused&&!checking?<section className="rounded-xl border border-border p-6"><h2 className="mb-2 text-xl font-semibold">{view.answeredCount||(view.skippedCount??0)?copy.progressSaved:copy.ready}</h2><p className="mb-5 text-muted-foreground">{copy.pauseHelp}</p><Button disabled={busy} onClick={()=>void send("resume")}>{view.answeredCount||question?copy.resume:copy.begin}</Button></section>
   :question?<form onSubmit={event=>{event.preventDefault();if(question.audio&&audioPlayedKey!==`${view.sessionId}:${question.id}:${question.audio.src}`)return;void send(checking?"answer_check":"answer");}} className="rounded-xl border border-border p-5 sm:p-7">
    <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{checking?copy.newCheck:diagnosticQuestionText(view.answeredCount,view.skippedCount??0)}</h2>
    <ExercisePrompt promptFr={question.promptFr} instructionsFr={question.instructionsFr}/>
    {question.audio&&<QuestionAudio key={`${view.sessionId}:${question.id}:${question.audio.src}`} src={question.audio.src} onComplete={()=>setAudioPlayedKey(`${view.sessionId}:${question.id}:${question.audio!.src}`)} onFailure={()=>setAudioPlayedKey(null)}/>}
    {view.learningCheck?.revisionRequired&&<p className="mt-4 text-sm">{view.learningCheck.firstDraft!==null?copy.revisionHelp:copy.firstDraftHelp}</p>}
    {question.responseType==="mcq"?<fieldset disabled={busy} className="my-6 space-y-3"><legend className="sr-only">{copy.chooseAnswer}</legend>{question.choices.map(choice=><label key={choice.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${draft===choice.id?"border-primary bg-primary/5":"border-border"}`}><input type="radio" name="answer" value={choice.id} checked={draft===choice.id} onChange={()=>edit(choice.id)} className="mt-1"/><span>{choice.text}</span></label>)}</fieldset>
    :<div className="my-6"><label htmlFor="granular-answer" className="mb-2 block text-sm font-semibold">{copy.yourAnswer}</label><AccentTextarea id="granular-answer" value={draft} onChange={edit} disabled={busy} maxLength={3000} rows={3} className="w-full rounded-md border border-border bg-background p-3"/></div>}
    {question.supportChoices&&<fieldset disabled={busy} className="my-6 space-y-3"><legend className="mb-3 font-semibold">{copy.supportQuestion}</legend>{question.supportChoices.map(choice=><label key={choice.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"><input type="radio" name="textual-support" checked={supportDraft?.questionId===question.id&&supportDraft.choiceId===choice.id} onChange={()=>{const selected={questionId:question.id,choiceId:choice.id};supportRef.current=selected;setSupportDraft(selected);persistAssessmentDraft(current.current,draftRef.current,selected.choiceId);}} className="mt-1"/><span>{choice.text}</span></label>)}</fieldset>}
    <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy||Boolean(question.audio&&audioPlayedKey!==`${view.sessionId}:${question.id}:${question.audio.src}`)||!draft.trim()||Boolean(question.supportChoices&&supportDraft?.questionId!==question.id)}>{busy?copy.saving:view.learningCheck?.revisionRequired?(view.learningCheck.firstDraft===null?copy.saveFirstDraft:copy.sendRevision):copy.validate}</Button>
    {!checking&&<Button type="button" variant="outline" disabled={busy} onClick={()=>void send("skip")}>{question.audio?copy.skip:copy.dontKnow}</Button>}
    {checking&&<Button type="button" variant="outline" disabled={busy} onClick={()=>void send("abandon_check")}>{copy.skip}</Button>}</div>
   </form>:<p role="status">{copy.preparing}</p>}
  </>:<>
   {view.writingFeedback&&<WritingFeedbackCard feedback={view.writingFeedback}/>}
   <StudentResultSummary results={view.results.map(result=>{const detail=view.skillDetails[result.skillId];return {...result,label:studentSummaryLabel(detail?.labelFr??copy.unverifiedPoint,detail?.mode??result.modes[0].mode),assessmentAvailable:detail?.assessmentAvailable};})}/>
   {view.provisional&&<p className="mb-6 text-muted-foreground">{copy.provisionalHelp}</p>}
   {view.coverage&&view.coverage.deferredSkillCount>0&&<p className="mb-6 rounded-lg border border-border p-4 text-sm text-muted-foreground">{copy.coverageHelp}</p>}
   <section className="mb-8"><h2 className="mb-3 text-xl font-semibold">{resultCopy.nextActivity}</h2>{view.learningActivities?.[0]?<ActivityCard activity={view.learningActivities[0]} busy={busy} send={send}/>:null}{(view.learningActivities?.length??0)>1&&<details className="mt-3 rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{resultCopy.moreActivities}</summary><div className="mt-3 space-y-3">{view.learningActivities!.slice(1).map(activity=><ActivityCard key={activity.activityId} activity={activity} busy={busy} send={send}/>)}</div></details>}{view.deferredReviewCount>0&&<p className="mt-3 text-sm text-muted-foreground">{copy.deferredHelp}</p>}{!view.learningActivities?.length&&!view.optionalLearningActivities?.length&&(view.deferredReviewCount===0||view.missingLearningActivityCount>0)&&<p className="text-muted-foreground">{copy.activitiesUnavailable}</p>}{Boolean(view.optionalLearningActivities?.length)&&<section className="mt-6"><h3 className="text-lg font-semibold">{copy.optionalTitle}</h3><p className="my-2 text-sm text-muted-foreground">{copy.optionalHelp}</p><ul className="space-y-3">{view.optionalLearningActivities?.map(activity=><li key={activity.activityId} className="rounded-lg border border-border p-4"><p className="mb-3 font-semibold">{studentActivityTitle({...activity,action:'learn'})}</p><Button variant="outline" disabled={busy} onClick={()=>void send("start_teaching",activity.activityId)}>{copy.openLesson}</Button></li>)}</ul></section>}<Link href="/student" className={`${buttonVariants()} mt-5`}>{copy.viewPathway}</Link></section>
   <p className="mb-6"><Link href={`/student/diagnostic/review?session=${view.sessionId}`} className="text-primary underline">{copy.reviewAnswers}</Link></p>
   <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer text-xl font-semibold">{copy.detailsTitle}</summary><div className="mt-4">{groupAssessmentResults(view.results,view.skillDetails).map(group=><details key={group.id} className="mb-3 rounded-lg border border-border p-4"><summary className="cursor-pointer font-semibold">{group.labelFr}</summary><ul className="mt-4 divide-y divide-border">{group.results.map(({result,detail})=><li key={result.skillId} className="py-3"><p>{studentSkillTitle(detail?.labelFr??copy.unverifiedPoint)}</p><p className="text-sm text-muted-foreground">{copy.mode[detail?.mode??result.modes[0]?.mode]??""} · {detail?.assessmentAvailable===false?copy.questionsComing:copy.status[result.status]} · {diagnosticAnswerCountText(result.modes.reduce((sum,mode)=>sum+mode.distinctItems,0))}</p><SkillEvidenceResults result={result}/><SkillFeatureResults result={result}/></li>)}</ul></details>)}</div></details>
  </>}
 </div>;
}

type Activity=NonNullable<AssessmentView["learningActivities"]>[number];
function ActivityCard({activity,busy,send}:{activity:Activity;busy:boolean;send:(type:"start_check"|"start_teaching",activityId:string)=>Promise<void>}){
 return <article className="rounded-lg border border-border p-4"><p className="font-semibold">{studentActivityTitle(activity)}</p><p className="my-2 text-sm text-muted-foreground">{activity.action==="verify"?copy.verifyDescription:activity.action==="learn"?copy.learnDescription:copy.consolidateDescription}</p>{activity.kind==="independent_check"?<Button variant="outline" disabled={busy} onClick={()=>void send("start_check",activity.activityId)}>{copy.verifyPoint}</Button>:activity.contentId?<Button variant="outline" disabled={busy} onClick={()=>void send("start_teaching",activity.activityId)}>{copy.startActivity}</Button>:<Link href={activity.href} className={buttonVariants({variant:"outline"})}>{copy.startActivity}</Link>}</article>;
}
