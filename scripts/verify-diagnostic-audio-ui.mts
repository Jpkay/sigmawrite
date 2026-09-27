/** Browser event fixture for the actual client component. No student or database writes.
 * It verifies playback gating and failure recovery, not audio decoding or pronunciation. */
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
import {publicAssessmentView,type AssessmentBundle} from '../src/lib/diagnostic/granular/service';
import {createSession} from '../src/lib/diagnostic/granular/session';
import {bindAssessmentRelease} from '../src/lib/diagnostic/granular/release-binding';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const c=read('docs/diagnostic/v3-scoped-review-candidate.json');
const b:AssessmentBundle={assessment:c.assessment,bank:read('generated/diagnostic-bank-v3-consolidated-draft.json'),taxonomyId:'fixture',bankId:'fixture',activities:[],teachingContent:[]};
const state=createSession(bindAssessmentRelease(b.assessment,b));
const initial={...publicAssessmentView({id:'audio-fixture',studentId:'fixture',releaseId:'fixture',state},b),phase:'assessing',paused:false,question:{id:'audio-1',promptFr:'Écoute et complète le mot.',instructionsFr:'Écris ta réponse.',responseType:'cloze',choices:[],audio:{src:`/diagnostic-audio/${'a'.repeat(64)}.mp3`,mimeType:'audio/mpeg'}}};
const source=`import React from 'react';import {createRoot} from 'react-dom/client';import {GranularDiagnostic} from './src/components/diagnostic/granular-diagnostic';
let view=${JSON.stringify(initial)};window.calls=[];
const start=async()=>({view});
const update=async command=>{window.calls.push(command.type);if(command.type==='answer'||command.type==='skip'){const n=Number(view.question.id.split('-')[1])+1;view={...view,revision:view.revision+1,question:{...view.question,id:'audio-'+n,...(n===3?{audio:undefined}:{})}};}return {view};};
createRoot(document.getElementById('root')).render(<GranularDiagnostic start={start} update={update}/>);`;
const compiled=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixture-boundaries',setup(builder){
 builder.onResolve({filter:/^(next\/link|@\/lib\/student-store|@\/lib\/actions\/granular-diagnostic)$/},args=>({path:args.path,namespace:'fixture'}));
 builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'jsx',resolveDir:process.cwd(),contents:args.path==='next/link'?`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`:args.path==='@/lib/student-store'?'export function replaceStudentState(){}':'export async function startGranularDiagnostic(){throw Error("Unexpected default action")} export const updateGranularDiagnostic=startGranularDiagnostic,updateGranularLearningCheck=startGranularDiagnostic,updateGranularTeaching=startGranularDiagnostic;'}));
}}]});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>route.fulfill({status:200,contentType:'text/html',body:'<div id="root"></div>'}));
 await page.goto('http://diagnostic-audio.fixture/');await page.addScriptTag({content:compiled.outputFiles[0].text});
 const answer=page.getByLabel('Ta réponse',{exact:true}),submit=page.getByRole('button',{name:'Valider',exact:true});
 await answer.fill('essai');if(await submit.isEnabled())throw Error('Audio answer allowed before playback');
 await page.locator('form').dispatchEvent('submit');
 if(await page.evaluate(()=>((window as unknown as {calls:string[]}).calls).includes('answer')))throw Error('Answer submitted before playback');
 await page.locator('audio').dispatchEvent('ended');await submit.click();
 await page.waitForFunction(()=>((window as unknown as {calls:string[]}).calls).includes('answer'));
 await answer.fill('deuxième');if(await submit.isEnabled())throw Error('Playback state leaked to next question');
 await page.locator('audio').dispatchEvent('error');await page.getByRole('alert').filter({hasText:'Le son ne peut pas être lu'}).waitFor();
 if(await submit.isEnabled())throw Error('Failed audio permits answer');
 await page.getByRole('button',{name:'Passer cette question',exact:true}).click();
 await page.waitForFunction(()=>((window as unknown as {calls:string[]}).calls).includes('skip'));
 await answer.fill('sans audio');if(!await submit.isEnabled())throw Error('Text-only question blocked by old audio state');
 const calls=await page.evaluate(()=>((window as unknown as {calls:string[]}).calls));
 if(errors.length)throw Error(errors.join('; '));
 const report={method:'Actual React diagnostic client in isolated browser with mocked actions and dispatched media events. Not real speech, playback decoding or server evidence.',blockedBeforePlayback:true,enabledAfterEnded:true,newQuestionResetsPlayback:true,audioErrorAllowsSkip:true,textOnlyQuestionUnaffected:true,calls};
 writeFileSync('docs/diagnostic/audio-ui-verification-2026-09-12.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
