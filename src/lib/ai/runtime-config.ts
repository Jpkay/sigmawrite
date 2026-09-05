export type AIProviderKind = "mock" | "openai" | "glm";

export type AIRuntimeConfig = {
  kind: AIProviderKind;
  baseUrl: string;
  apiKey: string;
  model: string;
  embeddingBaseUrl: string;
  embeddingApiKey: string;
  embeddingModel: string;
  /** Text-to-speech for dictée audio; null when no key is configured so callers fail closed. */
  speech?: { baseUrl: string; apiKey: string; model: string; voice: string } | null;
};

function resolveSpeech(env: Record<string, string | undefined>, fallbackBase: string, fallbackKey: string) {
  const apiKey = env.TTS_API_KEY ?? fallbackKey;
  const baseUrl = (env.TTS_BASE_URL ?? fallbackBase).replace(/\/$/, "");
  if (!apiKey || !baseUrl) return null;
  return { baseUrl, apiKey, model: env.TTS_MODEL ?? "gpt-4o-mini-tts", voice: env.TTS_VOICE ?? "alloy" };
}

export function resolveAIRuntimeConfig(env: Record<string, string | undefined> = process.env): AIRuntimeConfig {
  const kind = (env.AI_PROVIDER ?? "mock") as AIProviderKind;
  if (!(["mock", "openai", "glm"] as string[]).includes(kind)) {
    throw new Error(`Unsupported AI_PROVIDER: ${kind}`);
  }
  if (kind === "mock") return {
    kind,
    baseUrl: "",
    apiKey: "",
    model: "mock-v1",
    embeddingBaseUrl: "",
    embeddingApiKey: "",
    embeddingModel: "mock-embedding-v1",
    speech: resolveSpeech(env, env.TTS_BASE_URL ?? "", ""),
  };
  if (kind === "openai") {
    const apiKey = env.OPENAI_API_KEY ?? "";
    if (!apiKey) throw new Error("AI_PROVIDER=openai but OPENAI_API_KEY is not set");
    return {
      kind,
      baseUrl: (env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
      apiKey,
      model: env.OPENAI_MODEL ?? "gpt-5.4-mini",
      embeddingBaseUrl: (env.EMBEDDING_BASE_URL ?? env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
      embeddingApiKey: env.EMBEDDING_API_KEY ?? apiKey,
      embeddingModel: env.EMBEDDING_MODEL ?? "text-embedding-3-small",
      speech: resolveSpeech(env, env.OPENAI_BASE_URL ?? "https://api.openai.com/v1", apiKey),
    };
  }
  const openRouterKey = env.OPENROUTER_API_KEY ?? "";
  const cloudflareBase = env.CLOUDFLARE_ACCOUNT_ID
    ? `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`
    : "";
  const configuredBase = env.LLM_BASE_URL?.includes("<") ? "" : env.LLM_BASE_URL;
  const baseUrl = (openRouterKey ? "https://openrouter.ai/api/v1" : configuredBase || cloudflareBase).replace(/\/$/, "");
  const apiKey = openRouterKey || env.LLM_API_KEY || "";
  if (!baseUrl || !apiKey) throw new Error("AI_PROVIDER=glm requires an OpenRouter key or LLM_BASE_URL + LLM_API_KEY");
  return {
    kind,
    baseUrl,
    apiKey,
    model: openRouterKey ? env.OPENROUTER_MODEL ?? "z-ai/glm-5.2" : env.LLM_MODEL ?? "@cf/zai-org/glm-5.2",
    embeddingBaseUrl: (env.EMBEDDING_BASE_URL ?? (openRouterKey ? "https://openrouter.ai/api/v1" : "")).replace(/\/$/, ""),
    embeddingApiKey: env.EMBEDDING_API_KEY ?? openRouterKey,
    embeddingModel: env.EMBEDDING_MODEL ?? (openRouterKey ? "openai/text-embedding-3-small" : "text-embedding-3-small"),
    speech: resolveSpeech(env, env.TTS_BASE_URL ?? "", ""),
  };
}
