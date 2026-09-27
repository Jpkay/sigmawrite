/** Read-only browser verification of an explicitly selected technical QA session.
 * Required environment: PLUME_VERIFY_URL, PLUME_VERIFY_CREDENTIALS,
 * PLUME_VERIFY_SESSION, PLUME_VERIFY_EXPECTED_TARGETS, PLUME_VERIFY_REPORT.
 * Optional PLUME_VERIFY_PATH: /student/progress (default) or /student/frontier.
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
const expectedTargets=Number(required('PLUME_VERIFY_EXPECTED_TARGETS'));assert.ok(Number.isSafeInteger(expectedTargets)&&expectedTargets>0,'Positive target count required');
assert.equal(new URL(base).protocol,'https:');
const credential=JSON.parse(readFileSync(required('PLUME_VERIFY_CREDENTIALS'),'utf8'));assert.match(credential.username,/^doves\.granular\..*\.qa$/,'Technical QA account required');
const sessionId=required('PLUME_VERIFY_SESSION');
const reportPath=required('PLUME_VERIFY_REPORT');
const routePath=process.env.PLUME_VERIFY_PATH??'/student/progress';const heading=routePath==='/student/progress'?'Mes progrès':'Ma carte des compétences';
assert.ok(['/student/progress','/student/frontier'].includes(routePath),'Unsupported read-only route');
const boundary=routePath==='/student/progress'?'student:granular-progress':'student:granular-frontier';
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
async function session(){const {data,error}=await db.from('granular_assessment_sessions').select('id,release_id,state').eq('student_id',credential.studentId).eq('id',sessionId).single();if(error)throw error;return data;}
const before=await session();assert.ok(['assessing','learning'].includes(before.state.phase));
const user=await db.auth.admin.getUserById(credential.authUserId);if(user.error)throw user.error;assert.ok(user.data.user.email);
const link=await db.auth.admin.generateLink({type:'magiclink',email:user.data.user.email});if(link.error)throw link.error;
const cookies=new Map<string,string>();const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>values.forEach(value=>cookies.set(value.name,value.value))}});
const verified=await auth.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});if(verified.error)throw verified.error;
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const context=await browser.newContext();const {secret}=JSON.parse(readFileSync('tmp/plume-verification-bypass.json','utf8'));
 await context.route('**/*',route=>route.continue({headers:{...route.request().headers(),...(new URL(route.request().url()).origin===base?{'x-vercel-protection-bypass':secret}:{})}}));
 await context.addCookies([...cookies].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:'/',secure:true,sameSite:'Lax' as const})));
 const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+routePath,{waitUntil:'domcontentloaded',timeout:60000});
 await page.getByRole('heading',{name:heading,exact:true}).waitFor({timeout:60000});
 const details=page.locator('details');assert.equal(await details.count(),expectedTargets);
 assert.equal(await page.getByRole('link',{name:'Reprendre le diagnostic',exact:true}).count(),before.state.phase==='assessing'?1:0);
 const labels=await details.locator('summary > span.font-semibold').allTextContents();assert.equal(labels.length,expectedTargets);
 const {data:journal,error}=await db.from('student_material_delivery_journal').select('payload_checksum,text_fragments').eq('student_id',credential.studentId).eq('boundary',boundary).order('first_delivered_at',{ascending:false}).limit(1).single();if(error)throw error;
 assert.equal(checksum(journal.text_fragments),journal.payload_checksum);
 for(const label of labels)assert.ok(journal.text_fragments.includes(label),label);
 await page.getByLabel('Chercher une compétence').fill('présent');assert.ok(await details.count()>0);assert.ok(await details.count()<expectedTargets);
 for(const text of await details.locator('summary').allTextContents())assert.ok(text.toLocaleLowerCase('fr').includes('présent'));
 await page.getByLabel('Chercher une compétence').fill('');await page.getByRole('combobox').selectOption('unknown');
 assert.ok(await details.count()>0);for(const text of await details.locator('summary').allTextContents())assert.ok(text.includes('Pas encore vérifié'));
 await page.getByRole('combobox').selectOption('all');
 const withPrerequisites=details.filter({has:page.getByRole('heading',{name:'Les bases liées à ce point',exact:true,includeHidden:true})}).first();await withPrerequisites.locator('summary').click();
 const prerequisite=withPrerequisites.getByRole('button').first();const prerequisiteText=await prerequisite.textContent();await prerequisite.click();
 assert.equal(await details.count(),1);assert.ok(prerequisiteText?.includes((await details.locator('summary > span.font-semibold').textContent())!));
 await page.getByRole('button',{name:'Revoir tous les points'}).click();assert.equal(await details.count(),expectedTargets);
 const activities=page.locator('section').filter({has:page.getByRole('heading',{name:'Tes prochaines étapes',exact:true})}).getByRole('link');
 if(before.state.phase==='learning')assert.ok(await activities.count()>0);else assert.equal(await activities.count(),0);for(const href of await activities.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href'))))assert.ok(href?.startsWith('/student/diagnostic?activity='));
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`tmp/granular-${routePath.endsWith('progress')?'progress':'frontier'}-mobile.png`});
 await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:heading,exact:true}).waitFor({timeout:60000});assert.equal(await details.count(),expectedTargets);
 assert.deepEqual(await session(),before);assert.deepEqual(errors,[]);
 const report={base,routePath,phase:before.state.phase,studentId:credential.studentId,sessionId:before.id,pinnedReleaseId:before.release_id,skillTargets:expectedTargets,allLabelsJournaled:true,searchPassed:true,statusFilterPassed:true,prerequisiteNavigationPassed:true,activityLinkCount:await activities.count(),mobileNoHorizontalOverflow:true,reloadPassed:true,sessionUnchanged:true,noAnswersSubmitted:true,pageErrors:errors,limits:'One existing technical account in the reported phase; activity links inspected without opening or submitting. No complete-history or classroom calibration claim.'};
 writeFileSync(reportPath,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
