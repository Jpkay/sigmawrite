import type {Page} from 'playwright';
/** Play the real browser media element; never synthesize an ended event. */
export async function playVerifiedAudio(page:Page,audio:{src:string}|undefined){
 if(!audio)return false;
 const element=page.locator('audio');
 await element.waitFor();
 if(await element.count()!==1)throw Error('Expected one question recording');
 const expected=new URL(audio.src,page.url()).href;
 const actual=await element.evaluate(node=>(node as HTMLAudioElement).src);
 if(actual!==expected)throw Error('Displayed recording differs from the question');
 await element.evaluate(async node=>{const media=node as HTMLAudioElement;media.currentTime=0;await media.play();});
 await page.waitForFunction(expected=>{
  const media=document.querySelector('audio');
  if(!media||media.src!==expected)throw Error('Question recording changed during playback');
  if(media.error)throw Error(media.error.message||'Audio decoding failed');
  return media.ended;
 },expected,{timeout:65000});
 return true;
}
