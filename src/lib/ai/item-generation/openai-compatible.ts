/**
 * Minimal OpenAI-compatible chat client (Roadmap Phase 9, D7).
 *
 * Works against any OpenAI-compatible /chat/completions endpoint. For GLM 5.2 via
 * Cloudflare Workers AI:
 *   LLM_BASE_URL = https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1
 *   LLM_MODEL    = @cf/zai-org/glm-5.2
 *   LLM_API_KEY  = <Cloudflare API token>
 * (Also works via the AI Gateway compat endpoint, or Zhipu/Z.ai direct — just
 * change LLM_BASE_URL / LLM_MODEL.) No secrets in code; everything via env.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatConfig = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Request a JSON object response when the endpoint supports it. */
  jsonMode?: boolean;
  /** Retries on 429 / 5xx with exponential backoff (default 5). */
  maxRetries?: number;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const DEFAULT_MODEL = "@cf/zai-org/glm-5.2";

export function resolveConfig(cfg: ChatConfig = {}): Required<Omit<ChatConfig, "temperature" | "jsonMode" | "maxRetries">> & Pick<ChatConfig, "temperature" | "jsonMode"> {
  const baseUrl = (cfg.baseUrl ?? process.env.LLM_BASE_URL ?? "").replace(/\/$/, "");
  const apiKey = cfg.apiKey ?? process.env.LLM_API_KEY ?? "";
  const model = cfg.model ?? process.env.LLM_MODEL ?? DEFAULT_MODEL;
  if (!baseUrl) throw new Error("LLM_BASE_URL is not set");
  if (!apiKey) throw new Error("LLM_API_KEY is not set");
  return {
    baseUrl,
    apiKey,
    model,
    fetchImpl: cfg.fetchImpl ?? fetch,
    timeoutMs: cfg.timeoutMs ?? 60_000,
    temperature: cfg.temperature,
    jsonMode: cfg.jsonMode,
  };
}

type ChatResponse = { choices?: { message?: { content?: string } }[] };

/** Returns the assistant message content (raw text). */
export async function chatComplete(
  messages: ChatMessage[],
  cfg: ChatConfig = {}
): Promise<string> {
  const c = resolveConfig(cfg);
  const maxRetries = cfg.maxRetries ?? 5;
  const body = JSON.stringify({
    model: c.model,
    messages,
    ...(c.temperature != null ? { temperature: c.temperature } : {}),
    ...(c.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), c.timeoutMs);
    try {
      const res = await c.fetchImpl(`${c.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${c.apiKey}`,
        },
        body,
        signal: controller.signal,
      });
      // Back off on rate-limit / transient server errors.
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const retryAfter = Number(res.headers?.get?.("retry-after")) || 0;
        const wait = retryAfter * 1000 || Math.min(16_000, 800 * 2 ** attempt);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        throw new Error(`LLM ${res.status} ${res.statusText} at ${c.baseUrl}`);
      }
      const json = (await res.json()) as ChatResponse;
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("LLM response had no content");
      return content;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Extract JSON from a model response — tolerant of ```json fences and prose
 * around the payload. Returns the first valid top-level array or object.
 */
export function extractJson(content: string): unknown {
  const stripped = content
    .replace(/^[\s\S]*?```(?:json)?\s*/i, (m) => (m.includes("```") ? "" : m))
    .replace(/```[\s\S]*$/i, "")
    .trim();
  const tryParse = (s: string): unknown => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };
  // Direct parse first.
  const direct = tryParse(stripped) ?? tryParse(content.trim());
  if (direct !== undefined) return direct;
  // Otherwise grab the first balanced array/object span.
  const start = content.search(/[[{]/);
  if (start >= 0) {
    const open = content[start];
    const close = open === "[" ? "]" : "}";
    const end = content.lastIndexOf(close);
    if (end > start) {
      const span = tryParse(content.slice(start, end + 1));
      if (span !== undefined) return span;
    }
  }
  throw new Error("Could not extract JSON from model response");
}
