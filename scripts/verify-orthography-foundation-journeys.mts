/** Isolated content integration fixtures. No database writes or student claims. */
import {recordMaterialDelivery,type MaterialDeliveryStore} from '../src/lib/diagnostic/granular/material-delivery';
import type {MaterialReceipt} from '../src/lib/diagnostic/granular/material-receipt';
import {checksum} from '../src/lib/taxonomy/validate';
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
const imperativeVerbs=process.argv.includes('--imperatif-verbs');
const imperativeFamilies=process.argv.includes('--imperatif-families');
const complexNegationOnly=process.argv.includes('--complex-negation');
const mainIdeaOnly=process.argv.includes('--sentence-main-idea');
const completiveOnly=process.argv.includes('--completive-production');
const subjunctiveOnly=process.argv.includes('--subjonctif');
const subjunctiveFamilies=process.argv.includes('--subjonctif-families');
if([imperativeVerbs,imperativeFamilies,complexNegationOnly,mainIdeaOnly,completiveOnly,subjunctiveOnly,subjunctiveFamilies].filter(Boolean).length>1)throw Error('Select one content family');
const lessons=bundle.teachingContent!.filter(l=>imperativeVerbs?l.id.startsWith('french-v3-teaching:imperatif-present:verb:'):imperativeFamilies?(l.id.startsWith('french-v3-teaching:imperatif-present:pattern:')||l.id==='french-v3-teaching:imperatif:recognition'):complexNegationOnly?l.id==='french-v3-teaching:complex-negation:recognition':mainIdeaOnly?l.nodeKey==='identifier_idee_phrase':subjunctiveFamilies?l.id.startsWith('french-v3-teaching:subjonctif-present:pattern:'):subjunctiveOnly?(l.nodeKey==='reconnaitre_subjonctif_present'||(l.nodeKey==='produire_subjonctif_present_frequent'&&l.facetKey?.includes('::verb:'))):completiveOnly?l.id==='french-v3-teaching:completive:production':['segmenter_syllabes_ecrites','associer_phoneme_graphie_frequente','employer_cedille'].includes(l.nodeKey));
if(lessons.length!==(imperativeVerbs?4:imperativeFamilies?5:complexNegationOnly?1:mainIdeaOnly?3:subjunctiveFamilies?4:subjunctiveOnly?15:completiveOnly?1:6))throw Error('Unexpected number of selected lessons');
const reports=[];
for(const lesson of lessons){
 const skill=bundle.assessment.skills.find(s=>s.nodeKey===lesson.nodeKey&&s.facetKey===lesson.facetKey&&s.modes.includes(lesson.mode))!;
 const prereqs=new Set<string>();
 const visit=(id:string)=>{if(prereqs.has(id))return;prereqs.add(id);bundle.assessment.skills.find(s=>s.id===id)!.prerequisites.forEach(visit);};
 skill.prerequisites.forEach(visit);
 const initial=bundle.assessment.probes.filter(p=>p.usage==='initial'&&(prereqs.has(p.skillId)||p.skillId===skill.id));
 const id='11111111-1111-4111-8111-111111111111';
 let stored:StoredSession={id,studentId:'synthetic-reference',releaseId:'fixture',state:{...createSession(bindAssessmentRelease(bundle.assessment,bundle)),phase:'learning',completionReason:'time_budget',observations:initial.map((p,index)=>({...p,itemId:p.id,correct:p.skillId!==skill.id,unaided:true,occasionId:p.skillId===skill.id?'fixture-day':`fixture-prerequisite-day-${index%2}`,activeSeconds:p.expectedSeconds,materialReceipt:{presentationId:`synthetic:${p.id}`,sourceChecksum:'synthetic-history',historyComplete:true,firstRecordedKeys:p.materialKeys??[],previouslySeenKeys:[],assessedMaterialKeys:p.assessedMaterialKeys}}))}};
 const student=stored.studentId;
 const exposed=new Set<string>(initial.flatMap(p=>p.materialKeys??[])),receipts=new Map<string,{fingerprint:string,receipt:MaterialReceipt}>();
 const store:MaterialDeliveryStore={
  load:async(s,key)=>s===student&&key===id?structuredClone(stored):null,
  release:async()=>bundle,
  save:async(s,key,revision,state)=>{if(s!==student||key!==id||revision!==stored.state.revision)return false;stored={...stored,state};return true;},
  knownMaterialKeys:async(s,keys)=>{if(s!==student)throw Error('Wrong fixture owner');return keys.filter(k=>exposed.has(k));},
  materialHistoryComplete:async(s,p)=>s===student&&receipts.has(p),
  recordMaterialPresentation:async(input)=>{
   if(input.studentId!==student)throw Error('Wrong delivery owner');const keys=[...new Set(input.materialKeys)].sort(),fingerprint=checksum({source:input.sourceChecksum,keys});
   const old=receipts.get(input.presentationId);if(old){if(old.fingerprint!==fingerprint)throw Error('Presentation was changed');return;}
   receipts.set(input.presentationId,{fingerprint,receipt:{firstRecordedKeys:keys.filter(k=>!exposed.has(k)),previouslySeenKeys:keys.filter(k=>exposed.has(k))}});keys.forEach(k=>exposed.add(k));
  },
  loadMaterialReceipt:async(input)=>{if(input.studentId!==student)throw Error('Wrong receipt owner');const r=receipts.get(input.presentationId);if(!r)return null;if(r.fingerprint!==checksum({source:input.sourceChecksum,keys:[...new Set(input.materialKeys)].sort()}))throw Error('Receipt content mismatch');return structuredClone(r.receipt);},
 };
 const view=()=>publicAssessmentView(stored,bundle);
 const instruction=view().learningActivities.find(a=>a.contentId===lesson.id);
 if(!instruction)console.log(JSON.stringify({target:skill.id,initial:initial.filter(p=>p.skillId===skill.id).length,result:view().results.find(r=>r.skillId===skill.id),prereqs:[...prereqs].map(id=>view().results.find(r=>r.skillId===id))}));
 if(!instruction)throw Error(`Target lesson not offered: ${lesson.id}; offered ${JSON.stringify(view().learningActivities)}`);
 const send=async(command:Record<string,unknown>)=>{const result=await runTeachingCommand(store,stored.studentId,{sessionId:id,revision:stored.state.revision,...command});if('error' in result||'conflict' in result)throw Error(JSON.stringify(result));await recordMaterialDelivery(store,student,result);};
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
 const checkSend=async(command:Record<string,unknown>)=>{const r=await runLearningCheckCommand(store,stored.studentId,{sessionId:id,revision:stored.state.revision,...command},()=>Date.parse('2026-09-12T10:00:00Z'));if('error' in r||'conflict' in r)throw Error(JSON.stringify(r));await recordMaterialDelivery(store,student,r);};
 await checkSend({type:'start_check',activityId:check.activityId});
 const current=view().learningCheck!,q=current.question!,entry=bundle.bank.items.find(i=>i.itemKey===q.id)!.item;
 if(initial.some(p=>p.id===q.id))throw Error('Check reused an initial item');
 const taught=new Set(teachingMaterialKeys(lesson));if(questionAssessedMaterialKeys(entry).some(k=>taught.has(k)))throw Error('Check reused guided material');
 const answer=entry.responseType==='mcq'?q.choices.find(c=>entry.choices!.some(o=>o.correct&&o.text===c.text))!.id:entry.correctAnswer!;
 const support=readTextualSupport(entry),supportChoiceId=support?q.supportChoices!.find(c=>support.choices.some(o=>o.correct&&o.quoteFr===c.text))!.id:undefined;
 await checkSend({type:'answer_check',checkId:current.id,answer,...(supportChoiceId?{supportChoiceId}:{})});
 if(stored.state.learningCheck||!stored.state.refinements.some(o=>o.itemId===q.id&&o.correct))throw Error('Independent evidence missing');
 let independentChecks=1;
 const required=complexNegationOnly?21:lesson.nodeKey==='associer_phoneme_graphie_frequente'?16:lesson.nodeKey==='segmenter_syllabes_ecrites'?12:1;
 while(independentChecks<required){
  const next=view().learningActivities.find(a=>a.skillId===skill.id&&a.kind==='independent_check');
  if(!next)throw Error(`Follow-up stopped after ${independentChecks} checks: ${skill.id}`);
  await checkSend({type:'start_check',activityId:next.activityId});
  const check=view().learningCheck!,question=check.question!,item=bundle.bank.items.find(i=>i.itemKey===question.id)!.item;
  const answer=item.responseType==='mcq'?question.choices.find(c=>item.choices!.some(o=>o.correct&&o.text===c.text))!.id:item.correctAnswer!;
  await checkSend({type:'answer_check',checkId:check.id,answer});independentChecks++;
 }
 const targetRefinements=stored.state.refinements.filter(o=>o.skillId===skill.id);
 if(targetRefinements.length!==required||targetRefinements.some(o=>!o.correct||!o.materialReceipt?.historyComplete||!(o.materialReceipt.assessedMaterialKeys??o.assessedMaterialKeys??[]).length||(o.materialReceipt.assessedMaterialKeys??o.assessedMaterialKeys??[]).some(k=>o.materialReceipt!.previouslySeenKeys.includes(k))))throw Error(`Independent checks lack fresh recorded material: ${skill.id} ${JSON.stringify(targetRefinements.map(o=>({id:o.itemId,receipt:o.materialReceipt,keys:o.assessedMaterialKeys})))}`);
 if(complexNegationOnly){
  for(const feature of skill.evidenceRequirements?.recognition?.featureRequirements??[]){
   const relevant=targetRefinements.filter(o=>o.evidenceFeatures?.includes(feature.feature));
   if(relevant.length<feature.minimumItems||new Set(relevant.map(o=>o.contextId)).size<feature.minimumContexts)throw Error(`Missing independent negation meaning: ${feature.feature}`);
  }
  if(!targetRefinements.some(o=>o.negativeExampleAssessed))throw Error('Missing independent negation counterexample');
 }
 const reloaded=await store.load(stored.studentId,id);if(JSON.stringify(reloaded)!==JSON.stringify(stored))throw Error('Store reload mismatch');
 reports.push({skillId:skill.id,lessonId:lesson.id,guidedExercises:guided,deliberateGuidedErrors:1,independentQuestionId:q.id,independentCorrect:true,independentChecks,freshReceiptsVerified:true,guidedEvidenceIsolated:true,reloadPreserved:true});
}
const output={method:'Constructed prerequisite-success/target-gap profiles, real scoped content and server commands in an isolated in-memory store. Synthetic presentation receipts with real delivery capture; not student data, browser playback proof, multi-occasion validation or educational calibration.',candidateChecksum:candidate.checksum,reports};
writeFileSync(imperativeVerbs?'docs/diagnostic/imperative-verb-learning-journeys-2026-09-12.json':imperativeFamilies?'docs/diagnostic/imperative-family-learning-journeys-2026-09-12.json':complexNegationOnly?'docs/diagnostic/complex-negation-learning-journey-2026-09-12.json':mainIdeaOnly?'docs/diagnostic/sentence-main-idea-learning-journeys-2026-09-12.json':subjunctiveFamilies?'docs/diagnostic/subjonctif-family-learning-journeys-2026-09-12.json':subjunctiveOnly?'docs/diagnostic/subjonctif-learning-journeys-2026-09-12.json':completiveOnly?'docs/diagnostic/completive-production-learning-journey-2026-09-12.json':'docs/diagnostic/orthography-foundation-learning-journeys-2026-09-12.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(reports));
