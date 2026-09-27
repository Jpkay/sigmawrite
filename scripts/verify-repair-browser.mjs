/** Real repair component with controlled responses; no production accounts. */
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const mocks={
 '@/lib/student-store':`export const hasStudentBackend=true;window.localUpdates=0;window.replaced=0;export const applySkillResults=()=>window.localUpdates++;export const replaceStudentState=()=>window.replaced++;`,
 '@/lib/actions/student':`window.saveRequests=[];export const submitSkillPractice=input=>new Promise((resolve,reject)=>window.saveRequests.push({input,resolve,reject}));`,
 '@/lib/analytics':`export const track=()=>{};`,
 'next/link':`import React from 'react';export default function Link({href,children,...props}){return React.createElement('a',{href,...props},children);}`,
};
const output=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {RepairPlayer} from './src/app/student/repair/[skillKey]/repair-player';import {MICRO_LESSONS} from './src/lib/content/micro-lessons';window.lesson=MICRO_LESSONS.cause_consequence;createRoot(document.getElementById('root')).render(<RepairPlayer skillKey="cause_consequence" lesson={window.lesson}/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},args=>mocks[args.path]?{path:args.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:mocks[args.path],loader:'js',resolveDir:process.cwd()}));}}]});
const server=createServer((request,response)=>{response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');response.end(request.url==='/bundle.js'?output.outputFiles[0].text:'<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});server.listen(0,'127.0.0.1');await once(server,'listening');let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({timezoneId:'Pacific/Auckland'});const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.getByRole('button',{name:"Je m'entraîne",exact:true}).click();
 const lesson=await page.evaluate(()=>window.lesson);
 for(const [index,question] of [...lesson.questions,lesson.returnToText].entries()){
  await page.getByRole('radio',{name:question.choices[question.correctIndex],exact:true}).check();await page.getByRole('button',{name:'Vérifier',exact:true}).click();
  if(index<lesson.questions.length)await page.getByRole('button',{name:'Suivant',exact:true}).click();
 }
 await page.getByRole('button',{name:'Terminer',exact:true}).click();await page.waitForFunction(()=>window.saveRequests.length===1);await page.evaluate(()=>window.saveRequests[0].reject(Error('save failed')));
 await page.getByText("Le résultat n'a pas pu être enregistré. Réessaie.",{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Vérifier',exact:true}).count(),0);assert.equal(await page.evaluate(()=>window.localUpdates),0);
 await page.getByRole('button',{name:'Terminer',exact:true}).click();await page.waitForFunction(()=>window.saveRequests.length===2);const requests=await page.evaluate(()=>window.saveRequests.map(r=>r.input));assert.deepEqual(requests[0],requests[1]);assert.equal(requests[1].answers.length,lesson.questions.length+1);assert.match(requests[1].submissionId,/^[a-f0-9-]{36}$/);assert.equal(requests[1].corrects,undefined);
 await page.evaluate(()=>window.saveRequests[1].resolve({state:{}}));await page.getByRole('heading',{name:'Micro-leçon terminée 👍',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.replaced),1);assert.equal(await page.evaluate(()=>window.localUpdates),0);assert.deepEqual(errors,[]);
 const report={fixture:'local-real-repair',failedSaveRetainsFinalAnswer:true,retryDoesNotDuplicateAnswers:true,noPrematureLocalSkillUpdate:true,acknowledgedSaveCompletes:true,pageErrors:errors,productionVerified:false};if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
