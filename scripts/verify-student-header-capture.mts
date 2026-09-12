/** Read-only verification of server student header text delivered to a technical QA account.
 * Required environment: PLUME_VERIFY_URL, PLUME_VERIFY_CREDENTIALS,
 * PLUME_VERIFY_SESSION, PLUME_VERIFY_REPORT.
 * Authenticated route visits record delivery, but no answers are submitted.
 */
import {strict as assert} from 'node:assert';
import {readFileSync,writeFileSync} from 'node:fs';
import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from 'playwright';
import {checksum} from '../src/lib/taxonomy/validate';
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
 const page=await context.newPage(),errors:string[]=[],reports:object[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 const routes=[
  ['/student/lessons','student:lessons-header'],['/student/dictee','student:dictation-header'],
  ['/student/vocabulary','student:vocabulary-header'],['/student/inbox','student:inbox-header'],
  ['/student/recueil','student:recueil-header'],['/student/reference/verbe','reference:verb-index-header'],
  ['/student/reference/verbe/aller','reference:verb-header'],['/student/reference/regle/identifier_sujet_verbe','reference:rule-header'],
  ['/student/reference/regle/qa-missing-header-rule','reference:rule-header'],
 ];
 for(const [path,boundary] of routes){
  await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});
  const heading=page.getByRole('heading',{level:1}).first();await heading.waitFor({timeout:60000});
  const header=heading.locator('..').locator('..');
  const displayed=(await header.locator('h1,p,a,button').allTextContents()).map(text=>text.trim()).filter(Boolean);
  const journal=await db.from('student_material_delivery_journal').select('payload_checksum,text_fragments').eq('student_id',credential.studentId).eq('boundary',boundary).eq('payload_checksum',checksum([...new Set(displayed)].sort())).single();if(journal.error)throw journal.error;
  assert.equal(journal.data.payload_checksum,checksum(journal.data.text_fragments));
  for(const text of displayed)assert.ok(journal.data.text_fragments.includes(text),`${path}: missing header text ${text}`);
  reports.push({path,boundary,title:await heading.textContent(),displayedTextCount:displayed.length,allDisplayedHeaderTextJournaled:true});
 }
 assert.deepEqual(await session(),before);assert.deepEqual(errors,[]);
 const report={base,studentId:credential.studentId,sessionId,reports,sessionUnchanged:true,pageErrors:errors,limits:'Server headers on the listed routes only. The granular frontier uses a different view; legacy frontier not exercised. No whole-page, client-state, or complete-history certification. No answers submitted.'};
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
} finally {await browser.close();}
