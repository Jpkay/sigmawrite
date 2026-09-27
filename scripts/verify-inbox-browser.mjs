/** Real inbox component with controlled responses; no production accounts. */
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const mocks={
 '@/lib/student-store':'export const hasStudentBackend=true;',
 '@/lib/actions/student':`window.markRequests=[];export const loadStudentNotifications=async()=>[{id:'a',kind:'teacher_comment',message:window.message,payload:{},readAt:null,createdAt:'2026-09-12T23:30:00Z'}];export const markStudentNotificationsRead=()=>new Promise((resolve,reject)=>window.markRequests.push({resolve,reject}));`,
 'next/link':`import React from 'react';export default function Link({href,children,...props}){return React.createElement('a',{href,...props},children);}`,
};
const output=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {StudentInbox} from './src/app/student/inbox/inbox-client';import {INBOX_COPY} from './src/lib/diagnostic/granular/inbox-display';window.message='Message du compte A';const root=createRoot(document.getElementById('root'));window.renderOwner=owner=>root.render(<StudentInbox key={owner} copy={INBOX_COPY}/>);window.renderOwner('a');`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},args=>mocks[args.path]?{path:args.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:mocks[args.path],loader:'js',resolveDir:process.cwd()}));}}]});
const server=createServer((request,response)=>{response.setHeader('Content-Type',request.url==='/bundle.js'?'text/javascript':'text/html');response.end(request.url==='/bundle.js'?output.outputFiles[0].text:'<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});server.listen(0,'127.0.0.1');await once(server,'listening');let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({timezoneId:'Pacific/Auckland'});const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.getByText('Message du compte A',{exact:true}).waitFor();await page.getByText('1 non lu(s)',{exact:true}).waitFor();assert.ok((await page.locator('body').innerText()).includes('sam. 12 sept.'));
 await page.getByRole('button',{name:'Lu',exact:true}).click();await page.waitForFunction(()=>window.markRequests.length===1);assert.equal(await page.getByText('1 non lu(s)',{exact:true}).count(),1);
 await page.evaluate(()=>window.markRequests[0].reject(Error('PRIVATE_DATABASE_DETAIL')));await page.getByRole('alert').waitFor();assert.ok((await page.getByRole('alert').innerText()).includes('n’a pas pu'));assert.ok(!(await page.locator('body').innerText()).includes('PRIVATE_DATABASE_DETAIL'));
 await page.evaluate(()=>{window.message='Message du compte B';window.renderOwner('b');});await page.getByText('Message du compte B',{exact:true}).waitFor();assert.equal(await page.getByText('Message du compte A',{exact:true}).count(),0);
 await page.getByRole('button',{name:'Lu',exact:true}).click();await page.waitForFunction(()=>window.markRequests.length===2);await page.evaluate(()=>window.markRequests[1].resolve({ok:true}));await page.getByText('Tout est lu.',{exact:true}).waitFor();assert.deepEqual(errors,[]);
 const report={fixture:'local-real-inbox',timezoneIndependentDate:true,noOptimisticSuccess:true,genericFailure:true,accountRemount:true,acknowledgedSaveSuccess:true,pageErrors:errors,productionVerified:false};if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
