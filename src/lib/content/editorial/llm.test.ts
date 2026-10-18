import { describe, expect, it } from "vitest";
import { OpenAICompatibleEditorialLLM, reasoningParameter, resolveRoleModels, resolveRoleReasoning } from "./llm";

const env = { AI_PROVIDER: "glm", OPENROUTER_API_KEY: "test-key" };

describe("editorial LLM settings", () => {
  it("maps reasoning per tier, with practice sentences off by default", () => {
    const reasoning = resolveRoleReasoning({ EDITORIAL_REASONING_WRITER: "low", EDITORIAL_REASONING_REVIEWER: "bogus" });
    expect(reasoning.author).toBe("low");
    expect(reasoning.line_editor).toBe("low");
    expect(reasoning.reviewer_style).toBe("default");
    expect(reasoning.practice_writer).toBe("off");
    expect(reasoningParameter("default")).toEqual({});
    expect(reasoningParameter("off")).toEqual({ reasoning: { enabled: false } });
    expect(reasoningParameter("low")).toEqual({ reasoning: { effort: "low" } });
    expect(resolveRoleModels(env).practice_writer).toBe("anthropic/claude-haiku-5.5");
  });

  it("sends the reasoning setting to OpenRouter and records thinking and cached tokens", async () => {
    let body: Record<string, unknown> = {};
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ choices: [{ message: { content: "{\"ok\":true}" } }], usage: { prompt_tokens: 10, completion_tokens: 50, cost: 0.001, completion_tokens_details: { reasoning_tokens: 30 }, prompt_tokens_details: { cached_tokens: 4 } } }), { status: 200 });
    }) as unknown as typeof fetch;
    const llm = new OpenAICompatibleEditorialLLM({ ...env, EDITORIAL_REASONING_REVIEWER: "low" }, fetchImpl);
    const result = await llm.complete({ role: "reviewer_proof", system: "s", user: "u", json: true });
    expect(body.reasoning).toEqual({ effort: "low" });
    expect(result.usage).toMatchObject({ costUsd: 0.001, reasoningTokens: 30, cachedTokens: 4 });
    await llm.complete({ role: "author", system: "s", user: "u" });
    expect(body.reasoning).toBeUndefined();
  });
});
