import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

const baseUrl = process.env.LANGUAGETOOL_URL?.replace(/\/$/, "");
const apiKey = process.env.LANGUAGETOOL_API_KEY;
assert(baseUrl && apiKey, "LANGUAGETOOL_URL and LANGUAGETOOL_API_KEY are required.");
const headers = { "Content-Type": "application/x-www-form-urlencoded" };
const body = (text) => new URLSearchParams({ language: "fr", text, level: "picky" });
const request = (path, options = {}) => fetch(`${baseUrl}${path}`, {
  redirect: "error", signal: AbortSignal.timeout(10_000), ...options,
});

for (let attempt = 0; ; attempt++) {
  try {
    const response = await request("/healthz");
    await response.arrayBuffer();
    assert.equal(response.status, 200);
    break;
  } catch (error) {
    if (attempt === 14) throw error;
    await delay(2000);
  }
}

for (const credential of [undefined, "invalid-key"]) {
  const response = await request("/v2/check", {
    method: "POST", body: body("Les enfants jouent dans la cour."),
    headers: { ...headers, ...(credential ? { Authorization: `Bearer ${credential}` } : {}) },
  });
  await response.arrayBuffer();
  assert.equal(response.status, 401);
}
console.log("Missing and invalid credentials rejected: PASS");

const authenticatedHeaders = { ...headers, Authorization: `Bearer ${apiKey}` };
for (const [path, status] of [["/v2/check", 405], ["/v2/languages", 404]]) {
  const response = await request(path, { headers: authenticatedHeaders });
  await response.arrayBuffer();
  assert.equal(response.status, status);
}

for (const [text, expectedError] of [
  ["Les enfants jouent dans la cour.", false],
  ["Les enfants joue dans la cour.", true],
]) {
  const started = performance.now();
  const response = await request("/v2/check", { method: "POST", body: body(text), headers: authenticatedHeaders });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.matches.length > 0, expectedError);
  if (expectedError) assert(result.matches.some((match) => match.replacements.some(({ value }) => value === "jouent")));
  console.log(JSON.stringify({ text, errors: result.matches.length, elapsedMs: Math.round(performance.now() - started) }));
}
console.log("French submission checks: PASS");
