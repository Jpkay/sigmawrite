import {OFFLINE_FALLBACK_HTML} from "../../../public/offline-fallback.js";
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {expect,it,vi} from 'vitest';
const A='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const origin='https://plume.test';
function harness(stores=new Map<string,Map<string,Response>>()){
 const listeners:Record<string,(event:unknown)=>void>={};
 const fetch=vi.fn();
 const caches={keys:async()=>[...stores.keys()],delete:async(key:string)=>stores.delete(key),open:async(key:string)=>{
  if(!stores.has(key))stores.set(key,new Map());const rows=stores.get(key)!;
  return {put:async(request:string|Request,response:Response)=>{rows.set(typeof request==='string'?request:request.url,response.clone());},match:async(request:string|Request)=>rows.get(typeof request==='string'?request:request.url)?.clone()};
 }};
 runInNewContext(readFileSync('public/sw.js','utf8').replace('import {OFFLINE_FALLBACK_HTML} from "./offline-fallback.js";',''),{OFFLINE_FALLBACK_HTML,URL,Response,Headers,Map,Promise,caches,fetch,self:{location:{origin},addEventListener:(name:string,fn:(event:unknown)=>void)=>{listeners[name]=fn;},skipWaiting:async()=>{},clients:{claim:async()=>{}}}});
 async function get(path:string,{client='tab',mode='navigate',prefetch=false,resulting=''}={}){
  let response!:Promise<Response>;
  listeners.fetch({clientId:client,resultingClientId:resulting,request:{url:origin+path,method:'GET',mode,headers:new Headers(prefetch?{'X-Plume-Offline-Prefetch':'1'}:{})},respondWith:(value:Promise<Response>)=>{response=value;}});
  return response;
 }
 async function clear(){let done!:Promise<void>;listeners.message({data:{type:'CLEAR_PRIVATE_STATE'},waitUntil:(p:Promise<void>)=>{done=p;}});await done;}
 return {get,clear,fetch,stores};
}
const page=(owner:string,text='saved')=>new Response(text,{headers:{'X-Plume-Offline-Owner':owner,'Content-Type':'text/html'}});
it('replays only exact URLs for the server-confirmed owner and client',async()=>{
 const h=harness();h.fetch.mockResolvedValue(page(A));await h.get('/student');
 await h.get('/student/read/one?version=1',{mode:'cors',prefetch:true});
 h.fetch.mockRejectedValue(Error('offline'));
 expect(await (await h.get('/student/read/one?version=1')).text()).toBe('saved');
 expect((await h.get('/student/read/one?version=2')).status).toBe(503);
 expect((await h.get('/student/read/one?version=1',{client:'unknown-tab'})).status).toBe(503);
});
it('clears the previous owner and does not accept stale-tab prefetches after account switch',async()=>{
 const h=harness();h.fetch.mockResolvedValue(page(A));await h.get('/student');await h.get('/student/read/one',{mode:'cors',prefetch:true});
 h.fetch.mockResolvedValue(page(B));await h.get('/student',{client:'new-tab'});
 h.fetch.mockResolvedValue(page(A));await h.get('/student/read/one',{mode:'cors',prefetch:true});
 h.fetch.mockRejectedValue(Error('offline'));
 expect((await h.get('/student/read/one')).status).toBe(503);
 expect((await h.get('/student/read/one',{client:'new-tab'})).status).toBe(503);
 expect([...h.stores.keys()].some(key=>key.endsWith(A))).toBe(false);
});
it('does not resurrect a pack when a download finishes after sign-out',async()=>{
 const h=harness();h.fetch.mockResolvedValue(page(A));await h.get('/student');
 let finish!:(r:Response)=>void;h.fetch.mockReturnValueOnce(new Promise<Response>(resolve=>{finish=resolve;}));
 const pending=h.get('/student/read/late',{mode:'cors',prefetch:true});
 await h.clear();finish(page(A));await pending;
 expect([...h.stores.keys()]).toEqual([]);
 h.fetch.mockRejectedValue(Error('offline'));expect((await h.get('/student/read/late')).status).toBe(503);
});
it('does not store redirects, unsigned content or RSC payloads as offline pages',async()=>{
 const h=harness();h.fetch.mockResolvedValue(new Response('unsigned',{headers:{'Content-Type':'text/html'}}));await h.get('/student/read/one',{mode:'cors',prefetch:true});
 const redirected=page(A);Object.defineProperty(redirected,'redirected',{value:true});h.fetch.mockResolvedValue(redirected);await h.get('/student/read/redirect',{mode:'cors',prefetch:true});
 h.fetch.mockResolvedValue(new Response('rsc',{headers:{'Content-Type':'text/x-component','X-Plume-Offline-Owner':A}}));await h.get('/student/read/one?_rsc=x',{mode:'cors',prefetch:true});
 expect([...h.stores.values()].flatMap(rows=>[...rows.keys()])).toEqual([]);
});

it('requires a fresh server binding after worker restart even if a pack remains',async()=>{
 const h=harness();h.fetch.mockResolvedValue(page(A));await h.get('/student');await h.get('/student/read/one',{mode:'cors',prefetch:true});
 const restarted=harness(h.stores);restarted.fetch.mockRejectedValue(Error('offline'));
 expect((await restarted.get('/student/read/one')).status).toBe(503);
});
