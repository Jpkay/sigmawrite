/** Real vocabulary component with controlled responses; no production accounts. */
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const mocks={
 '@/lib/actions/vocabulary':`window.reviewRequests=[];export const reviewVocabulary=()=>new Promise((resolve,reject)=>window.reviewRequests.push({resolve,reject}));`,
};
const output=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {VocabularyPractice} from './src/app/student/vocabulary/vocabulary-practice';const root=createRoot(document.getElementById('root'));window.renderOwner=(owner,word)=>root.render(<VocabularyPractice key={owner} initial={[{itemId:owner,word,definition:'Forêt du littoral tropical.',example:null,mastery:0,exposures:2,dueAt:null,lastResult:null}]}/>);window.renderOwner('a','mangrove');`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},args=>mocks[args.path]?{path:args.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:mocks[args.path],loader:'js',resolveDir:process.cwd()}));}}]});
const server=createServer((request,response)=>{response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');response.end(request.url==='/bundle.js'?output.outputFiles[0].text:'<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});server.listen(0,'127.0.0.1');await once(server,'listening');let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({timezoneId:'Pacific/Auckland'});const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.getByText('Forêt du littoral tropical.',{exact:true}).waitFor();assert.equal(await page.getByText('mangrove',{exact:true}).count(),0);
 await page.getByLabel('Écris le mot français').fill('mangrove');await page.getByRole('button',{name:'Vérifier',exact:true}).click();await page.getByText('Exact.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await page.waitForFunction(()=>window.reviewRequests.length===1);await page.evaluate(()=>window.reviewRequests[0].reject(Error('PRIVATE_DATABASE_DETAIL')));await page.getByRole('alert').waitFor();assert.ok(!(await page.locator('body').innerText()).includes('PRIVATE_DATABASE_DETAIL'));assert.equal(await page.getByLabel('Écris le mot français').inputValue(),'mangrove');
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await page.waitForFunction(()=>window.reviewRequests.length===2);await page.evaluate(()=>window.reviewRequests[1].resolve({dueAt:'2099-01-01T00:00:00Z',mastery:.1}));await page.getByText('Révisions terminées',{exact:true}).waitFor();
 await page.evaluate(()=>window.renderOwner('b','rivage'));await page.getByLabel('Écris le mot français').waitFor();assert.equal(await page.getByLabel('Écris le mot français').inputValue(),'');assert.equal(await page.getByText('mangrove',{exact:true}).count(),0);assert.deepEqual(errors,[]);
 const report={fixture:'local-real-vocabulary',answerHiddenBeforeCorrection:true,genericSaveError:true,answerRetainedForRetry:true,acknowledgedSaveAdvances:true,accountRemount:true,pageErrors:errors,productionVerified:false};if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
