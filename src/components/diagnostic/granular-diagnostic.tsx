"use client";
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
const STATUS={mastered:"Bien acquis",missing:"À travailler",fragile:"À consolider",uncertain:"À confirmer",unknown:"Pas encore vérifié"};
const MODE={recognition:"Reconnaître",production:"Écrire la réponse",interpretation:"Comprendre",independent_production:"Utiliser dans un texte personnel"};

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
   if(mounted.current&&type==="skip"&&!response.error&&!response.conflict&&response.view)setNotice("Question passée. Ce point reste à vérifier.");
   if(mounted.current&&type==="answer_check"&&!response.error&&!response.conflict&&response.view&&!response.view.learningCheck)setNotice(response.view.writingFeedback?.assessed===false?"Ton texte est enregistré. Ce point reste à vérifier.":"Ta réponse est enregistrée et ton bilan a été mis à jour.");
   if(mounted.current&&type==="next_exercise"&&!response.error&&!response.conflict&&response.view&&!response.view.teaching)setNotice("Ton entraînement est enregistré. Une nouvelle vérification permettra de voir ce que tu sais faire sans aide.");
   if(pauseQueued.current){
    pauseQueued.current=false;
    const latest=current.current;
    if(latest?.phase==="assessing"&&!latest.paused)accept(await update({type:"pause",sessionId:latest.sessionId,revision:latest.revision}));
   }
  }catch{if(mounted.current)setError("La connexion a été interrompue. Ta réponse est conservée ; réessaie.");}
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
  }).catch(()=>{if(!cancelled)setError("Impossible de charger ton diagnostic. Recharge la page pour réessayer.");}).finally(()=>{if(!cancelled)setBusy(false);});
  return()=>{cancelled=true;mounted.current=false;};
 },[start,accept,send,initialActivityId]);
 useEffect(()=>{
  const timer=setInterval(()=>{if(document.visibilityState==="visible"&&current.current?.phase==="assessing"&&!current.current.paused)void send("pulse");},15000);
  const visibility=()=>{if(document.visibilityState==="hidden"&&current.current?.phase==="assessing"&&!current.current.paused)void send("pause");};
  document.addEventListener("visibilitychange",visibility);
  return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",visibility);};
 },[send]);
 const edit=(value:string)=>{draftRef.current=value;setDraft(value);persistGuidedDraft(current.current,value);persistAssessmentDraft(current.current,value,supportRef.current?.choiceId??null);};
 if(!view)return <><PageHeader title="Ton point de départ" description="Quelques questions pour découvrir ce que tu sais déjà et préparer la suite."/><p role={error?"alert":"status"}>{error??"Chargement de ton diagnostic…"}</p></>;
 const checking=Boolean(view.learningCheck);
 const question=view.learningCheck?.question??view.question;
 const minutes=Math.ceil(view.remainingSeconds/60);
 return <div className="max-w-4xl">
  <PageHeader title={view.teaching?view.teaching.titleFr:checking?"Vérifions ce que tu sais":view.phase==="learning"?"Tes acquis et tes prochaines étapes":"Ton point de départ"} description={view.teaching?"Une explication, puis quelques essais pour apprendre à ton rythme.":checking?"Réponds sans aide. Cette nouvelle question permettra de préciser ton bilan.":view.phase==="learning"?"Tu peux commencer à apprendre. Nous vérifierons les points encore incertains au fil de tes activités.":"Environ 35 minutes, avec des pauses quand tu veux. Les questions s’adaptent à tes réponses."}/>
  {view.contentReviewStatus==="ongoing"&&<p role="note" className="mb-5 rounded-md border border-border p-4 text-sm text-muted-foreground">Nous vérifions encore les questions et les activités de ce parcours. Tu peux apprendre dès maintenant ; ton bilan pourra être ajusté.</p>}
  {notice&&<p role="status" className="mb-5 rounded-md border border-border p-4">{notice}</p>}
  {error&&<p role="alert" className="mb-5 rounded-md border border-border p-4">{error}</p>}
  {view.teaching?<GuidedTeaching teaching={view.teaching} busy={busy} draft={draft} edit={edit} send={type=>void send(type)}/>:view.phase==="assessing"||checking?<>
   {!checking&&<div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
    <p>{view.answeredCount} réponse{view.answeredCount===1?"":"s"} enregistrée{view.answeredCount===1?"":"s"}{view.skippedCount>0?` · ${view.skippedCount} question${view.skippedCount===1?"":"s"} passée${view.skippedCount===1?"":"s"}`:""} · environ {minutes} min restantes</p>
    {!view.paused&&<Button variant="outline" disabled={busy} onClick={()=>void send("pause")}>Faire une pause</Button>}
   </div>}
   {view.paused&&!checking?<section className="rounded-xl border border-border p-6"><h2 className="mb-2 text-xl font-semibold">{view.answeredCount||(view.skippedCount??0)?"Ta progression est enregistrée":"Prêt à commencer ?"}</h2><p className="mb-5 text-muted-foreground">Prends ton temps. Tu peux quitter cette page et revenir plus tard.</p><Button disabled={busy} onClick={()=>void send("resume")}>{view.answeredCount||question?"Reprendre":"Commencer"}</Button></section>
   :question?<form onSubmit={event=>{event.preventDefault();if(question.audio&&audioPlayedKey!==`${view.sessionId}:${question.id}:${question.audio.src}`)return;void send(checking?"answer_check":"answer");}} className="rounded-xl border border-border p-5 sm:p-7">
    <h2 className="mb-4 text-sm font-semibold text-muted-foreground">{checking?"Une nouvelle vérification":`Question ${view.answeredCount+(view.skippedCount??0)+1}`}</h2>
    <ExercisePrompt promptFr={question.promptFr} instructionsFr={question.instructionsFr}/>
    {question.audio&&<QuestionAudio key={`${view.sessionId}:${question.id}:${question.audio.src}`} src={question.audio.src} onComplete={()=>setAudioPlayedKey(`${view.sessionId}:${question.id}:${question.audio!.src}`)} onFailure={()=>setAudioPlayedKey(null)}/>}
    {view.learningCheck?.revisionRequired&&<p className="mt-4 text-sm">{view.learningCheck.firstDraft!==null?"Ta première version est enregistrée. Relis ton texte et améliore ce qui te semble nécessaire. Tu peux aussi le garder tel quel.":"Écris d’abord ta première version. Tu pourras ensuite la relire et la modifier."}</p>}
    {question.responseType==="mcq"?<fieldset disabled={busy} className="my-6 space-y-3"><legend className="sr-only">Choisis ta réponse</legend>{question.choices.map(choice=><label key={choice.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${draft===choice.id?"border-primary bg-primary/5":"border-border"}`}><input type="radio" name="answer" value={choice.id} checked={draft===choice.id} onChange={()=>edit(choice.id)} className="mt-1"/><span>{choice.text}</span></label>)}</fieldset>
    :<div className="my-6"><label htmlFor="granular-answer" className="mb-2 block text-sm font-semibold">Ta réponse</label><AccentTextarea id="granular-answer" value={draft} onChange={edit} disabled={busy} maxLength={3000} rows={3} className="w-full rounded-md border border-border bg-background p-3"/></div>}
    {question.supportChoices&&<fieldset disabled={busy} className="my-6 space-y-3"><legend className="mb-3 font-semibold">Quel passage justifie ta réponse ?</legend>{question.supportChoices.map(choice=><label key={choice.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"><input type="radio" name="textual-support" checked={supportDraft?.questionId===question.id&&supportDraft.choiceId===choice.id} onChange={()=>{const selected={questionId:question.id,choiceId:choice.id};supportRef.current=selected;setSupportDraft(selected);persistAssessmentDraft(current.current,draftRef.current,selected.choiceId);}} className="mt-1"/><span>{choice.text}</span></label>)}</fieldset>}
    <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy||Boolean(question.audio&&audioPlayedKey!==`${view.sessionId}:${question.id}:${question.audio.src}`)||!draft.trim()||Boolean(question.supportChoices&&supportDraft?.questionId!==question.id)}>{busy?"Enregistrement…":view.learningCheck?.revisionRequired?(view.learningCheck.firstDraft===null?"Enregistrer ma première version":"Envoyer ma version relue"):"Valider"}</Button>
    {!checking&&<Button type="button" variant="outline" disabled={busy} onClick={()=>void send("skip")}>{question.audio?"Passer cette question":"Je ne sais pas"}</Button>}
    {checking&&<Button type="button" variant="outline" disabled={busy} onClick={()=>void send("abandon_check")}>Passer cette question</Button>}</div>
   </form>:<p role="status">Préparation de la prochaine question…</p>}
  </>:<>
   {view.writingFeedback&&<WritingFeedbackCard feedback={view.writingFeedback}/>}
   {view.provisional&&<p className="mb-6 text-muted-foreground">Ce premier bilan est provisoire. « Pas encore vérifié » ne veut pas dire que tu ne sais pas le faire.</p>}
   {view.coverage&&view.coverage.deferredSkillCount>0&&<p className="mb-6 rounded-lg border border-border p-4 text-sm text-muted-foreground">Les questions disponibles ne couvrent pas encore tous les points de ce bilan. Les points indiqués « Questions à venir » n’ont pas été évalués et ne sont pas considérés comme des difficultés.</p>}
   <section className="mb-8"><h2 className="mb-3 text-xl font-semibold">Pour commencer</h2><ol className="space-y-3">{(view.learningActivities??[]).map(activity=><li key={activity.activityId} className="rounded-lg border border-border p-4"><p className="font-semibold">{activity.titleFr}</p><p className="my-2 text-sm text-muted-foreground">{activity.action==="verify"?"Vérifier ce point avec une nouvelle question.":activity.action==="learn"?"Découvrir l’explication, puis s’entraîner.":"Consolider cet acquis."}</p><>{activity.kind==="independent_check"?<Button variant="outline" disabled={busy} onClick={()=>void send("start_check",activity.activityId)}>Vérifier ce point</Button>:activity.contentId?<Button variant="outline" disabled={busy} onClick={()=>void send("start_teaching",activity.activityId)}>Commencer cette activité</Button>:<Link href={activity.href} className={buttonVariants({variant:"outline"})}>Commencer cette activité</Link>}</></li>)}</ol>{view.deferredReviewCount>0&&<p className="mt-3 text-sm text-muted-foreground">Tu as déjà donné assez de réponses aujourd’hui sur certains points. Nous les vérifierons un autre jour pour confirmer tes acquis.</p>}{!view.learningActivities?.length&&(view.deferredReviewCount===0||view.missingLearningActivityCount>0)&&<p className="text-muted-foreground">Ton bilan est enregistré. Tes activités personnalisées ne sont pas encore disponibles.</p>}<Link href="/student" className={`${buttonVariants()} mt-5`}>Voir mon parcours</Link></section>
   <p className="mb-6"><Link href={`/student/diagnostic/review?session=${view.sessionId}`} className="text-primary underline">Revoir mes réponses au diagnostic</Link></p>
   <section><h2 className="mb-4 text-xl font-semibold">Ton bilan détaillé</h2>{groupAssessmentResults(view.results,view.skillDetails).map(group=><details key={group.id} className="mb-3 rounded-lg border border-border p-4"><summary className="cursor-pointer font-semibold">{group.labelFr}</summary><ul className="mt-4 divide-y divide-border">{group.results.map(({result,detail})=><li key={result.skillId} className="py-3"><p>{detail?.labelFr??"Point à vérifier"}</p><p className="text-sm text-muted-foreground">{MODE[detail?.mode??result.modes[0]?.mode]??""} · {detail?.assessmentAvailable===false?"Questions à venir":STATUS[result.status]} · {result.modes.reduce((sum,mode)=>sum+mode.distinctItems,0)} réponse(s)</p><SkillFeatureResults result={result}/></li>)}</ul></details>)}</section>
  </>}
 </div>;
}
