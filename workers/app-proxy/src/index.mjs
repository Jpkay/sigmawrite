const UPSTREAM_ORIGIN = "https://sigmawrite.vercel.app";

export function createUpstreamRequest(request) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, UPSTREAM_ORIGIN);
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", "https");

  return new Request(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });
}

export function rewriteLocation(location, incomingOrigin) {
  if (!location) return null;

  const resolved = new URL(location, UPSTREAM_ORIGIN);
  if (resolved.origin !== UPSTREAM_ORIGIN) return location;

  return `${incomingOrigin}${resolved.pathname}${resolved.search}${resolved.hash}`;
}

export async function proxyRequest(request, fetchImpl = fetch) {
  const incomingUrl = new URL(request.url);
  const upstreamResponse = await fetchImpl(createUpstreamRequest(request));
  const headers = new Headers(upstreamResponse.headers);
  const location = rewriteLocation(headers.get("location"), incomingUrl.origin);

  if (location) headers.set("location", location);
  headers.set("x-plume-origin", "vercel-production");

  const bodyless = request.method === "HEAD" || [204, 205, 304].includes(upstreamResponse.status);
  return new Response(bodyless ? null : upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

export default {
  fetch(request) {
    return proxyRequest(request);
  },
};
