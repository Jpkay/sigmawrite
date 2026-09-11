/** Isolated content integration fixtures. No database writes or student claims. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createSession} from '../src/lib/diagnostic/granular/session';
import {bindAssessmentRelease} from '../src/lib/diagnostic/granular/release-binding';
import {publicAssessmentView,type AssessmentBundle,type AssessmentStore,type StoredSession} from '../src/lib/diagnostic/granular/service';
import {runTeachingCommand} from '../src/lib/diagnostic/granular/teaching-service';
import {runLearningCheckCommand} from '../src/lib/diagnostic/granular/learning-service';
import {readTextualSupport} from '../src/lib/diagnostic/granular/textual-support';
import {questionAssessedMaterialKeys,teachingMaterialKeys} from '../src/lib/diagnostic/granular/material-annotations';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const candidate=read('docs/diagnostic/v3-scoped-review-candidate.json');
const bundle:AssessmentBundle={assessment:candidate.assessment,bank:read('generated/diagnostic-bank-v3-consolidated-draft.json'),taxonomyId:'fixture',bankId:'fixture',teachingContent:candidate.teachingContent,activities:candidate.activities.map((a:object)=>({...a,status:'published'}))};
const lessons=bundle.teachingContent!.filter(l=>l.id.includes(':reference-foundation:')||l.id==='french-v3-teaching:narrative-demonstrative-reference'||l.id.startsWith('french-v3-teaching:demonstrative-reference:')||l.id.startsWith('french-v3-teaching:lexical-chain:'));
if(lessons.length!==10)throw Error('Expected ten reference lessons');
const reports=[];
for(const lesson of lessons){
 const skill=bundle.assessment.skills.find(s=>s.nodeKey===lesson.nodeKey&&s.facetKey===lesson.facetKey&&s.modes.includes(lesson.mode))!;
 const prereqs=new Set<string>();
 const visit=(id:string)=>{if(prereqs.has(id))return;prereqs.add(id);bundle.assessment.skills.find(s=>s.id===id)!.prerequisites.forEach(visit);};
 skill.prerequisites.forEach(visit);
 const initial=bundle.assessment.probes.filter(p=>p.usage==='initial'&&(prereqs.has(p.skillId)||p.skillId===skill.id));
 const id='11111111-1111-4111-8111-111111111111';
 let stored:StoredSession={id,studentId:'synthetic-reference',releaseId:'fixture',state:{...createSession(bindAssessmentRelease(bundle.assessment,bundle)),phase:'learning',completionReason:'time_budget',observations:initial.map((p,index)=>({...p,itemId:p.id,correct:p.skillId!==skill.id,unaided:true,occasionId:p.skillId===skill.id?'fixture-day':`fixture-prerequisite-day-${index%2}`,activeSeconds:p.expectedSeconds,materialReceipt:{presentationId:`synthetic:${p.id}`,sourceChecksum:'synthetic-history',historyComplete:true,firstRecordedKeys:p.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:p.assessedMaterialKeys}}))}};
 const store:AssessmentStore={load:async(student,session)=>student===stored.studentId&&session===id?structuredClone(stored):null,release:async()=>bundle,save:async(student,session,revision,state)=>{if(student!==stored.studentId||session!==id||revision!==stored.state.revision)return false;stored={...stored,state};return true;}};
 const view=()=>publicAssessmentView(stored,bundle);
 const instruction=view().learningActivities.find(a=>a.contentId===lesson.id);
 if(!instruction)console.log(JSON.stringify({target:skill.id,initial:initial.filter(p=>p.skillId===skill.id).length,result:view().results.find(r=>r.skillId===skill.id),prereqs:[...prereqs].map(id=>view().results.find(r=>r.skillId===id))}));
 if(!instruction)throw Error(`Target lesson not offered: ${lesson.id}; offered ${JSON.stringify(view().learningActivities)}`);
 const send=async(command:Record<string,unknown>)=>{const result=await runTeachingCommand(store,stored.studentId,{sessionId:id,revision:stored.state.revision,...command});if('error' in result||'conflict' in result)throw Error(JSON.stringify(result));};
 const evidenceBefore=JSON.stringify([stored.state.observations,stored.state.refinements]);
 await send({type:'start_teaching',activityId:instruction.activityId});await send({type:'begin_practice'});
 let guided=0;
 for(const exercise of lesson.practice){
  const current=view().teaching!.exercise!;
  // Include a deliberate guided error; it must remain feedback, not mastery evidence.
  const answer=guided===0?(exercise.choices?current.choices!.find(c=>c.text!==exercise.answerFr)!.id:'réponse incorrecte'):exercise.choices?current.choices!.find(c=>c.text===exercise.answerFr)!.id:exercise.answerFr;
  await send({type:'answer_practice',exerciseId:exercise.id,answer});
  if(view().teaching?.exercise?.feedback?.correct!==(guided!==0))throw Error('Guided feedback mismatch');
  await send({type:'next_exercise'});guided++;
 }
 if(JSON.stringify([stored.state.observations,stored.state.refinements])!==evidenceBefore)throw Error('Guided practice altered evidence');
 if(!stored.state.completedTeachingIds?.includes(lesson.id))throw Error('Lesson completion missing');
 const check=view().learningActivities.find(a=>a.skillId===skill.id&&a.kind==='independent_check');if(!check)throw Error(`No target follow-up: ${lesson.id}`);
 const checkSend=async(command:Record<string,unknown>)=>{const r=await runLearningCheckCommand(store,stored.studentId,{sessionId:id,revision:stored.state.revision,...command},()=>Date.parse('2026-09-12T10:00:00Z'));if('error' in r||'conflict' in r)throw Error(JSON.stringify(r));};
 await checkSend({type:'start_check',activityId:check.activityId});
 const current=view().learningCheck!,q=current.question!,entry=bundle.bank.items.find(i=>i.itemKey===q.id)!.item;
 if(initial.some(p=>p.id===q.id))throw Error('Check reused an initial item');
 const taught=new Set(teachingMaterialKeys(lesson));if(questionAssessedMaterialKeys(entry).some(k=>taught.has(k)))throw Error('Check reused guided material');
 const answer=entry.responseType==='mcq'?q.choices.find(c=>entry.choices!.some(o=>o.correct&&o.text===c.text))!.id:entry.correctAnswer!;
 const support=readTextualSupport(entry),supportChoiceId=support?q.supportChoices!.find(c=>support.choices.some(o=>o.correct&&o.quoteFr===c.text))!.id:undefined;
 await checkSend({type:'answer_check',checkId:current.id,answer,...(supportChoiceId?{supportChoiceId}:{})});
 if(stored.state.learningCheck||!stored.state.refinements.some(o=>o.itemId===q.id&&o.correct))throw Error('Independent evidence missing');
 const reloaded=await store.load(stored.studentId,id);if(JSON.stringify(reloaded)!==JSON.stringify(stored))throw Error('Store reload mismatch');
 reports.push({skillId:skill.id,lessonId:lesson.id,guidedExercises:guided,deliberateGuidedErrors:1,independentQuestionId:q.id,independentCorrect:true,guidedEvidenceIsolated:true,reloadPreserved:true});
}
const output={method:'Constructed prerequisite-success/target-gap profiles, real scoped content and server commands in an isolated in-memory store. Not student data, browser proof, multi-occasion validation or educational calibration.',candidateChecksum:candidate.checksum,reports};
writeFileSync('docs/diagnostic/reference-learning-journeys-2026-09-11.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(reports));
