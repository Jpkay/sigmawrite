/** Verify deployed bytes and actual browser decoding; not pronunciation or student UI proof. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {playVerifiedAudio} from './lib/play-verified-audio';
const [base,output,bypassPath]=process.argv.slice(2);
if(!base||!output||new URL(base).protocol!=='https:')throw Error('Expected HTTPS candidate URL and output report');
const origin=new URL(base).origin;
if(origin!==base)throw Error('Use an exact candidate origin');
const headers:Record<string,string>={};
if(bypassPath){if(!new URL(base).hostname.endsWith('.vercel.app'))throw Error('Bypass is only for candidate Vercel origins');headers['x-vercel-protection-bypass']=JSON.parse(readFileSync(bypassPath,'utf8')).secret;}
const manifest=JSON.parse(readFileSync('generated/french-phoneme-graphie-audio-draft.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const results=[];
try{
 const context=await browser.newContext();
 if(bypassPath)await context.route('**/*',route=>route.continue({headers:{...route.request().headers(),...(new URL(route.request().url()).origin===origin?headers:{})}}));
 const page=await context.newPage();
 // Intercept only this fixture document; audio still comes from the real deployment.
 await page.route(base+'/__audio_verification_fixture__',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<button>Écouter</button><audio controls></audio>'}));
 await page.goto(base+'/__audio_verification_fixture__',{waitUntil:'domcontentloaded'});
 for(const row of manifest.assets){
  const path=`/diagnostic-audio/${row.audioStimulus.sha256.slice(7)}.mp3`;
  const response=await fetch(base+path,{headers,redirect:'error'});if(!response.ok)throw Error(`Audio HTTP ${response.status}: ${row.word}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(`sha256:${createHash('sha256').update(bytes).digest('hex')}`!==row.audioStimulus.sha256)throw Error(`Deployed byte mismatch: ${row.word}`);
  await page.locator('audio').evaluate((node,src)=>{(node as HTMLAudioElement).src=src;},path);
  await page.getByRole('button',{name:'Écouter'}).click();
  await playVerifiedAudio(page,{src:path});
  results.push({sha256:row.audioStimulus.sha256,word:row.word,hashVerified:true,playbackEnded:true});
  console.log(JSON.stringify({played:results.length,total:manifest.assets.length}));
 }
 let mismatchRejected=false;try{await playVerifiedAudio(page,{src:'/wrong-recording.mp3'});}catch(error){mismatchRejected=String(error).includes('differs');}
 if(!mismatchRejected)throw Error('Playback verifier did not reject a different recording');
 writeFileSync(output,JSON.stringify({base,method:'SHA-256 checks of deployed assets plus real Chrome playback in a media fixture on the candidate origin. Not a student UI or pronunciation review.',results,mismatchRejected,pronunciationReviewed:false},null,2)+'\n');
}finally{await browser.close();}
