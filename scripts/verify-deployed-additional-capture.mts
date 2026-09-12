/** Deployed delivery QA on a dedicated account; does not change diagnostic answers. */
import {config} from 'dotenv';
import {readFileSync,writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from 'playwright';
import {MICRO_LESSONS} from '../src/lib/content/micro-lessons';
import {FREQUENT_VERBS} from '../src/lib/conjugation/table';
config({path:'.env.local',quiet:true});
const base=process.argv[2];if(!base||new URL(base).origin!==base||!base.startsWith('https://'))throw Error('HTTPS deployment origin required');
const c=JSON.parse(readFileSync('tmp/plume-granular-capture-qa.json','utf8'));if(c.username!=='doves.granular.capture.qa')throw Error('Wrong QA account');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const u=await db.auth.admin.getUserById(c.authUserId);if(u.error)throw u.error;
const l=await db.auth.admin.generateLink({type:'magiclink',email:u.data.user!.email!});if(l.error)throw l.error;
const cookies=new Map<string,string>();const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:vs=>vs.forEach(v=>cookies.set(v.name,v.value))}});
const signed=await auth.auth.verifyOtp({token_hash:l.data.properties.hashed_token,type:'magiclink'});if(signed.error)throw signed.error;
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const context=await browser.newContext();
 if(new URL(base).hostname.endsWith('.vercel.app')){const{secret}=JSON.parse(readFileSync('tmp/plume-verification-bypass.json','utf8'));await context.route('**/*',r=>r.continue({headers:{...r.request().headers(),...(new URL(r.request().url()).origin===base?{'x-vercel-protection-bypass':secret}:{})}}));}
 await context.addCookies([...cookies].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:'/',secure:true,sameSite:'Lax' as const})));
 const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const goto=async(path:string)=>{const r=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});if(!r?.ok())throw Error('Route failed: '+path);};
 const rows=async(boundary:string)=>{const r=await db.from('student_material_delivery_journal').select('text_fragments,payload_checksum').eq('student_id',c.studentId).eq('boundary',boundary);if(r.error)throw r.error;return r.data;};
 await goto('/student/reference/verbe');await page.getByRole('heading',{name:'Tables de conjugaison',exact:true}).waitFor();
 for(const verb of FREQUENT_VERBS)await page.getByRole('link',{name:verb,exact:true}).waitFor();
 const indexRows=await rows('reference:verb-index');if(!indexRows.some(r=>FREQUENT_VERBS.every(v=>r.text_fragments.includes(v))))throw Error('Verb index source incomplete');
 const lesson=MICRO_LESSONS.cause_consequence;
 await goto('/student/repair/cause_consequence');await page.getByRole('heading',{name:lesson.title,exact:true}).waitFor();
 await page.getByText(lesson.explanationFr,{exact:true}).waitFor();
 const repairRows=await rows('legacy:repair');if(!repairRows.some(r=>[lesson.explanationFr,...lesson.questions.flatMap(q=>[q.prompt,q.explanationFr,...q.choices]),lesson.returnToText.explanationFr].every(t=>r.text_fragments.includes(t))))throw Error('Repair source incomplete');
 await page.getByRole('button',{name:/^Je m.entraîne$/}).click();
 await page.getByText(lesson.questions[0].prompt,{exact:true}).waitFor();
 await page.getByText(lesson.questions[0].choices[1],{exact:true}).click();
 if(!await page.getByRole('radio',{name:lesson.questions[0].choices[1],exact:true}).isChecked())throw Error('Repair choice did not select');
 await page.getByRole('button',{name:/Vérifier/}).click();await page.getByText(lesson.questions[0].explanationFr,{exact:true}).waitFor();
 await page.getByRole('button',{name:/Suivant/}).click();await page.getByText(lesson.questions[1].prompt,{exact:true}).waitFor();
 await page.reload();await page.getByText(lesson.explanationFr,{exact:true}).waitFor();
 if(errors.length)throw Error(errors.join('; '));
 const report={base,studentId:c.studentId,verbIndexVisibleAndJournaled:true,repairExplanationVisibleAndJournaled:true,repairQuestionAndCorrectionWork:true,repairReloadWorks:true,indexRecords:indexRows.length,repairRecords:repairRows.length,pageErrors:errors,scope:'Route delivery and interaction QA; no mastery or complete-history claim. Writing task and feedback deployed QA remains pending.'};
 writeFileSync('docs/diagnostic/additional-capture-browser-2026-09-12.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
