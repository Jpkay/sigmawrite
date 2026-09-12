/** Read-only result rendering verification against an explicitly named QA session. */
import {config} from 'dotenv';
import {readFileSync,writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from 'playwright';
import {publicAssessmentView,type AssessmentBundle} from '../src/lib/diagnostic/granular/service';
import {featureLabel} from '../src/lib/diagnostic/granular/feature-labels';
import {checksum} from '../src/lib/taxonomy/validate';
config({path:'.env.local',quiet:true});
const [base,credentialsPath,sessionId,output]=process.argv.slice(2);
if(!base||new URL(base).origin!==base||new URL(base).protocol!=='https:'||!credentialsPath||!sessionId||!output)throw Error('Expected HTTPS origin, QA credentials file, session UUID, output prefix');
const credentials=JSON.parse(readFileSync(credentialsPath,'utf8'));if(!/^doves\.granular\..*\.qa$/.test(credentials.username))throw Error('Only an explicit technical QA account is allowed');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const load=async()=>{const r=await db.from('granular_assessment_sessions').select('id,student_id,release_id,state').eq('id',sessionId).single();if(r.error)throw r.error;if(r.data.student_id!==credentials.studentId)throw Error('Wrong QA owner');return r.data;};
const before=await load();if(before.state.phase!=='learning')throw Error('Expected a completed diagnostic');
const release=await db.from('granular_assessment_releases').select('bundle').eq('id',before.release_id).single();if(release.error)throw release.error;
const view=publicAssessmentView({id:before.id,studentId:before.student_id,releaseId:before.release_id,state:before.state},release.data.bundle as AssessmentBundle);
const expected=view.results.flatMap(r=>r.modes.flatMap(m=>(m.featureEvidence??[]).flatMap(f=>{const label=featureLabel(f.feature);return label?[{label,text:f.distinctItems===0?'Pas encore vérifié':`${f.correctItems} réponse${f.correctItems===1?'':'s'} réussie${f.correctItems===1?'':'s'} sur ${f.distinctItems}`}]:[]})));
if(!expected.length)throw Error('QA release has no feature results to verify');
const user=await db.auth.admin.getUserById(credentials.authUserId);if(user.error||!user.data.user)throw Error('QA auth unavailable');
const link=await db.auth.admin.generateLink({type:'magiclink',email:user.data.user.email!});if(link.error)throw link.error;
const cookies=new Map<string,string>();
const authClient=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>cookies.set(v.name,v.value))}});
const auth=await authClient.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});if(auth.error)throw auth.error;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});
 if(new URL(base).hostname.endsWith('.vercel.app')){const {secret}=JSON.parse(readFileSync('tmp/plume-verification-bypass.json','utf8'));await context.route('**/*',route=>route.continue({headers:{...route.request().headers(),...(new URL(route.request().url()).origin===base?{'x-vercel-protection-bypass':secret}:{})}}));}
 await context.addCookies([...cookies].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:'/',secure:true,sameSite:'Lax' as const})));
 const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/student/diagnostic',{waitUntil:'domcontentloaded',timeout:60000});
 await page.getByRole('heading',{name:'Ton bilan détaillé',exact:true}).waitFor({timeout:60000});
 for(const summary of await page.locator('details > summary').all())await summary.click();
 for(const row of expected){const matches=page.locator('li').filter({hasText:`${row.label} : ${row.text}`});if(!await matches.count())throw Error(`Missing displayed feature: ${row.label} / ${row.text}`);}
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow on the deployed result page');
 await page.getByText('Détail des réponses prises en compte',{exact:true}).first().scrollIntoViewIfNeeded();
 await page.screenshot({path:output+'.png',fullPage:false});
 const after=await load();if(checksum([before.state.observations,before.state.refinements])!==checksum([after.state.observations,after.state.refinements]))throw Error('Result viewing changed student evidence');
 if(errors.length)throw Error(errors.join('; '));
 const report={base,sessionId,releaseId:before.release_id,featureRows:expected.length,answeredFeatureRows:expected.filter(r=>r.text!=='Pas encore vérifié').length,evidenceUnchanged:true,mobileWidth:390,noHorizontalOverflow:true};
 writeFileSync(output+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
