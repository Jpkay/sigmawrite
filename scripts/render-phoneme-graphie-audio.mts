/** Offline authoring. Fixed French speech assets, not runtime browser synthesis. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PHONEME_GRAPHIE_DRAFTS,PHONEME_GRAPHIE_TEACHING_WORDS} from '../src/lib/diagnostic/granular/phoneme-graphie-drafts';
const manifestPath='generated/french-phoneme-graphie-audio-draft.json';
const words=[...new Set([...PHONEME_GRAPHIE_DRAFTS.map(d=>d.word),...PHONEME_GRAPHIE_TEACHING_WORDS.map(([word])=>word)])];
const previous=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,'utf8')):{assets:[]};
const voice='Thomas',rate=150;
const output='public/diagnostic-audio';mkdirSync(output,{recursive:true});
const work=mkdtempSync(join(tmpdir(),'plume-phoneme-audio-'));
const assets=[];
try{
 for(const word of words){
  const speechText=`Le mot est : ${word}.`;
  const old=previous.assets.find((a:{word:string;speechText:string;voice:string;rate:number})=>a.word===word&&a.speechText===speechText&&a.voice===voice&&a.rate===rate);
  if(old&&existsSync(join(output,`${old.audioStimulus.sha256.slice(7)}.mp3`))){
   const bytes=readFileSync(join(output,`${old.audioStimulus.sha256.slice(7)}.mp3`));
   if(`sha256:${createHash('sha256').update(bytes).digest('hex')}`!==old.audioStimulus.sha256)throw Error(`Existing asset mismatch: ${word}`);
   assets.push(old);continue;
  }
  if(process.argv.includes('--check'))throw Error(`Missing frozen audio: ${word}`);
  const input=join(work,'input.txt'),aiff=join(work,'speech.aiff'),mp3=join(work,'speech.mp3');
  writeFileSync(input,speechText);
  execFileSync('say',['-v',voice,'-r',String(rate),'-f',input,'-o',aiff]);
  execFileSync('ffmpeg',['-v','error','-y','-i',aiff,'-map_metadata','-1','-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','64k',mp3]);
  execFileSync('ffmpeg',['-v','error','-i',mp3,'-f','null','-']);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels','-of','json',mp3],{encoding:'utf8'}));
  const durationMs=Math.ceil(Number(probe.format.duration)*1000);
  if(!Number.isFinite(durationMs)||durationMs<100||durationMs>10000||probe.streams[0]?.codec_name!=='mp3')throw Error(`Invalid rendered speech: ${word}`);
  const bytes=readFileSync(mp3),sha256=`sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  const target=join(output,`${sha256.slice(7)}.mp3`);
  if(existsSync(target)){if(!readFileSync(target).equals(bytes))throw Error('Audio digest collision');}
  else writeFileSync(target,bytes,{flag:'wx'});
  assets.push({word,speechText,provider:'macos-say',voice,rate,status:'draft_requires_pronunciation_review',audioStimulus:{sha256,durationMs,locale:'fr-FR',format:'mp3'},decodeVerified:true});
  writeFileSync(manifestPath,JSON.stringify({version:1,status:'draft_requires_pronunciation_review',assets},null,2)+'\n');
  console.log(JSON.stringify({rendered:assets.length,total:words.length,word,durationMs}));
 }
 const result={version:1,status:'draft_requires_pronunciation_review',assets};
 if(!process.argv.includes('--check'))writeFileSync(manifestPath,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({assets:assets.length,allDecodeVerified:assets.every(a=>a.decodeVerified),pronunciationReviewed:false}));
}finally{rmSync(work,{recursive:true,force:true});}
