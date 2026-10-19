import assert from "node:assert/strict";
import test from "node:test";

import { createUpstreamRequest, proxyRequest, rewriteLocation } from "./src/index.mjs";

test("proxies the path and query while preserving the public host", () => {
  const upstream = createUpstreamRequest(new Request("https://app.trouvetaplume.com/login?next=%2Fstudent"));

  assert.equal(upstream.url, "https://sigmawrite.vercel.app/login?next=%2Fstudent");
  assert.equal(upstream.headers.get("x-forwarded-host"), "app.trouvetaplume.com");
  assert.equal(upstream.headers.get("x-forwarded-proto"), "https");
});

test("rewrites only redirects back to the application upstream", () => {
  assert.equal(
    rewriteLocation("https://sigmawrite.vercel.app/login?next=%2Fadmin", "https://app.trouvetaplume.com"),
    "https://app.trouvetaplume.com/login?next=%2Fadmin",
  );
  assert.equal(
    rewriteLocation("https://supabase.com/auth", "https://app.trouvetaplume.com"),
    "https://supabase.com/auth",
  );
});

test("returns the upstream response with a production-origin marker", async () => {
  const response = await proxyRequest(
    new Request("https://app.trouvetaplume.com/privacy"),
    async (request) => {
      assert.equal(request.url, "https://sigmawrite.vercel.app/privacy");
      return new Response("privacy", { status: 200 });
    },
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "privacy");
  assert.equal(response.headers.get("x-plume-origin"), "vercel-production");
});
