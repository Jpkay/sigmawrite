const CACHE="plume-public-v5";
const OFFLINE_PACK="plume-offline-pack-v2-";
const PRIVATE_CACHE_PREFIXES=["plume-","sigmawrite-"];
const PUBLIC_ASSET=/^\/_next\/static\/|\.(?:css|js|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/i;
let owner=null,generation=0;
const clientOwners=new Map();
let writes=Promise.resolve();
function serialize(operation){const result=writes.then(operation);writes=result.catch(()=>{});return result;}
function clearPrivate(){
  generation++;owner=null;clientOwners.clear();
  return serialize(async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>PRIVATE_CACHE_PREFIXES.some(prefix=>key.startsWith(prefix))).map(key=>caches.delete(key)));
  });
}
async function acceptStudentResponse(event,request,response,started){
  const received=response.headers.get("X-Plume-Offline-Owner");
  if(started!==generation||!response.ok||response.redirected||!received||!/^[a-f0-9-]{36}$/i.test(received))return;
  const clientId=event.resultingClientId||event.clientId;
  if(!clientId)return;
  // Only a navigation can switch an established owner. Stale prefetches from
  // another tab cannot switch it back after the account has changed.
  if(owner!==null&&owner!==received&&request.mode!=="navigate")return;
  if(owner!==received){
    if(owner!==null)generation++;
    owner=received;clientOwners.clear();
    await serialize(async()=>{
      const keys=await caches.keys();
      await Promise.all(keys.filter(key=>key.startsWith("plume-offline-pack-")).map(key=>caches.delete(key)));
    });
  }
  const version=generation;
  clientOwners.set(clientId,received);
  if(request.headers.get("X-Plume-Offline-Prefetch")!=="1"||!response.headers.get("Content-Type")?.includes("text/html"))return;
  const copy=response.clone();
  await serialize(async()=>{
    if(version!==generation||owner!==received)return;
    const cache=await caches.open(OFFLINE_PACK+received);
    await cache.put(request.url,copy);
  });
}
function offlineResponse(){return new Response(
 "<!doctype html><html lang=fr><meta charset=utf-8><meta name=viewport content='width=device-width'><title>Hors ligne</title><main><h1>Connexion indisponible</h1><p>Reconnecte-toi pour accéder en toute sécurité à tes données.</p></main>",
 {status:503,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}}
);}
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>event.waitUntil(clearPrivate().then(()=>self.clients.claim())));
self.addEventListener("message",event=>{
 if(event.data?.type==="CLEAR_PRIVATE_STATE")event.waitUntil(clearPrivate().then(()=>event.ports?.[0]?.postMessage({cleared:true})));
});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 const isRsc=request.headers.has("RSC")||url.searchParams.has("_rsc");
 const student=url.pathname==="/student"||url.pathname.startsWith("/student/");
 if(request.mode==="navigate"||isRsc||url.pathname.startsWith("/api/")||student){
  const started=generation;
  event.respondWith((async()=>{
   try{
    const response=await fetch(request);
    if(student&&!isRsc)await acceptStudentResponse(event,request,response,started).catch(()=>{});
    return response;
   }catch{
    // A worker restart has no authenticated client binding: reconnect before
    // replaying private content. Old packs and URL-only lookups are never used.
    const version=generation,known=clientOwners.get(event.clientId);
    if(started===version&&request.mode==="navigate"&&student&&known&&known===owner){
     await writes;
     const pack=await caches.open(OFFLINE_PACK+known);
     const packed=await pack.match(request.url);
     if(version===generation&&owner===known&&packed?.headers.get("X-Plume-Offline-Owner")===known){
      if(event.resultingClientId)clientOwners.set(event.resultingClientId,known);
      return packed;
     }
    }
    return offlineResponse();
   }
  })());return;
 }
 if(!PUBLIC_ASSET.test(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(request);if(cached)return cached;
  const response=await fetch(request);
  if(response.ok&&response.type==="basic")await cache.put(request,response.clone());
  return response;
 }));
});
