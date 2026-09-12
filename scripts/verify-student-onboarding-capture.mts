/** Read-only verification of onboarding copy and unsaved choices delivered to a technical QA account.
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
import {onboardingPayload,onboardingDisplayText} from '../src/app/student/onboarding/onboarding-copy';
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
 await page.goto(base+'/student/onboarding',{waitUntil:'domcontentloaded',timeout:60000});
 await page.getByRole('heading',{name:onboardingPayload.copy.title,exact:true}).waitFor({timeout:60000});
 const home=page.getByRole('checkbox',{name:'À la maison',exact:true}),school=page.getByRole('checkbox',{name:'À l’école, dans plusieurs matières',exact:true});
 await home.check();await school.check();assert.equal(await home.isChecked(),true);assert.equal(await school.isChecked(),true);
 assert.equal(await page.locator('#onboarding-grade option').count(),onboardingPayload.grades.length);
 await page.getByRole('button',{name:onboardingPayload.copy.continue,exact:true}).click();
 const start=page.getByRole('button',{name:onboardingPayload.copy.start,exact:true});assert.equal(await start.isDisabled(),true);
 for(const interest of onboardingPayload.interests)assert.equal(await page.getByRole('button',{name:new RegExp('^'+interest.emoji+'\\s*'+interest.labelFr.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*$')}).count(),1);
 for(const name of ['Mangas','Football','Musique'])await page.getByRole('button',{name:new RegExp(name)}).click();
 assert.equal(await start.isEnabled(),true);
 const fragments=deliveredTextFragments(onboardingDisplayText);
 const journal=await db.from('student_material_delivery_journal').select('text_fragments').eq('student_id',credential.studentId).eq('boundary','student:onboarding-copy').eq('payload_checksum',checksum(fragments)).single();if(journal.error)throw journal.error;assert.deepEqual(journal.data.text_fragments,fragments);
 await page.getByRole('button',{name:onboardingPayload.copy.back,exact:true}).click();assert.equal(await home.isChecked(),true);assert.equal(await school.isChecked(),true);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(await session(),before);assert.deepEqual(errors,[]);
 const report={base,studentId:credential.studentId,sessionId,interestChoices:onboardingPayload.interests.length,homeAndSchoolSelectedTogether:true,threeInterestMinimumEnforced:true,backRetainsUnsavedChoices:true,journalMatchesDeliveredCopy:true,mobileNoHorizontalOverflow:true,sessionUnchanged:true,profileSubmitted:false,answersSubmitted:0,pageErrors:errors,limits:'Existing paused technical account. Form interaction without submission; does not prove a fresh-account baseline or full material history.'};
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
} finally {await browser.close();}
