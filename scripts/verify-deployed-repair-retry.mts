/** Dedicated QA account only: a real committed save loses its response, then retries. */
import {strict as assert} from 'node:assert';
import {readFileSync,writeFileSync} from 'node:fs';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from 'playwright';
import {MICRO_LESSONS} from '../src/lib/content/micro-lessons';
import {REPAIR_COPY,repairCompletion} from '../src/lib/diagnostic/granular/repair-display';
config({path:'.env.local',quiet:true});
const base=process.argv[2],reportPath=process.argv[3];if(!base?.startsWith('https://')||new URL(base).origin!==base||!reportPath)throw Error('HTTPS origin and report required');
const credential=JSON.parse(readFileSync('tmp/plume-granular-r41-qa.json','utf8'));
if(credential.username!=='doves.granular.r41.qa')throw Error('Dedicated QA account required');
const sessionId='7fc214f3-d057-4f4b-8f4a-4e834775d04c';
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
async function session(){const {data,error}=await db.from('granular_assessment_sessions').select('id,release_id,state').eq('student_id',credential.studentId).eq('id',sessionId).single();if(error)throw error;return data;}
const before=await session();assert.equal(before.state.phase,'learning');
const user=await db.auth.admin.getUserById(credential.authUserId);if(user.error)throw user.error;assert.ok(user.data.user.email);
const link=await db.auth.admin.generateLink({type:'magiclink',email:user.data.user.email});if(link.error)throw link.error;
const cookies=new Map<string,string>();const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>values.forEach(value=>cookies.set(value.name,value.value))}});
const verified=await auth.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});if(verified.error)throw verified.error;

async function estimates(){const r=await db.from('student_skill_estimates').select('*').eq('student_id',credential.studentId).order('skill_id');if(r.error)throw r.error;return r.data;}
async function completions(){const r=await db.from('student_repair_completions').select('*').eq('student_id',credential.studentId);if(r.error)throw r.error;return r.data;}
const initialEstimates=await estimates(),initialCompletions=await completions();
const priorIds=new Set(initialCompletions.map(row=>row.submission_id));
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const context=await browser.newContext();
 const {secret}=JSON.parse(readFileSync('tmp/plume-verification-bypass.json','utf8'));
 let dropped=false,saveRequests=0,armed=false;
 await context.route('**/*',async route=>{
  const request=route.request(),sameOrigin=new URL(request.url()).origin===base;
  const headers={...request.headers(),...(sameOrigin?{'x-vercel-protection-bypass':secret}:{})};
  if(armed&&sameOrigin&&request.method()==='POST'&&headers['next-action']&&new URL(request.url()).pathname==='/student/repair/cause_consequence'){
   saveRequests++;
   if(!dropped){const response=await route.fetch({headers,timeout:120000});assert.ok(response.ok());dropped=true;console.log('Committed response received; dropping it.');await route.abort('failed');return;}
  }
  await route.continue({headers});
 });
 await context.addCookies([...cookies].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:'/',secure:true,sameSite:'Lax' as const})));
 const page=await context.newPage();page.setDefaultTimeout(60000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const opening=await page.goto(base+'/student/repair/cause_consequence',{waitUntil:'domcontentloaded',timeout:60000});
 console.log(JSON.stringify({openingStatus:opening?.status(),url:page.url(),body:(await page.locator('body').innerText()).slice(0,5000)}));
 const lesson=MICRO_LESSONS.cause_consequence,questions=[...lesson.questions,lesson.returnToText];
 const answers=questions.map((question,index)=>index===0?(question.correctIndex+1)%question.choices.length:question.correctIndex);
 await page.getByRole('button',{name:REPAIR_COPY.practice,exact:true}).click();
 for(const [index,question] of questions.entries()){
  await page.getByText(question.choices[answers[index]],{exact:true}).click();
  assert.ok(await page.getByRole('radio',{name:question.choices[answers[index]],exact:true}).isChecked());
  await page.getByRole('button',{name:REPAIR_COPY.verify,exact:true}).click();
  if(index<questions.length-1)await page.getByRole('button',{name:REPAIR_COPY.following,exact:true}).click();
 }
 console.log('Guided choices complete.');
 armed=true;
 await page.getByRole('button',{name:REPAIR_COPY.finish,exact:true}).click();
 await page.getByText(REPAIR_COPY.error,{exact:true}).waitFor({timeout:150000});
 const afterLost=(await completions()).filter(row=>!priorIds.has(row.submission_id));console.log('Committed records after lost response:',afterLost.length);assert.equal(afterLost.length,1,'Server save must have committed before response loss');
 assert.equal(await page.getByRole('button',{name:REPAIR_COPY.verify,exact:true}).count(),0);
 await page.getByRole('button',{name:REPAIR_COPY.finish,exact:true}).click();
 await page.getByRole('heading',{name:REPAIR_COPY.done,exact:true}).waitFor({timeout:150000});
 await page.getByText(repairCompletion(lesson.title),{exact:true}).waitFor();
 armed=false;
 const saved=(await completions()).filter(row=>!priorIds.has(row.submission_id));assert.deepEqual(saved,afterLost);assert.equal(saveRequests,2);
 assert.deepEqual(saved[0].answers,answers);assert.deepEqual(saved[0].corrects,questions.map((q,index)=>answers[index]===q.correctIndex));
 assert.deepEqual(await estimates(),initialEstimates);assert.deepEqual(await session(),before);assert.deepEqual(errors,[]);
 await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:REPAIR_COPY.practice,exact:true}).waitFor();
 assert.deepEqual((await completions()).filter(row=>!priorIds.has(row.submission_id)),saved);
 const report={base,studentId:credential.studentId,submissionId:saved[0].submission_id,answers:answers.length,correct:saved[0].corrects.filter(Boolean).length,responseDroppedAfterCommit:dropped,saveRequests,persistedCompletions:1,serverGradingVerified:true,skillEstimatesUnchanged:true,diagnosticUnchanged:true,reloadPreservedCompletion:true,pageErrors:errors,limit:'Dedicated technical account and one legacy guided lesson; no pedagogical calibration or all-pathway claim.'};
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
