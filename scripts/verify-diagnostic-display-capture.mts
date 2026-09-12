/** Read-only verification of diagnostic/review/lesson copy and worker registration for a completed technical QA account.
 * Required environment: PLUME_VERIFY_URL, PLUME_VERIFY_CREDENTIALS,
 * PLUME_VERIFY_SESSION, PLUME_VERIFY_REPORT.
 * Authenticated route visits record delivery, but no answers are submitted.
 */
import {strict as assert} from 'node:assert';
import {MEMORY_COPY} from '../src/lib/diagnostic/granular/memory-display';
import {INBOX_COPY} from '../src/lib/diagnostic/granular/inbox-display';
import {VOCABULARY_COPY} from '../src/lib/diagnostic/granular/vocabulary-display';
import {RECUEIL_COPY} from '../src/lib/diagnostic/granular/recueil-display';
import {readFileSync,writeFileSync} from 'node:fs';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from 'playwright';
import {checksum} from '../src/lib/taxonomy/validate';
import {DIAGNOSTIC_COPY} from '../src/components/diagnostic/diagnostic-copy';
import {ANSWER_REVIEW_COPY} from '../src/lib/diagnostic/granular/answer-review-copy';
import {LESSONS_COPY} from '../src/lib/diagnostic/granular/lessons-copy';
import {HOME_COPY} from '../src/app/student/home-copy';
import {FRONTIER_COPY} from '../src/lib/diagnostic/granular/frontier-copy';
import {deliveredTextFragments} from '../src/lib/diagnostic/granular/delivery-journal';
config({path:'.env.local',quiet:true});
const base=process.env.PLUME_VERIFY_URL!;assert.ok(base,'Origin required');
const required=(name:string)=>{const value=process.env[name];assert.ok(value,`${name} required`);return value;};
assert.equal(new URL(base).protocol,'https:');
const credential=JSON.parse(readFileSync(required('PLUME_VERIFY_CREDENTIALS'),'utf8'));assert.match(credential.username,/^doves\.granular\..*\.qa$/,'Technical QA account required');
const sessionId=required('PLUME_VERIFY_SESSION');
const reportPath=required('PLUME_VERIFY_REPORT');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
async function session(){const {data,error}=await db.from('granular_assessment_sessions').select('id,release_id,state').eq('student_id',credential.studentId).eq('id',sessionId).single();if(error)throw error;return data;}
const before=await session();assert.ok(['assessing','learning'].includes(before.state.phase));
const user=await db.auth.admin.getUserById(credential.authUserId);if(user.error)throw user.error;assert.ok(user.data.user.email);
const link=await db.auth.admin.generateLink({type:'magiclink',email:user.data.user.email});if(link.error)throw link.error;
const cookies=new Map<string,string>();const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>values.forEach(value=>cookies.set(value.name,value.value))}});
const verified=await auth.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});if(verified.error)throw verified.error;
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
 const context=await browser.newContext();
 const {secret}=JSON.parse(readFileSync('tmp/plume-verification-bypass.json','utf8'));
 await context.route('**/*',route=>route.continue({headers:{...route.request().headers(),...(new URL(route.request().url()).origin===base?{'x-vercel-protection-bypass':secret}:{})}}));
 await context.addCookies([...cookies].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:'/',secure:true,sameSite:'Lax' as const})));
 const page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 const response=await page.goto(base+'/student/diagnostic',{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(response?.headers()['x-plume-offline-owner'],credential.authUserId);
 await page.getByRole('heading',{name:DIAGNOSTIC_COPY.resultsTitle,exact:true}).waitFor({timeout:60000});
 const fragments=deliveredTextFragments(DIAGNOSTIC_COPY);
 const fixed=await db.from('student_material_delivery_journal').select('payload_checksum,text_fragments').eq('student_id',credential.studentId).eq('boundary','granular:ui-copy').eq('payload_checksum',checksum(fragments)).single();
 if(fixed.error)throw fixed.error;assert.deepEqual(fixed.data.text_fragments,fragments);
 await page.goto(base+'/student/diagnostic/review?session='+sessionId,{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:ANSWER_REVIEW_COPY.title,exact:true}).waitFor({timeout:60000});
 const answers=await page.locator('article[data-result]').count();assert.equal(answers,before.state.observations.length);
 const review=await db.from('student_material_delivery_journal').select('text_fragments').eq('student_id',credential.studentId).eq('boundary','granular:answer-review').contains('text_fragments',[ANSWER_REVIEW_COPY.title,ANSWER_REVIEW_COPY.errorsOnly]).limit(1).single();
 if(review.error)throw review.error;
 for(const text of deliveredTextFragments(ANSWER_REVIEW_COPY))assert.ok(review.data.text_fragments.includes(text));
 await page.goto(base+'/student/lessons',{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Mes leçons',exact:true}).waitFor({timeout:60000});
 assert.equal(await page.getByRole('link',{name:LESSONS_COPY.results,exact:true}).count(),1);
 const lessons=await db.from('student_material_delivery_journal').select('text_fragments').eq('student_id',credential.studentId).eq('boundary','student:lessons').contains('text_fragments',[LESSONS_COPY.optionalHelp,LESSONS_COPY.unavailable]).limit(1).single();
 if(lessons.error)throw lessons.error;
 for(const text of deliveredTextFragments(LESSONS_COPY))assert.ok(lessons.data.text_fragments.includes(text));
 let homeAndProgressVerified=false;
 if(process.env.PLUME_VERIFY_HOME==='true'){
  await page.goto(base+'/student',{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('heading',{name:HOME_COPY.reading,exact:true}).waitFor({timeout:60000});
  await page.locator('#main-content').getByRole('link',{name:HOME_COPY.lessons,exact:true}).waitFor();
  const homeFragments=deliveredTextFragments(HOME_COPY);
  const homeCopy=await db.from('student_material_delivery_journal').select('text_fragments').eq('student_id',credential.studentId).eq('boundary','student:home-copy').eq('payload_checksum',checksum(homeFragments)).single();
  if(homeCopy.error)throw homeCopy.error;assert.deepEqual(homeCopy.data.text_fragments,homeFragments);
  await page.goto(base+'/student/progress',{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('heading',{name:FRONTIER_COPY.progressTitle,exact:true}).waitFor({timeout:60000});
  const progress=await db.from('student_material_delivery_journal').select('text_fragments').eq('student_id',credential.studentId).eq('boundary','student:granular-progress').contains('text_fragments',[FRONTIER_COPY.progressTitle]).limit(1).single();
  if(progress.error)throw progress.error;
  homeAndProgressVerified=true;
 }
 const additionalPages:string[]=[];
 if(process.env.PLUME_VERIFY_ADDITIONAL==='true'){
  for(const [path,title,boundary,copy] of [
   ['/student/memory','Mémoire','student:memory-copy',MEMORY_COPY],
   ['/student/inbox','Boîte de réception','student:inbox-copy',INBOX_COPY],
   ['/student/vocabulary','Vocabulaire','legacy:vocabulary',VOCABULARY_COPY],
   ['/student/recueil','Mon recueil','student:recueil-display',RECUEIL_COPY],
  ] as const){
   const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});assert.ok(response?.ok(),path);
   await page.getByRole('heading',{name:title,exact:true}).first().waitFor({timeout:60000});
   const copyFragments=deliveredTextFragments(copy);
   const saved=await db.from('student_material_delivery_journal').select('text_fragments').eq('student_id',credential.studentId).eq('boundary',boundary);
   if(saved.error)throw new Error(path+': '+saved.error.message);
   assert.ok(saved.data.some(row=>copyFragments.every(fragment=>row.text_fragments.includes(fragment))),path+': complete copy missing');
   additionalPages.push(path);
  }
 }
 const worker=await page.evaluate(async()=>{
  const registration=await navigator.serviceWorker.register('/sw.js',{type:'module',updateViaCache:'none'});
  let timeout:ReturnType<typeof setTimeout>|undefined;
  try{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Worker activation timed out')),45000);})]);}
  finally{clearTimeout(timeout);}
  return {scope:registration.scope,script:registration.active?.scriptURL};
 });
 assert.equal(worker.script,base+'/sw.js');
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(await session(),before);assert.deepEqual(errors,[]);
 const report={base,studentId:credential.studentId,sessionId,diagnosticCopyChecksum:checksum(fragments),diagnosticCopyCaptured:true,reviewCopyCaptured:true,lessonListCopyCaptured:true,reviewAnswers:answers,serverOwnerHeaderVerified:true,moduleWorkerRegistered:true,mobileNoHorizontalOverflow:true,sessionUnchanged:true,pageErrors:errors,limits:'Existing completed technical account; no answers submitted and no complete-history activation. This checks deployed UI capture and worker registration, not a fresh diagnostic or full offline behavior.'};
 Object.assign(report,{homeAndProgressVerified,additionalPages});
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
} finally {await browser.close();}
