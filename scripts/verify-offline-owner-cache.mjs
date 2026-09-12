/** Local browser fixture: real worker/cache behavior, no production accounts. */
import {createServer} from 'node:http';
import {readFileSync,writeFileSync} from 'node:fs';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const A='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
let owner=A;
const server=createServer((request,response)=>{
 response.setHeader('Cache-Control','no-store');
 if(request.url==='/sw.js'){response.setHeader('Content-Type','text/javascript');response.end(readFileSync('public/sw.js'));return;}
 if(request.url==='/switch'){owner=B;response.end('changed');return;}
 response.setHeader('Content-Type','text/html');
 if(request.url.startsWith('/student'))response.setHeader('X-Plume-Offline-Owner',owner);
 response.end(`<!doctype html><html><body><h1>${owner} ${request.url}</h1></body></html>`);
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({headless:true,channel:'chrome'});const context=await browser.newContext();const page=await context.newPage();
 await page.goto(base);
 await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;});
 await page.reload();await page.goto(base+'/student');
 await page.evaluate(async()=>{await fetch('/student/read/one?version=1',{headers:{'X-Plume-Offline-Prefetch':'1'}});});
 await context.setOffline(true);
 assert.equal((await page.goto(base+'/student/read/one?version=1')).status(),200);
 assert.match(await page.locator('h1').innerText(),new RegExp(A));
 // Offline reload is a new navigation client and must retain the same binding.
 assert.equal((await page.reload()).status(),200);
 await context.setOffline(false);await page.goto(base+'/student');
 await page.evaluate(()=>fetch('/switch'));await page.goto(base+'/student');
 await context.setOffline(true);
 assert.equal((await page.goto(base+'/student/read/one?version=1')).status(),503);
 assert.equal(await page.locator('h1').innerText(),'Connexion indisponible');
 await context.setOffline(false);await page.goto(base+'/student');
 await page.evaluate(async()=>{
  await fetch('/student/read/two',{headers:{'X-Plume-Offline-Prefetch':'1'}});
  await new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=resolve;navigator.serviceWorker.controller.postMessage({type:'CLEAR_PRIVATE_STATE'},[channel.port2]);});
 });
 await context.setOffline(true);
 assert.equal((await page.goto(base+'/student/read/two')).status(),503);
 const result={fixture:'local-real-chromium',ownerReplay:true,offlineReload:true,accountSwitchRejected:true,signOutReplayRejected:true,productionVerified:false};
 if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
