/** Real guided-teaching component, simulated media events; no server writes. */
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const source=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {GuidedTeaching} from './src/components/diagnostic/guided-teaching';
window.calls=[];function App(){const [index,setIndex]=useState(0),[draft,edit]=useState(''),[phase,setPhase]=useState('lesson');const audio={src:'/fixture.mp3',mimeType:'audio/mpeg'};
const teaching={activityId:'fixture',contentId:'fixture',titleFr:'Écouter',learnerQuestionFr:'Quel son entends-tu ?',phase,steps:[{exampleFr:'Un exemple',explanationFr:'Écoute.',audio}],takeawayFr:'Écoute le son.',boundaryFr:'Entraînement guidé.',exerciseIndex:index,totalExercises:3,exercise:{id:'exercise-'+index,promptFr:'Complète le mot.',...(index<2?{audio}:{}),hintFr:null,feedback:null}};
const send=type=>{window.calls.push(type);if(type==='begin_practice')setPhase('practice');if(type==='answer_practice'){setIndex(index+1);edit('');}};
return <GuidedTeaching teaching={teaching} busy={false} draft={draft} edit={edit} send={send}/>;}createRoot(document.getElementById('root')).render(<App/>);`;
const compiled=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<div id="root"></div>'}));
 await page.goto('http://teaching-audio.fixture/');await page.addScriptTag({content:compiled.outputFiles[0].text});
 await page.locator('audio').waitFor();await page.locator('audio').dispatchEvent('ended');
 await page.getByRole('button',{name:'À moi d’essayer'}).click();
 const answer=page.getByLabel('Ta réponse',{exact:true}),submit=page.getByRole('button',{name:'Vérifier ma réponse'});
 await answer.fill('ch');if(await submit.isEnabled())throw Error('Lesson playback enabled practice answer');
 await page.locator('form').dispatchEvent('submit');
 if(await page.evaluate(()=>((window as unknown as {calls:string[]}).calls).includes('answer_practice')))throw Error('Form bypassed playback gate');
 await page.locator('audio').dispatchEvent('ended');await submit.click();
 await answer.fill('ou');if(await submit.isEnabled())throw Error('Playback leaked to next exercise');
 await page.locator('audio').dispatchEvent('error');await page.getByRole('alert').filter({hasText:'quitter l’activité'}).waitFor();
 if(await submit.isEnabled())throw Error('Failed audio enabled response');
 await page.locator('audio').dispatchEvent('ended');await submit.click();
 await answer.fill('sans audio');if(!await submit.isEnabled())throw Error('Text exercise blocked');
 await page.getByRole('button',{name:'Quitter l’activité',exact:true}).click();
 const calls=await page.evaluate(()=>((window as unknown as {calls:string[]}).calls));
 if(!calls.includes('leave_teaching')||errors.length)throw Error(JSON.stringify({calls,errors}));
 const report={method:'Actual GuidedTeaching React component with dispatched media events; not audio decoding or a live server journey.',lessonAudioVisible:true,practiceRequiresOwnPlayback:true,formBypassBlocked:true,nextExerciseResets:true,errorRecovery:true,textExerciseUnaffected:true,leaveAvailable:true,calls};
 writeFileSync('docs/diagnostic/teaching-audio-ui-2026-09-12.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
