/** Actual MP3 decoding and browser playback; not a pronunciation review. */
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
const manifest=JSON.parse(readFileSync('generated/french-phoneme-graphie-audio-draft.json','utf8'));
const paths=new Map<string,Buffer>();
for(const row of manifest.assets){
 const path=`/diagnostic-audio/${row.audioStimulus.sha256.slice(7)}.mp3`,bytes=readFileSync(`public${path}`);
 if(`sha256:${createHash('sha256').update(bytes).digest('hex')}`!==row.audioStimulus.sha256)throw Error('Audio digest mismatch');
 const check=spawnSync('ffmpeg',['-hide_banner','-i',`public${path}`,'-af','volumedetect','-f','null','-'],{encoding:'utf8'});
 const mean=Number(check.stderr.match(/mean_volume: (-?[\d.]+) dB/)?.[1]);
 if(check.status!==0||!Number.isFinite(mean)||mean< -50)throw Error(`Silent or undecodable audio: ${row.word}`);
 paths.set(path,bytes);
}
const server=createServer((req,res)=>{
 if(req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<audio id="sound" controls></audio><button id="play" onclick="const a=document.querySelector(\'audio\'); a.currentTime=0; a.play().catch(e=>window.playError=e.message)">Écouter</button>');return;}
 const bytes=paths.get(req.url??'');if(!bytes){res.statusCode=404;res.end();return;}
 res.setHeader('Content-Type','audio/mpeg');res.setHeader('Content-Length',bytes.length);res.end(bytes);
});
await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
const address=server.address();if(!address||typeof address==='string')throw Error('Fixture server missing address');
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
 const page=await browser.newPage();await page.goto(`http://127.0.0.1:${address.port}/`);
 for(const row of manifest.assets){
  const path=`/diagnostic-audio/${row.audioStimulus.sha256.slice(7)}.mp3`;
  await page.locator('audio').evaluate((audio,src)=>{(audio as HTMLAudioElement).src=src;},path);
  await page.getByRole('button',{name:'Écouter'}).click();
  await page.waitForFunction(()=>{const a=document.querySelector('audio')!;if(a.error)throw Error(a.error.message);return a.ended;},{},{timeout:15000});
  const duration=await page.locator('audio').evaluate(a=>(a as HTMLAudioElement).duration);
  if(!Number.isFinite(duration)||Math.abs(duration*1000-row.audioStimulus.durationMs)>250)throw Error(`Browser duration mismatch: ${row.word}`);
  results.push({word:row.word,sha256:row.audioStimulus.sha256,browserDurationMs:Math.round(duration*1000),playbackEnded:true});
  console.log(JSON.stringify({played:results.length,total:manifest.assets.length,word:row.word}));
 }
 await page.getByRole('button',{name:'Écouter'}).click();await page.waitForFunction(()=>document.querySelector('audio')!.ended,{},{timeout:15000});
 const output={method:'Exact MP3 bytes decoded with ffmpeg, checked for non-silent signal, then played to completion in headless Chrome over local HTTP. Includes replay. Does not establish pronunciation or educational validity.',results,replayPassed:true,pronunciationReviewed:false};
 writeFileSync('docs/diagnostic/phoneme-audio-playback-2026-09-12.json',JSON.stringify(output,null,2)+'\n');
}finally{await browser.close();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
