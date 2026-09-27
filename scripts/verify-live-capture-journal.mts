/** Focused technical QA through deployed UI. Normal stored answers and elapsed
 * time; not a timed whole-graph diagnostic or educational calibration. */
import {config} from 'dotenv';import {readFileSync,writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';import {createServerClient} from '@supabase/ssr';import {chromium} from 'playwright';
import {SupabaseAssessmentStore} from '../src/lib/diagnostic/granular/store';
import {publicAssessmentView} from '../src/lib/diagnostic/granular/service';
import {materialIdentity} from '../src/lib/diagnostic/granular/material-identity';
config({path:'.env.local',quiet:true});
const base=process.argv[2];if(!base||new URL(base).origin!==base||!base.startsWith('https://'))throw Error('HTTPS deployment origin required');
const c=JSON.parse(readFileSync('tmp/plume-granular-capture-qa.json','utf8'));if(c.username!=='doves.granular.capture.qa')throw Error('Wrong QA account');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
const started=await new SupabaseAssessmentStore(db).start(c.studentId,'french-granular-feature-rendering-qa-v1');if(!started)throw Error('Focused QA release unavailable');
const bundle=started.bundle;
const load=async()=>{const r=await db.from('granular_assessment_sessions').select('id,state').eq('id',started.session.id).eq('student_id',c.studentId).single();if(r.error)throw r.error;return {session:{...started.session,state:r.data.state},view:publicAssessmentView({...started.session,state:r.data.state},bundle)};};
const user=await db.auth.admin.getUserById(c.authUserId);if(user.error)throw user.error;
const link=await db.auth.admin.generateLink({type:'magiclink',email:user.data.user!.email!});if(link.error)throw link.error;
const cookies=new Map<string,string>();const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),setAll:vs=>vs.forEach(v=>cookies.set(v.name,v.value))}});
const signed=await auth.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});if(signed.error)throw signed.error;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext();
 if(new URL(base).hostname.endsWith('.vercel.app')){const {secret}=JSON.parse(readFileSync('tmp/plume-verification-bypass.json','utf8'));await context.route('**/*',r=>r.continue({headers:{...r.request().headers(),...(new URL(r.request().url()).origin===base?{'x-vercel-protection-bypass':secret}:{})}}));}
 await context.addCookies([...cookies].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:'/',secure:true,sameSite:'Lax' as const})));
 const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const wait=async(predicate:(x:Awaited<ReturnType<typeof load>>)=>boolean)=>{for(let i=0;i<60;i++){if(errors.length)throw Error(errors.join('; '));const x=await load();if(predicate(x))return x;await page.waitForTimeout(1000);}throw Error('Persisted QA transition timed out');};
 const student=await db.from('students').select('onboarding_completed_at').eq('id',c.studentId).single();if(student.error)throw student.error;
 if(!student.data.onboarding_completed_at){
  await page.goto(base+'/student/onboarding',{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('button',{name:'Continuer',exact:true}).click();
  for(const name of [/Football/,/Musique/,/Animaux/])await page.getByRole('button',{name}).click();
  await page.getByRole('button',{name:/Commencer le diagnostic/}).click();
  await page.waitForURL('**/student/diagnostic',{timeout:60000});
 }else await page.goto(base+'/student/diagnostic',{waitUntil:'domcontentloaded',timeout:60000});
 let current=await load();
 if(current.view.phase==='assessing'&&current.view.paused){await page.getByRole('button',{name:/^(Commencer|Reprendre)$/}).click();current=await wait(x=>!x.view.paused&&!!x.view.question);}
 while(current.view.phase==='assessing'){
  const q=current.view.question!;const entry=bundle.bank.items.find(e=>e.itemKey===q.id)!.item;const count=current.view.answeredCount;
  await page.getByLabel('Ta réponse',{exact:true}).fill(count%3===0?entry.correctAnswer!:'je ne sais pas');
  await page.getByRole('button',{name:'Valider',exact:true}).click();
  current=await wait(x=>x.view.answeredCount>count||x.view.phase==='learning');
  console.log(JSON.stringify({phase:current.view.phase,answers:current.view.answeredCount}));
 }
 if(current.view.answeredCount!==12)throw Error('Unexpected focused diagnostic length');
 await page.goto(base+'/student/reference/verbe/passer',{waitUntil:'domcontentloaded',timeout:60000});
 await page.getByRole('heading',{name:'passer',exact:true}).waitFor({timeout:60000});
 const source=await db.from('student_material_delivery_journal').select('payload_checksum,text_fragments').eq('student_id',c.studentId).eq('boundary','reference:verb');if(source.error)throw source.error;
 if(!source.data.some(r=>r.text_fragments.includes('passer')))throw Error('Visible reference word was not journaled');
 const target='v3-written-syllables:production-passer';
 let found=current.session.state.refinements.find((o:{itemId:string})=>o.itemId===target);
 for(let n=0;!found&&n<12;n++){
  current=await load();
  if(!current.view.learningCheck){const activity=current.view.learningActivities.find(a=>a.kind==='independent_check');if(!activity)throw Error('No remaining independent check');await page.goto(base+'/student/diagnostic?activity='+encodeURIComponent(activity.activityId),{waitUntil:'domcontentloaded',timeout:60000});current=await wait(x=>!!x.view.learningCheck);}
  const q=current.view.learningCheck!.question!,entry=bundle.bank.items.find(e=>e.itemKey===q.id)!.item;const count=current.session.state.refinements.length;
  await page.getByLabel('Ta réponse',{exact:true}).fill(q.id===target?entry.correctAnswer!:'je ne sais pas');await page.getByRole('button',{name:'Valider',exact:true}).click();
  current=await wait(x=>x.session.state.refinements.length>count);
  console.log(JSON.stringify({independentQuestion:q.id,refinements:current.session.state.refinements.length}));
  found=current.session.state.refinements.find((o:{itemId:string})=>o.itemId===target);
 }
 if(!found)throw Error('Target word not reached');
 const key=materialIdentity('word','passer'),receipt=found.materialReceipt;
 if(!receipt?.previouslySeenKeys.includes(key)||receipt.firstRecordedKeys.includes(key)||!receipt.priorJournalMatches?.some((m:{materialKey:string;boundary:string})=>m.materialKey===key&&m.boundary==='reference:verb'))throw Error('Earlier reference word was not excluded from novelty evidence');
 if(receipt.historyComplete!==false)throw Error('Disabled coverage contract unexpectedly certified history');
 await page.reload();await page.getByRole('heading',{name:'Tes acquis et tes prochaines étapes',exact:true}).waitFor({timeout:60000});
 const again=await load();if(JSON.stringify(again.session.state.refinements.find((o:{itemId:string})=>o.itemId===target))!==JSON.stringify(found))throw Error('Reload changed persisted evidence');
 const journals=await db.from('student_material_delivery_journal').select('boundary').eq('student_id',c.studentId);if(journals.error)throw journals.error;
 const report={base,sessionId:started.session.id,studentId:c.studentId,initialAnswers:12,initialCorrect:again.session.state.observations.filter((o:{correct:boolean})=>o.correct).length,refinements:again.session.state.refinements.length,referenceWordVisibleAndJournaled:true,targetQuestion:target,priorExposureExcluded:true,sourceReferenceRetained:true,historyComplete:false,reloadPreserved:true,boundaries:[...new Set(journals.data.map(r=>r.boundary))],pageErrors:errors,scope:'Focused one-target technical QA, not a full diagnostic or educational validation.'};
 writeFileSync('docs/diagnostic/capture-candidate-browser-2026-09-12.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
