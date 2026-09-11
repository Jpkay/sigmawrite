/** Actual content and server commands in isolated fixtures, not student validation. */
import {readFileSync,writeFileSync} from 'node:fs';
import {validateCanonicalDiagnosticBank} from '../src/lib/diagnostic/item-bank';
import {checksum} from '../src/lib/taxonomy/validate';
import {runAssessmentCommand,publicAssessmentView,type AssessmentBundle,type StoredSession} from '../src/lib/diagnostic/granular/service';
import {recordMaterialDelivery,type MaterialDeliveryStore} from '../src/lib/diagnostic/granular/material-delivery';
import type {MaterialReceipt} from '../src/lib/diagnostic/granular/material-receipt';
import {runLearningCheckCommand} from '../src/lib/diagnostic/granular/learning-service';
import {createSession} from '../src/lib/diagnostic/granular/session';
import {bindAssessmentRelease} from '../src/lib/diagnostic/granular/release-binding';
import {readTextualSupport} from '../src/lib/diagnostic/granular/textual-support';
import type {EvidenceSkill} from '../src/lib/diagnostic/granular/v3-adapter';
import {syntheticReadingKnowledge} from '../src/lib/diagnostic/granular/synthetic-reading-profiles';
import {assessWithinOccasion} from '../src/lib/diagnostic/granular/engine';
import {inspectProfileDiscrimination} from '../src/lib/diagnostic/granular/profile-discrimination';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const candidate=read('docs/diagnostic/v3-scoped-review-candidate.json');
const bundle:AssessmentBundle={assessment:candidate.assessment,bank:read('generated/diagnostic-bank-v3-consolidated-draft.json'),taxonomyId:'synthetic-profile',bankId:'synthetic-profile',teachingContent:candidate.teachingContent,activities:candidate.activities.map((a:object)=>({...a,status:'published'}))};
const validation=validateCanonicalDiagnosticBank(bundle.bank,read('generated/french-taxonomy-v3.json').taxonomy);
if(validation.issues.length||validation.manifest.checksum!==candidate.bankChecksum||bundle.assessment.bankChecksum!==candidate.bankChecksum)throw Error('Candidate bank binding mismatch');
const profiles:[string,(s:EvidenceSkill)=>boolean,(s:EvidenceSkill)=>boolean,boolean][]=[
 ['regular_vs_irregular',s=>!s.branch.startsWith('conjugation:verb:'),s=>s.branch.startsWith('conjugation:verb:')||s.branch.startsWith('conjugation:pattern:'),false],
 ['verb_specific_tense_frontiers',s=>!s.branch.startsWith('conjugation:verb:')||/:(aller|venir)$/.test(s.branch)||(/:(prendre|dire)$/.test(s.branch)?s.id.includes('present_indicatif'):/present_indicatif|imparfait/.test(s.id)),s=>s.branch.startsWith('conjugation:verb:'),true],
 ['literal_vs_inference',s=>syntheticReadingKnowledge('literal_vs_inference',s.nodeKey),s=>s.domain==='reading_comprehension',false],
 ['reading_reference_gap',s=>syntheticReadingKnowledge('reading_reference_gap',s.nodeKey),s=>s.domain==='reading_comprehension',false],
 ['cod_vs_coi',s=>!/pronom_coi|pronoms_y_en|doubles_pronoms|cod_coi/.test(s.nodeKey),s=>/pronom/.test(s.nodeKey),false],
 ['lexical_vs_agreement',s=>s.samplingGroup!=='orthographe_grammaticale',s=>s.domain==='spelling',false],
 ['agreement_vs_lexical',s=>s.samplingGroup!=='orthographe_lexicale',s=>s.domain==='spelling',false],
 ['recognition_vs_production',s=>s.modes[0]==='recognition',s=>s.domain==='conjugation',false],
];
const reports=[];
for(const [profile,knows,inContrast,sameBranch] of profiles){
 const student='isolated-profile',id='11111111-1111-4111-8111-111111111111';
 let stored:StoredSession={id,studentId:student,releaseId:'prepared',state:createSession(bindAssessmentRelease(bundle.assessment,bundle))};
 let at=Date.parse('2026-09-12T10:00:00Z');
 // This fixture explicitly starts with no prior presentations. Every delivery
 // is captured before it can be answered. This is not real-student history.
 const exposed=new Set<string>(),receipts=new Map<string,{fingerprint:string,receipt:MaterialReceipt}>();
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
 const send=async(command:Record<string,unknown>)=>{const response=await runAssessmentCommand(store,student,{sessionId:id,revision:stored.state.revision,...command},()=>at);if('error' in response||'conflict' in response)throw Error(JSON.stringify(response));await recordMaterialDelivery(store,student,response);return response;};
 await send({type:'resume'});let presented=0,pauseReloadVerified=false;
 while(stored.state.phase==='assessing'){
  if(++presented>150)throw Error('Unbounded fixture assessment');
  if(presented===9){await send({type:'pause'});const seconds=stored.state.activeSeconds;at+=3*60*60*1000;const reloaded=await store.load(student,id);if(!reloaded||JSON.stringify(reloaded)!==JSON.stringify(stored))throw Error('Reload changed the session');stored=reloaded;await send({type:'resume'});if(stored.state.activeSeconds!==seconds)throw Error('Paused time charged');pauseReloadVerified=true;}
  const view=publicAssessmentView(stored,bundle,at),question=view.question!,probe=bundle.assessment.probes.find(p=>p.id===question.id)!;
  const skill=bundle.assessment.skills.find(s=>s.id===probe.skillId)!,entry=bundle.bank.items.find(e=>e.itemKey===question.id)!.item,want=knows(skill);
  const answer=entry.responseType==='mcq'?question.choices.find(c=>entry.choices!.some(o=>o.text===c.text&&o.correct===want))!.id:want?entry.correctAnswer!:'réponse volontairement incorrecte';
  const support=readTextualSupport(entry),supportChoiceId=support?question.supportChoices!.find(c=>support.choices.some(o=>o.quoteFr===c.text&&o.correct))!.id:undefined;
  let seconds=probe.expectedSeconds;while(seconds>30){at+=30000;await send({type:'pulse'});seconds-=30;}at+=seconds*1000;
  await send({type:'answer',itemId:question.id,answer,...(supportChoiceId?{supportChoiceId}:{})});
  if(stored.state.observations.at(-1)?.correct!==want)throw Error(`Unexpected server grading: ${question.id}`);
 }
 const view=publicAssessmentView(stored,bundle,at),today=assessWithinOccasion(bundle.assessment.skills,stored.state.observations);
 const sampled=[...new Set(stored.state.observations.map(o=>o.skillId))].map(skillId=>{const skill=bundle.assessment.skills.find(s=>s.id===skillId)!,obs=stored.state.observations.filter(o=>o.skillId===skillId),result=today.find(r=>r.skillId===skillId)!;return {skillId,branch:skill.branch,expectedKnown:knows(skill),answers:obs.length,correct:obs.filter(o=>o.correct).length,withinOccasionResolved:result.resolved,status:view.results.find(r=>r.skillId===skillId)!.status};});
 if(stored.state.completionReason!=='time_budget'||stored.state.activeSeconds>2100||view.results.length!==542||!view.learningActivities.length||new Set(stored.state.observations.map(o=>o.itemId)).size!==stored.state.observations.length)throw Error('Invalid final fixture state');
 for(const result of view.results)if(!sampled.some(s=>s.skillId===result.skillId)&&result.status!=='unknown')throw Error('Untested target classified');
 for(const result of today.filter(r=>r.resolved)){
  const skill=bundle.assessment.skills.find(s=>s.id===result.skillId)!;
  if(!result.modes.every(m=>knows(skill)?m.probability>=.85:m.probability<=.2))throw Error(`Resolved evidence contradicts profile truth: ${profile}/${skill.id}`);
 }
 const targets=bundle.assessment.skills.filter(inContrast).map(s=>({skillId:s.id,branch:s.branch,expectedKnown:knows(s)}));
 const contrast=inspectProfileDiscrimination(targets,sampled,sameBranch);
 const diagnosticEvidence=JSON.stringify(stored.state.observations),followupChecks=[];
 const contrastDomains=new Set(bundle.assessment.skills.filter(inContrast).map(s=>s.domain));
 let nextView=view;
 const relevantLesson=()=>nextView.learningActivities.find(a=>a.kind==='instruction'&&inContrast(bundle.assessment.skills.find(s=>s.id===a.skillId)!)&&!knows(bundle.assessment.skills.find(s=>s.id===a.skillId)!));
 while(!relevantLesson()&&followupChecks.length<8){
  const activity=nextView.learningActivities.find(a=>a.kind==='independent_check'&&contrastDomains.has(bundle.assessment.skills.find(s=>s.id===a.skillId)!.domain));
  if(!activity)break;
  const check=async(command:Record<string,unknown>)=>{const response=await runLearningCheckCommand(store,student,{sessionId:id,revision:stored.state.revision,...command},()=>at);if('error' in response||'conflict' in response)throw Error(JSON.stringify(response));await recordMaterialDelivery(store,student,response);};
  await check({type:'start_check',activityId:activity.activityId});
  const current=publicAssessmentView(stored,bundle,at).learningCheck!,question=current.question!,entry=bundle.bank.items.find(e=>e.itemKey===question.id)!.item;
  const skill=bundle.assessment.skills.find(s=>s.id===activity.skillId)!,want=knows(skill);
  const answer=entry.responseType==='mcq'?question.choices.find(c=>entry.choices!.some(o=>o.text===c.text&&o.correct===want))!.id:want?entry.correctAnswer!:'réponse volontairement incorrecte';
  const support=readTextualSupport(entry),supportChoiceId=support?question.supportChoices!.find(c=>support.choices.some(o=>o.quoteFr===c.text&&o.correct))!.id:undefined;
  await check({type:'answer_check',checkId:current.id,answer,...(supportChoiceId?{supportChoiceId}:{})});
  if(!stored.state.refinements.some(o=>o.itemId===question.id&&o.correct===want)||JSON.stringify(stored.state.observations)!==diagnosticEvidence)throw Error('Follow-up evidence isolation failed');
  followupChecks.push({skillId:skill.id,questionId:question.id,correct:want});nextView=publicAssessmentView(stored,bundle,at);
 }
 const finalSnapshot=JSON.stringify(nextView);
 const finalReload=await store.load(student,id);
 if(!finalReload)throw Error('Completed fixture missing on reload');
 stored=finalReload;
 if(JSON.stringify(publicAssessmentView(stored,bundle,at))!==finalSnapshot)throw Error('Reload changed results or learning pathway');
 const nextLesson=relevantLesson();
 const pathway={followupChecks,instructionAvailable:!!nextLesson,lesson:nextLesson?{skillId:nextLesson.skillId,titleFr:nextLesson.titleFr}:null,diagnosticEvidencePreserved:true,finalReloadVerified:true};
 reports.push({profile,questions:presented,activeSeconds:stored.state.activeSeconds,pauseReloadVerified,receipts:receipts.size,scope:view.coverage,contrast,sampled,pathway,activities:view.learningActivities.map(a=>({kind:a.kind,skillId:a.skillId,titleFr:a.titleFr}))});
 console.log(JSON.stringify({profile,questions:presented,contrastPassed:contrast.passed,pathway,known:contrast.knownTargetsWithEvidence,weak:contrast.weakTargetsWithEvidence}));
}
const output={method:'Actual prepared content and server grading with an isolated, explicitly complete synthetic presentation ledger. Clock advances by each item’s estimated duration. No database writes, real-student history, browser proof or educational calibration.',candidateChecksum:candidate.checksum,engineSourceChecksum:checksum(readFileSync('src/lib/diagnostic/granular/engine.ts','utf8')),reports};
writeFileSync('docs/diagnostic/prepared-profile-diagnostics-2026-09-12.json',JSON.stringify(output,null,2)+'\n');
if(process.argv.includes('--require-pathway')&&reports.some(r=>!r.pathway.instructionAvailable))process.exitCode=1;
if(process.argv.includes('--require-discrimination')&&reports.some(r=>!r.contrast.passed))process.exitCode=1;
