/** Explicit live QA runner: resumes an existing technical test account, submits
 * deliberately mixed answers using actual browser time, then verifies results,
 * guided teaching and a fresh independent check. Never use a real learner account.
 * Required flags: --base-url --release-key --expected-scope --credentials-file
 * --output-prefix. Credentials come from the managed QA account provisioner.
 * Writes only the named account's learning state; does not publish a release.
 */
import {config} from 'dotenv';
import {readFileSync,writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from 'playwright';
import {readTextualSupport} from '../src/lib/diagnostic/granular/textual-support';
import {publicAssessmentView} from '../src/lib/diagnostic/granular/service';
import type {AssessmentBundle} from '../src/lib/diagnostic/granular/service';
import type {AssessmentView} from '../src/lib/diagnostic/granular/client-state';
config({path:'.env.local',quiet:true});
const option=(flag:string)=>{const index=process.argv.indexOf(flag);const value=index<0?undefined:process.argv[index+1];if(!value||value.startsWith('--'))throw Error(`Required ${flag}`);return value;};
const base=option('--base-url').replace(/\/$/,'');
if(new URL(base).protocol!=='https:')throw Error('Use an HTTPS deployment');
const releaseKey=option('--release-key');
const expectedScope=Number(option('--expected-scope'));
if(!Number.isSafeInteger(expectedScope)||expectedScope<1)throw Error('Invalid expected scope');
const outputPrefix=option('--output-prefix');
const credentials=JSON.parse(readFileSync(option('--credentials-file'),'utf8'));



const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const user=await admin.auth.admin.getUserById(credentials.authUserId);
const link=await admin.auth.admin.generateLink({type:'magiclink',email:user.data.user!.email!});if(link.error)throw link.error;
const cookies=new Map<string,string>();
const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>cookies.set(v.name,v.value))}});
const auth=await client.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});if(auth.error)throw auth.error;
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const context=await browser.newContext();
 await context.addCookies([...cookies].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:'/',secure:true,sameSite:'Lax' as const})));
 const page=await context.newPage();const state:{view:AssessmentView|null}={view:null};const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 const release=await admin.from('granular_assessment_releases').select('id,bundle').eq('release_key',releaseKey).single();if(release.error)throw release.error;
 const bundle=release.data.bundle as AssessmentBundle; const bank=bundle.bank;
 const waitView=async(predicate:(view:AssessmentView)=>boolean,timeout=60000)=>{
  const until=Date.now()+timeout;
  while(Date.now()<until){
   if(errors.length)throw Error(errors.join('; '));
   const row=await admin.from('granular_assessment_sessions').select('id,student_id,release_id,state').eq('student_id',credentials.studentId).eq('release_id',release.data.id).maybeSingle();if(row.error)throw row.error;
   if(row.data){state.view=publicAssessmentView({id:row.data.id,studentId:row.data.student_id,releaseId:row.data.release_id,state:row.data.state},bundle);
    writeFileSync(`${outputPrefix}-progress.json`,JSON.stringify({sessionId:state.view.sessionId,phase:state.view.phase,answered:state.view.answeredCount,remainingSeconds:state.view.remainingSeconds,at:new Date().toISOString()}),{mode:0o600});
    if(predicate(state.view))return state.view;
   }
   await page.waitForTimeout(1000);
  }
  console.log('PAGE_TEXT',(await page.locator('body').innerText()).slice(-2500));
  throw Error('Timed out waiting for persisted assessment progress');
 };

 await page.goto(base+'/student/diagnostic');
 let current=await waitView(v=>v.phase==='assessing'||v.phase==='learning');
 if(current.coverage?.supportedSkillCount!==expectedScope)throw Error('Wrong release scope');
 if(current.phase==='assessing'&&current.paused){await page.getByRole('button',{name:/^(Commencer|Reprendre)$/}).click();current=await waitView(v=>!v.paused&&!!v.question);}
 let submitted=0;
 while(current.phase==='assessing'){
  if(submitted>=200)throw Error('Diagnostic did not finish within the verification bound');
  const question=current.question!;
  const probe=bundle.assessment.probes.find(p=>p.id===question.id)!;
  const skill=bundle.assessment.skills.find(s=>s.id===probe.skillId)!;
  // Allow real browser time and the normal heartbeat to advance the budget.
  await page.waitForTimeout(Math.min(30000,probe.expectedSeconds*1000));
  current=await waitView(()=>true);
  if(current.phase!=='assessing')break;
  if(current.question?.id!==question.id)throw Error('Question changed unexpectedly');
  const entry=bank.items.find(i=>i.itemKey===question.id)!.item;
  const wantCorrect=skill.formFamily!=='compound'&&(current.answeredCount+1)%5!==0;
  if(question.responseType==='mcq')await page.getByRole('radio',{name:entry.choices!.find(c=>c.correct===wantCorrect)!.text,exact:true}).click();
  else await page.getByLabel('Ta réponse',{exact:true}).fill(wantCorrect?entry.correctAnswer!:'je ne sais pas');
  const support=readTextualSupport(entry);if(support)await page.getByRole('radio',{name:support.choices.find(c=>c.correct)!.quoteFr,exact:true}).click();
  const count=current.answeredCount;
  await page.getByRole('button',{name:'Valider',exact:true}).click();
  current=await waitView(v=>v.answeredCount>count||v.phase==='learning');
  if(current.answeredCount>count){
   const row=await admin.from('granular_assessment_sessions').select('state').eq('id',current.sessionId).single();if(row.error)throw row.error;
   const observation=row.data.state.observations.find((o:{itemId:string})=>o.itemId===question.id);
   if(!observation||observation.correct!==wantCorrect)throw Error('Unexpected persisted grading');
   submitted++;console.log(JSON.stringify({answered:current.answeredCount,skillId:skill.id,correct:wantCorrect,remainingSeconds:current.remainingSeconds}));
  }
 }
 if(current.phase!=='learning'||current.results.length!==bundle.assessment.skills.length||!current.learningActivities.length)throw Error('Missing final skill map or pathway');
 await page.reload();await page.getByRole('heading',{name:'Tes acquis et tes prochaines étapes',exact:true}).waitFor();
 current=await waitView(v=>v.phase==='learning');
 const final=await admin.from('granular_assessment_sessions').select('state').eq('id',current.sessionId).single();if(final.error)throw final.error;
 const summary={sessionId:current.sessionId,releaseId:release.data.id,scope:expectedScope,answers:current.answeredCount,correct:final.data.state.observations.filter((o:{correct:boolean})=>o.correct).length,activeSeconds:final.data.state.activeSeconds,completionReason:final.data.state.completionReason,results:current.results.length,activities:current.learningActivities.length,reloadPreserved:true,profile:'Existing history retained; subsequent compound-form responses deliberately wrong and every fifth other response wrong. Technical QA, not a calibrated student profile.'};
 writeFileSync(`${outputPrefix}-results.json`,JSON.stringify(summary,null,2),{mode:0o600});console.log('RESULTS_PASS',JSON.stringify(summary));
 if(current.learningCheck)throw Error('Finish or inspect existing independent check before this teaching test');
 const initialChecks:Array<{skillId:string;questionId:string;correct:boolean}>=[];
 while(process.argv.includes('--follow-up-errors')&&!current.teaching&&!current.learningActivities.some(a=>a.kind==='instruction')){
  if(initialChecks.length>=8)throw Error('Eight follow-up checks did not lead to instruction; inspect pathway');
  const activity=current.learningActivities.find(a=>a.kind==='independent_check');if(!activity)throw Error('No available first check');
  await page.goto(base+'/student/diagnostic?activity='+encodeURIComponent(activity.activityId));
  current=await waitView(v=>!!v.learningCheck);
  const question=current.learningCheck!.question!,entry=bank.items.find(i=>i.itemKey===question.id)!.item;
  // Explicit extra QA scenario: struggle on the proposed foundational checks.
  // Do not relabel these answers as part of the original diagnostic profile.
  if(question.responseType==='mcq')await page.getByRole('radio',{name:entry.choices!.find(c=>!c.correct)!.text,exact:true}).click();
  else await page.getByLabel('Ta réponse',{exact:true}).fill('je ne sais pas');
  const support=readTextualSupport(entry);if(support)await page.getByRole('radio',{name:support.choices.find(c=>c.correct)!.quoteFr,exact:true}).click();
  await page.getByRole('button',{name:'Valider',exact:true}).click();
  current=await waitView(v=>!v.learningCheck);
  const saved=await admin.from('granular_assessment_sessions').select('state').eq('id',current.sessionId).single();if(saved.error)throw saved.error;
  if(!saved.data.state.refinements.some((r:{itemId:string;correct:boolean})=>r.itemId===question.id&&r.correct===false))throw Error('Failed initial check was not saved correctly');
  initialChecks.push({skillId:activity.skillId,questionId:question.id,correct:false});
  writeFileSync(`${outputPrefix}-initial-checks.json`,JSON.stringify({scenario:'Additional technical QA scenario: intentionally wrong answers to the proposed checks after the completed diagnostic.',initialChecks},null,2),{mode:0o600});
  console.log('INITIAL_CHECK',JSON.stringify(initialChecks.at(-1)));
 }

 if(!current.teaching){
  const lesson=current.learningActivities.find(a=>a.kind==='instruction');if(!lesson)throw Error('No guided lesson offered');
  await page.goto(base+'/student/diagnostic?activity='+encodeURIComponent(lesson.activityId));
  current=await waitView(v=>!!v.teaching);
 }
 const contentId=current.teaching!.contentId;
 const lesson=bundle.teachingContent!.find(l=>l.id===contentId)!;
 const before=await admin.from('granular_assessment_sessions').select('state').eq('id',current.sessionId).single();if(before.error)throw before.error;
 const evidenceBefore=JSON.stringify(before.data.state.observations);
 if(current.teaching!.phase==='lesson'){
  await page.getByRole('button',{name:'À moi d’essayer',exact:true}).click();
  current=await waitView(v=>v.teaching?.phase==='practice');
 }
 let practiceAnswers=0;
 while(current.teaching){
  const t=current.teaching,exercise=lesson.practice[t.exerciseIndex];
  if(!t.exercise!.feedback){
   if(exercise.choices)await page.getByRole('radio',{name:exercise.answerFr,exact:true}).click();
   else await page.getByLabel('Ta réponse',{exact:true}).fill(exercise.answerFr);
   await page.getByRole('button',{name:'Vérifier ma réponse',exact:true}).click();
   current=await waitView(v=>!!v.teaching?.exercise?.feedback);
   if(!current.teaching!.exercise!.feedback!.correct)throw Error('Reviewed guided answer incorrectly graded');
   practiceAnswers++;
  }
  const index=current.teaching!.exerciseIndex;
  await page.getByRole('button',{name:index+1===current.teaching!.totalExercises?'Terminer l’entraînement':'Exercice suivant',exact:true}).click();
  current=await waitView(v=>!v.teaching||v.teaching.exerciseIndex>index);
 }
 const after=await admin.from('granular_assessment_sessions').select('state').eq('id',current.sessionId).single();if(after.error)throw after.error;
 if(!after.data.state.completedTeachingIds.includes(contentId))throw Error('Completed lesson not saved');
 if(JSON.stringify(after.data.state.observations)!==evidenceBefore)throw Error('Guided practice altered unaided diagnostic evidence');
 await page.reload();current=await waitView(v=>v.phase==='learning'&&!v.teaching);
 const skillId=bundle.assessment.skills.find(skill=>skill.nodeKey===lesson.nodeKey&&skill.facetKey===lesson.facetKey&&skill.modes.includes(lesson.mode))!.id;
 const next=current.learningActivities.find(a=>a.kind==='independent_check'&&a.skillId===skillId);if(!next)throw Error('No independent verification offered');
 await page.goto(base+'/student/diagnostic?activity='+encodeURIComponent(next.activityId));
 current=await waitView(v=>!!v.learningCheck);
 const question=current.learningCheck!.question!,entry=bank.items.find(i=>i.itemKey===question.id)!.item;
 if('assessmentExposureIds' in lesson&&(lesson.assessmentExposureIds as string[]).includes(question.id))throw Error('Independent check reused taught material');
 if(after.data.state.observations.some((o:{itemId:string})=>o.itemId===question.id))throw Error('Independent check reused diagnostic question');
 if(question.responseType==='mcq')await page.getByRole('radio',{name:entry.choices!.find(c=>c.correct)!.text,exact:true}).click();
 else await page.getByLabel('Ta réponse',{exact:true}).fill(entry.correctAnswer!);
 const support=readTextualSupport(entry);if(support)await page.getByRole('radio',{name:support.choices.find(c=>c.correct)!.quoteFr,exact:true}).click();
 await page.getByRole('button',{name:'Valider',exact:true}).click();
 current=await waitView(v=>!v.learningCheck);
 const refined=await admin.from('granular_assessment_sessions').select('state').eq('id',current.sessionId).single();if(refined.error)throw refined.error;
 if(!refined.data.state.refinements.some((o:{itemId:string;skillId:string;correct:boolean})=>o.itemId===question.id&&o.skillId===skillId&&o.correct))throw Error('Independent evidence not saved');
 await page.reload();await page.getByRole('heading',{name:'Tes acquis et tes prochaines étapes',exact:true}).waitFor();
 const learningSummary={sessionId:current.sessionId,contentId,skillId,initialChecks,practiceAnswers,independentQuestion:question.id,guidedEvidenceIsolated:true,refinementSaved:true,reloadPassed:true};
 writeFileSync(`${outputPrefix}-learning.json`,JSON.stringify(learningSummary,null,2),{mode:0o600});console.log('LEARNING_PASS',JSON.stringify(learningSummary));
}finally{await browser.close();}
