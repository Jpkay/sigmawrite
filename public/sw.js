const CACHE="plume-public-v3";
const PRIVATE_CACHE_PREFIXES=["plume-","sigmawrite-"];
const PUBLIC_ASSET=/^\/_next\/static\/|\.(?:css|js|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/i;

self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>PRIVATE_CACHE_PREFIXES.some(prefix=>key.startsWith(prefix))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener("message",event=>{
  if(event.data?.type==="CLEAR_PRIVATE_STATE") event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>PRIVATE_CACHE_PREFIXES.some(prefix=>key.startsWith(prefix))).map(key=>caches.delete(key)))));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
  const url=new URL(request.url);
  const isRsc=request.headers.has("RSC")||url.searchParams.has("_rsc");
  if(request.mode==="navigate"||isRsc||url.pathname.startsWith("/api/")){
    event.respondWith(fetch(request).catch(()=>new Response(
      "<!doctype html><html lang=fr><meta charset=utf-8><meta name=viewport content='width=device-width'><title>Hors ligne</title><main><h1>Connexion indisponible</h1><p>Reconnecte-toi pour accéder en toute sécurité à tes données.</p></main>",
      {status:503,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}}
    )));return;
  }
  if(!PUBLIC_ASSET.test(url.pathname))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(request);
    if(cached)return cached;
    const response=await fetch(request);
    if(response.ok&&response.type==="basic")await cache.put(request,response.clone());
    return response;
  }));
});
