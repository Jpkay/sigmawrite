import {granularBankOptions} from "./lib/granular-bank-options";
import {readFileSync,writeFileSync} from "node:fs";
import {runAssessmentCommand,publicAssessmentView,type AssessmentBundle,type AssessmentStore,type StoredSession} from "../src/lib/diagnostic/granular/service";
import {runLearningCheckCommand} from "../src/lib/diagnostic/granular/learning-service";
import {runTeachingCommand} from "../src/lib/diagnostic/granular/teaching-service";
import {readTextualSupport} from "../src/lib/diagnostic/granular/textual-support";
import {createSession} from "../src/lib/diagnostic/granular/session";
import {bindAssessmentRelease} from "../src/lib/diagnostic/granular/release-binding";
import {assembleDraftBank} from "../src/lib/diagnostic/granular/assemble-drafts";
import {FRENCH_DRAFT_EXPANSION_SOURCES} from "../src/lib/diagnostic/granular/draft-expansion-sources";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const candidate=read("docs/diagnostic/v3-scoped-review-candidate.json"),artifact=read("generated/french-taxonomy-v3.json");
const {bank}=assembleDraftBank(read("generated/diagnostic-bank-v3-draft.json"),artifact.taxonomy,FRENCH_DRAFT_EXPANSION_SOURCES.map(name=>read(`generated/french-v3-${name}-expansion.json`)),granularBankOptions(process.argv.slice(2)));
const bundle:AssessmentBundle={assessment:candidate.assessment,bank,taxonomyId:"command-test",bankId:"command-test",teachingContent:candidate.teachingContent,activities:candidate.activities.map((a:object)=>({...a,status:"published"}))};
const reports=[];
for(const profile of ["wrong","mixed"]){
 const id="11111111-1111-4111-8111-111111111111";
 let stored:StoredSession={id,studentId:"synthetic",releaseId:"candidate",state:createSession(bindAssessmentRelease(bundle.assessment,bundle))};
 let at=Date.parse("2026-09-11T10:00:00Z");
 const store:AssessmentStore={load:async(student,session)=>student==="synthetic"&&session===id?structuredClone(stored):null,release:async()=>bundle,save:async(student,session,revision,state)=>{if(student!=="synthetic"||session!==id||revision!==stored.state.revision)return false;stored={...stored,state};return true;}};
 const send=async(command:Record<string,unknown>)=>{const response=await runAssessmentCommand(store,"synthetic",{sessionId:id,revision:stored.state.revision,...command},()=>at);if("error" in response||"conflict" in response)throw Error(JSON.stringify(response));return response;};
 await send({type:"resume"});let count=0,expectedCorrect=0;
 while(stored.state.phase==="assessing"){
  if(++count>150)throw Error("Unbounded diagnostic");
  const view=publicAssessmentView(stored,bundle,at),question=view.question!;
  const entry=bank.items.find(item=>item.itemKey===question.id)!.item;
  const wantCorrect=profile==="mixed"&&count%3!==0;
  const answer=entry.responseType==="mcq"?question.choices.find(choice=>entry.choices!.some(original=>original.text===choice.text&&original.correct===wantCorrect))!.id:wantCorrect?entry.correctAnswer!:"réponse volontairement incorrecte";
  const support=readTextualSupport(entry);
  const supportChoiceId=support?question.supportChoices!.find(choice=>support.choices.some(original=>original.quoteFr===choice.text&&original.correct))!.id:undefined;
  let seconds=bundle.assessment.probes.find(p=>p.id===question.id)!.expectedSeconds;
  while(seconds>30){at+=30000;await send({type:"pulse"});seconds-=30;}
  at+=seconds*1000;
  await send({type:"answer",itemId:question.id,answer,...(supportChoiceId?{supportChoiceId}: {})});
  const actual=stored.state.observations.at(-1)!.correct;
  if(actual!==wantCorrect)throw Error(`Unexpected grading for ${question.id}: wanted ${wantCorrect}, got ${actual}`);
  expectedCorrect+=Number(wantCorrect);
 }
 const view=publicAssessmentView(stored,bundle,at);
 if(!view.learningActivities.length)throw Error("No recommended activity");
 const lessonActivity=view.learningActivities.find(a=>a.kind==="instruction");
 if(profile==="wrong"&&!lessonActivity)throw Error("Weak profile has no initial lesson");
 let completedLesson:string|null=null,practiceResponses=0;
 if(lessonActivity){
  const teach=async(command:Record<string,unknown>)=>{const response=await runTeachingCommand(store,"synthetic",{sessionId:id,revision:stored.state.revision,...command});if("error" in response||"conflict" in response)throw Error(JSON.stringify(response));};
  await teach({type:"start_teaching",activityId:lessonActivity.activityId});
  const lesson=bundle.teachingContent!.find(l=>l.id===stored.state.teaching!.contentId)!;
  const evidenceBefore=JSON.stringify(stored.state.observations);
  await teach({type:"begin_practice"});
  while(stored.state.teaching){
   const teaching=publicAssessmentView(stored,bundle,at).teaching!,exercise=lesson.practice[stored.state.teaching.exerciseIndex];
   const answer=exercise.choices?teaching.exercise!.choices!.find(choice=>choice.text===exercise.answerFr)!.id:exercise.answerFr;
   await teach({type:"answer_practice",exerciseId:exercise.id,answer});
   if(!publicAssessmentView(stored,bundle,at).teaching?.exercise?.feedback)throw Error("No guided feedback");
   practiceResponses++;await teach({type:"next_exercise"});
  }
  if(!stored.state.completedTeachingIds?.includes(lesson.id)||JSON.stringify(stored.state.observations)!==evidenceBefore)throw Error("Lesson completion or evidence isolation failed");
  completedLesson=lesson.id;
 }
 let checkedQuestion:string|null=null;
 const next=publicAssessmentView(stored,bundle,at).learningActivities.find(a=>a.kind==="independent_check");
 if(!next)throw Error("No fresh verification offered after diagnostic or lesson");
 if(next){
  const check=async(command:Record<string,unknown>)=>{const response=await runLearningCheckCommand(store,"synthetic",{sessionId:id,revision:stored.state.revision,...command},()=>at);if("error" in response||"conflict" in response)throw Error(JSON.stringify(response));};
  await check({type:"start_check",activityId:next.activityId});
  const current=publicAssessmentView(stored,bundle,at).learningCheck!;
  const question=current.question!,entry=bank.items.find(item=>item.itemKey===question.id)!.item;
  if(stored.state.observations.some(o=>o.itemId===question.id))throw Error("Learning check repeated an initial item");
  const answer=entry.responseType==="mcq"?question.choices.find(choice=>entry.choices!.some(original=>original.text===choice.text&&original.correct))!.id:entry.correctAnswer!;
  const support=readTextualSupport(entry),supportChoiceId=support?question.supportChoices!.find(choice=>support.choices.some(original=>original.quoteFr===choice.text&&original.correct))!.id:undefined;
  await check({type:"answer_check",checkId:current.id,answer,...(supportChoiceId?{supportChoiceId}: {})});
  if(stored.state.learningCheck||!stored.state.refinements.some(o=>o.itemId===question.id&&o.correct))throw Error("Learning check did not persist evidence");
  checkedQuestion=question.id;
 }
 reports.push({profile,checkedQuestion,questions:count,correct:expectedCorrect,completionReason:stored.state.completionReason,activeMinutes:stored.state.activeSeconds/60,results:view.results.length,firstActivity: view.learningActivities[0].titleFr,completedLesson,practiceResponses});
}
writeFileSync("docs/diagnostic/v3-scoped-command-journey.json",JSON.stringify({candidateChecksum:candidate.checksum,method:"Real server grading and teaching commands, actual candidate content, isolated in-memory store. No production writes; does not verify browser or database persistence. Material history is unavailable in this store, so no novelty confirmation is claimed.",reports},null,2)+"\n");
console.log(JSON.stringify(reports));
