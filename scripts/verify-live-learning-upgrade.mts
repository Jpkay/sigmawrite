/** Real browser upgrade for a designated synthetic QA account only.
 * Usage: <base-url> <credentials-file> <source-session> <target-release-key> <output-prefix>
 * No diagnostic answers are created or changed by this verifier. */
import {config} from 'dotenv';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from 'playwright';
import {checksum} from '../src/lib/taxonomy/validate';
import type {AssessmentSession} from '../src/lib/diagnostic/granular/session';
const [base,credentialsPath,sourceId,targetKey,output]=process.argv.slice(2);
if(!base||!credentialsPath||!sourceId||!targetKey||!output)throw Error('Expected URL, QA credentials file, source session, target release key and output prefix');
const origin=new URL(base).origin;if(base!==origin||!origin.startsWith('https://'))throw Error('Expected exact HTTPS origin');
const credentials=JSON.parse(readFileSync(credentialsPath,'utf8'));
if(!/^doves\.granular\..+\.qa$/.test(credentials.username??''))throw Error('Only a designated synthetic QA account may be upgraded');
config({path:'.env.local',quiet:true});
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const sourceQuery=await admin.from('granular_assessment_sessions').select('*').eq('id',sourceId).single();if(sourceQuery.error)throw sourceQuery.error;
const source=sourceQuery.data;
if(source.student_id!==credentials.studentId||source.state.phase!=='learning'||!source.state.paused||source.state.learningCheck||source.state.teaching||source.state.pendingItemId)throw Error('Expected an idle completed session owned by this QA account');
const target=await admin.from('granular_assessment_releases').select('id,status').eq('release_key',targetKey).single();if(target.error)throw target.error;
if(target.data.status!=='published'||target.data.id===source.release_id)throw Error('Expected a different published target');
const snapshotPath=output+'-source.json';
if(existsSync(snapshotPath)){if(checksum(JSON.parse(readFileSync(snapshotPath,'utf8')))!==checksum(source))throw Error('Source differs from the saved pre-upgrade snapshot');}
else writeFileSync(snapshotPath,JSON.stringify(source),{flag:'wx',mode:0o600});
const user=await admin.auth.admin.getUserById(credentials.authUserId);if(user.error||!user.data.user)throw Error('QA auth account unavailable');
const link=await admin.auth.admin.generateLink({type:'magiclink',email:user.data.user.email!});if(link.error)throw link.error;
const cookies=new Map<string,string>();
const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>cookies.set(v.name,v.value))}});
const auth=await client.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});if(auth.error)throw auth.error;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 if(new URL(base).hostname.endsWith('.vercel.app')){
  const {secret}=JSON.parse(readFileSync('tmp/plume-verification-bypass.json','utf8'));
  await context.route('**/*',async route=>{const r=route.request();await route.continue({headers:{...r.headers(),...(new URL(r.url()).origin===base?{'x-vercel-protection-bypass':secret}:{})}});});
 }
 await context.addCookies([...cookies].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:'/',secure:true,sameSite:'Lax' as const})));
 const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const existing=await admin.from('granular_learning_successors').select('successor_session_id').eq('source_session_id',sourceId).maybeSingle();if(existing.error)throw existing.error;
 await page.goto(base+'/student/lessons',{waitUntil:'domcontentloaded',timeout:60000});
 const upgrade=page.getByRole('button',{name:'Ajouter les nouvelles activités',exact:true});
 if(!existing.data){await upgrade.waitFor({timeout:60000});await page.screenshot({path:output+'-before.png'});await upgrade.click();await upgrade.waitFor({state:'hidden',timeout:60000});}
 const successorLink=await admin.from('granular_learning_successors').select('successor_session_id').eq('source_session_id',sourceId).single();if(successorLink.error)throw successorLink.error;
 const successorId=successorLink.data.successor_session_id;
 const [original,next]=await Promise.all([
  admin.from('granular_assessment_sessions').select('*').eq('id',sourceId).single(),
  admin.from('granular_assessment_sessions').select('*').eq('id',successorId).single(),
 ]);if(original.error)throw original.error;if(next.error)throw next.error;
 if(checksum(source)!==checksum(original.data))throw Error('Original diagnostic row changed');
 if(next.data.release_id!==target.data.id||next.data.student_id!==credentials.studentId)throw Error('Wrong successor owner or release');
 const fields=['observations','refinements','activeSeconds','completedTeachingIds','exposedMaterialKeys','exposedLearningItemIds','exposedReadingContexts','phase','paused','completionReason'] as const satisfies readonly (keyof AssessmentSession)[];
 const preserved=Object.fromEntries(fields.map(key=>[key,checksum(source.state[key]??null)===checksum(next.data.state[key]??null)]));
 if(Object.values(preserved).some(v=>!v))throw Error('Historical evidence or exposure changed');
 const expectedResponses=source.state.diagnosticResponses?.map((r:{sourceSessionId?:string})=>({...r,sourceSessionId:r.sourceSessionId??sourceId}));
 if(checksum(expectedResponses??null)!==checksum(next.data.state.diagnosticResponses??null))throw Error('Submitted answer history or origin changed');
 await page.reload();await page.getByRole('heading',{name:'Mes leçons',exact:true}).waitFor({timeout:60000});
 if(await upgrade.count())throw Error('Upgrade still offered after reload');
 await page.screenshot({path:output+'-after.png'});
 await page.goto(base+'/student/diagnostic/review?session='+successorId,{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('article[data-result]').first().waitFor({timeout:60000});
 const answers=await page.locator('article[data-result]').count(),wrong=await page.locator('article[data-result=wrong]').count();
 const expectedAnswers=source.state.observations.length,expectedWrong=source.state.observations.filter((o:{correct:boolean})=>!o.correct).length;
 if(answers!==expectedAnswers||wrong!==expectedWrong)throw Error('Review answer counts changed');
 if(errors.length)throw Error(errors.join('; '));
 const result={base,sourceId,successorId,targetRelease:target.data.id,targetKey,answers,wrong,preserved,answerOriginsPreserved:true,originalUnchanged:true,reload:true};
 writeFileSync(output+'.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close();}
