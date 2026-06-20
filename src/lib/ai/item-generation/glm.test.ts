import { describe, expect, it, vi } from "vitest";
import {
  chatComplete,
  extractJson,
  resolveConfig,
} from "./openai-compatible";
import { GlmItemGenerator, GlmItemJudge } from "./glm";

/** A fake fetch returning the given assistant content, capturing the request. */
function fakeFetch(content: string) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ choices: [{ message: { content } }] }),
    } as Response;
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const cfg = (fetchImpl: typeof fetch) => ({
  baseUrl: "https://api.cloudflare.com/client/v4/accounts/acct/ai/v1",
  apiKey: "tok",
  model: "@cf/zai-org/glm-5.2",
  fetchImpl,
});

describe("resolveConfig", () => {
  it("requires base URL and key", () => {
    expect(() => resolveConfig({ apiKey: "x" })).toThrow(/LLM_BASE_URL/);
    expect(() => resolveConfig({ baseUrl: "https://x" })).toThrow(/LLM_API_KEY/);
  });
  it("defaults the model to GLM 5.2", () => {
    const r = resolveConfig({ baseUrl: "https://x", apiKey: "y" });
    expect(r.model).toBe("@cf/zai-org/glm-5.2");
  });
});

describe("chatComplete", () => {
  it("POSTs to /chat/completions with bearer auth and model", async () => {
    const { impl, calls } = fakeFetch("hello");
    const out = await chatComplete([{ role: "user", content: "hi" }], cfg(impl));
    expect(out).toBe("hello");
    expect(calls[0].url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/acct/ai/v1/chat/completions"
    );
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok");
    const body = JSON.parse(calls[0].init.body as string);
    expect(body.model).toBe("@cf/zai-org/glm-5.2");
    expect(body.messages[0].content).toBe("hi");
  });

  it("throws on a non-OK response (no retries)", async () => {
    const impl = vi.fn(async () => ({ ok: false, status: 400, statusText: "Bad" })) as unknown as typeof fetch;
    await expect(
      chatComplete([{ role: "user", content: "x" }], { ...cfg(impl), maxRetries: 0 })
    ).rejects.toThrow(/400/);
  });

  it("retries on 429 then succeeds", async () => {
    let calls = 0;
    const impl = vi.fn(async () => {
      calls++;
      return calls < 2
        ? ({ ok: false, status: 429, statusText: "Too Many", headers: { get: () => "0" } } as unknown as Response)
        : ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "ok" } }] }) } as Response);
    }) as unknown as typeof fetch;
    const out = await chatComplete([{ role: "user", content: "x" }], { ...cfg(impl), maxRetries: 3 });
    expect(out).toBe("ok");
    expect(calls).toBe(2);
  });
});

describe("extractJson", () => {
  it("parses raw JSON", () => {
    expect(extractJson('[{"a":1}]')).toEqual([{ a: 1 }]);
  });
  it("parses fenced ```json blocks", () => {
    expect(extractJson('```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }]);
  });
  it("recovers JSON embedded in prose", () => {
    expect(extractJson('Voici les items : [{"a":1},{"b":2}] — voilà.')).toEqual([
      { a: 1 },
      { b: 2 },
    ]);
  });
  it("throws when there is no JSON", () => {
    expect(() => extractJson("pas de json ici")).toThrow();
  });
});

describe("GlmItemGenerator", () => {
  it("parses a JSON array of items from the model", async () => {
    const items = [
      { nodeKey: "present_indicatif", strand: "conjugaison", responseType: "short_answer" },
      { nodeKey: "present_indicatif", strand: "conjugaison", responseType: "mcq" },
    ];
    const { impl } = fakeFetch("```json\n" + JSON.stringify(items) + "\n```");
    const gen = new GlmItemGenerator(cfg(impl));
    const out = await gen.generateItems({
      nodeKey: "present_indicatif", strand: "conjugaison", labelFr: "Le présent",
      modality: "grammar_analysis", learnerMode: "shared", count: 2,
    });
    expect(out).toHaveLength(2);
    expect(out[0].nodeKey).toBe("present_indicatif");
  });

  it("unwraps an {items:[...]} envelope", async () => {
    const { impl } = fakeFetch(JSON.stringify({ items: [{ nodeKey: "x" }] }));
    const gen = new GlmItemGenerator(cfg(impl));
    const out = await gen.generateItems({
      nodeKey: "x", strand: "conjugaison", labelFr: "X",
      modality: "grammar_analysis", learnerMode: "shared", count: 1,
    });
    expect(out).toHaveLength(1);
  });
});

describe("GlmItemJudge", () => {
  it("parses a verdict", async () => {
    const { impl } = fakeFetch('{"valid": true, "confidence": 0.82, "note": "ok"}');
    const judge = new GlmItemJudge(cfg(impl));
    const v = await judge.judge({ nodeKey: "x" } as never);
    expect(v).toEqual({ valid: true, confidence: 0.82, note: "ok" });
  });

  it("defaults to invalid on a malformed verdict", async () => {
    const { impl } = fakeFetch('{"oops": 1}');
    const judge = new GlmItemJudge(cfg(impl));
    const v = await judge.judge({ nodeKey: "x" } as never);
    expect(v.valid).toBe(false);
    expect(v.confidence).toBe(0);
  });
});
