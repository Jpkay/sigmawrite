/** Real provider, synthetic students, in-memory persistence. Never publishes or
 * writes student data. Uses the prepared bank item and its unchanged rubric. */
import {readFileSync,writeFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';
import {createWritingEvaluator,WRITING_EVALUATOR_VERSION} from '../../src/lib/diagnostic/granular/writing-evaluator';
import {runLearningCheckCommand} from '../../src/lib/diagnostic/granular/learning-service';
import {createSession} from '../../src/lib/diagnostic/granular/session';
import {bindAssessmentRelease} from '../../src/lib/diagnostic/granular/release-binding';
import {publicAssessmentView,type AssessmentBundle,type AssessmentStore,type StoredSession} from '../../src/lib/diagnostic/granular/service';
import {resolveAIRuntimeConfig} from '../../src/lib/ai/runtime-config';
import {checksum} from '../../src/lib/taxonomy/validate';
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const candidate=read('docs/diagnostic/v3-scoped-review-candidate.json');
const bank=read('generated/diagnostic-bank-v3-consolidated-draft.json');
const bundle:AssessmentBundle={assessment:candidate.assessment,bank,activities:candidate.activities,teachingContent:candidate.teachingContent,taxonomyId:'synthetic-writing-taxonomy',bankId:'synthetic-writing-bank'};
const cases=[
 {id:'imparfait-correct',key:'imperfect-holidays',expected:'correct',answer:'Chaque été, Lina jouait dans le jardin. Elle retrouvait ses amis et ils construisaient une cabane.'},
 {id:'imparfait-incorrect',key:'imperfect-holidays',expected:'incorrect',answer:'Chaque été, Lina jouais dans le jardin. Elle retrouvais ses amis et ils construisait une cabane.'},
 {id:'imparfait-unresolved',key:'imperfect-holidays',expected:'unresolved',answer:'Lina a passé ses vacances au bord du lac. Elle a retrouvé ses amis et ils ont construit une cabane.'},
 {id:'grammar-correct',key:'grammar-team',expected:'correct',answer:'Les joueurs avancent ensemble. Les arbitres surveillent le terrain. Les supporters chantent dans les gradins.'},
 {id:'grammar-incorrect',key:'grammar-team',expected:'incorrect',answer:'Les joueurs avance ensemble. Les arbitres surveille le terrain. Les supporters chante dans les gradins.'},
 {id:'grammar-unresolved',key:'grammar-team',expected:'unresolved',answer:'Je suis sur le terrain. Tu es près du but. Il reste dans les gradins.'},
] as const;
const config=resolveAIRuntimeConfig();assert.notEqual(config.kind,'mock');
const reportPath=process.argv.find(arg=>arg.startsWith('--report='))?.slice(9)??'docs/diagnostic/writing/service-provider-check-2026-09-12.json';
const selectedId=process.argv.find(arg=>arg.startsWith('--case='))?.slice(7);
const selected=selectedId?cases.filter(c=>c.id===selectedId):cases;assert.ok(selected.length);
const results:unknown[]=[];
for(const c of selected){
 const itemId='v3-connected-writing:'+c.key;
 const item=bank.items.find((e:{itemKey:string})=>e.itemKey===itemId);
 const probe=bundle.assessment.probes.find(p=>p.id===itemId);assert.ok(item&&probe);
 const checkId='22222222-2222-4222-8222-222222222222';
 let stored:StoredSession={id:'11111111-1111-4111-8111-111111111111',studentId:'synthetic-writing-student',releaseId:'synthetic-writing-release',state:{...createSession(bindAssessmentRelease(bundle.assessment,bundle)),phase:'learning',completionReason:'time_budget',learningCheck:{id:checkId,activityId:'synthetic-active-check',itemId,occasionId:'synthetic-day-1'}}};
 const store:AssessmentStore={load:async(student,id)=>student===stored.studentId&&id===stored.id?structuredClone(stored):null,release:async()=>bundle,save:async(student,id,revision,state)=>{if(student!==stored.studentId||id!==stored.id||revision!==stored.state.revision)return false;stored={...stored,state:structuredClone(state)};return true;}};
 const before=publicAssessmentView(stored,bundle).results;
 const start=Date.now();
 try{
  const result=await runLearningCheckCommand(store,stored.studentId,{type:'answer_check',sessionId:stored.id,revision:0,checkId,answer:c.answer},Date.now,createWritingEvaluator());
  if('error' in result)throw Error(result.error);
  const observation=stored.state.refinements.at(-1),feedback=publicAssessmentView(stored,bundle).writingFeedback;
  const observed=stored.state.unassessedWritingResponses?.length?'unresolved':observation?.correct?'correct':observation?'incorrect':'unavailable';
  assert.equal(observed,c.expected);assert.equal(stored.state.learningCheck,null);assert.equal(feedback?.text,c.answer);
  if(c.expected==='unresolved'){
   assert.deepEqual(publicAssessmentView(stored,bundle).results,before);assert.equal(stored.state.refinements.length,0);assert.equal(feedback?.assessed,false);
  }else{
   assert.equal(stored.state.refinements.length,1);assert.equal(feedback?.assessed,true);
   assert.equal(observation?.writingEvidence?.tokens.length,3);
   assert.ok(observation?.writingEvidence?.tokens.every(token=>token.correct===(c.expected==='correct')));
   for(const p of feedback!.passages)assert.equal(c.answer.slice(p.start,p.end),p.text);
   assert.notEqual(publicAssessmentView(stored,bundle).results.find(r=>r.skillId===probe.skillId)?.status,'mastered');
  }
  assert.ok(stored.state.exposedLearningItemIds.includes(itemId));
  results.push({id:c.id,itemId,itemChecksum:checksum(item),promptFr:item.item.promptFr,answer:c.answer,expected:c.expected,observed,matched:true,elapsedMs:Date.now()-start,feedback,writingEvidence:observation?.writingEvidence});
  console.log(JSON.stringify({id:c.id,observed,matched:true}));
 }catch(error){
  results.push({id:c.id,itemId,expected:c.expected,matched:false,elapsedMs:Date.now()-start,error:error instanceof Error?error.message:'Unknown failure',feedback:publicAssessmentView(stored,bundle).writingFeedback,writingEvidence:stored.state.refinements.at(-1)?.writingEvidence});
  console.log(JSON.stringify({id:c.id,matched:false}));
 }
 writeFileSync(reportPath,JSON.stringify({status:'real_provider_synthetic_service_check',syntheticOnly:true,persistence:'in-memory',deployed:false,evaluatorVersion:WRITING_EVALUATOR_VERSION,model:process.env.WRITING_GRADING_MODEL??config.model,candidateChecksum:candidate.checksum,results},null,2)+'\n');
}
if(results.some(row=>!(row as {matched:boolean}).matched))process.exitCode=1;
