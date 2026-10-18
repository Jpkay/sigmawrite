import { z, type ZodType } from "zod";
import { extractJson } from "@/lib/ai/item-generation/openai-compatible";
import { resolveAIRuntimeConfig } from "@/lib/ai/runtime-config";
import type { EditorialRole, Usage } from "./types";

/**
 * Model access for the editorial team (roadmap H.10). Reuses the provider
 * configuration of src/lib/ai (AI_PROVIDER, OpenRouter key or OpenAI-compatible
 * base URL) and adds a role → model map:
 *
 *   EDITORIAL_MODEL_AUTHOR       strongest writing model (author, rewrites)
 *   EDITORIAL_MODEL_LINE_EDITOR  strongest writing model (line edit)
 *   EDITORIAL_MODEL_ARCHITECT    saga outlines
 *   EDITORIAL_MODEL_REVIEWER     fast reviewers (style, targets, proofreading, safety, dictée, pairwise)
 *   EDITORIAL_MODEL_CHIEF        editor-in-chief
 *   EDITORIAL_MODEL_AUDITOR      stronger reviewer for the daily audit (H.15)
 *   EDITORIAL_MODEL_SUMMARIZER   running story summary
 */

export const DEFAULT_OPENROUTER_MODELS: Record<"writer" | "reviewer" | "chief" | "auditor", string> = {
  writer: "anthropic/claude-opus-5.5",
  reviewer: "google/gemini-3.8-flash",
  chief: "anthropic/claude-sonnet-5.5",
  auditor: "anthropic/claude-opus-5.5",
};

const ROLE_ENV: Record<EditorialRole, { env: string; tier: keyof typeof DEFAULT_OPENROUTER_MODELS }> = {
  author: { env: "EDITORIAL_MODEL_AUTHOR", tier: "writer" },
  line_editor: { env: "EDITORIAL_MODEL_LINE_EDITOR", tier: "writer" },
  architect: { env: "EDITORIAL_MODEL_ARCHITECT", tier: "writer" },
  reviewer_style: { env: "EDITORIAL_MODEL_REVIEWER", tier: "reviewer" },
  reviewer_targets: { env: "EDITORIAL_MODEL_REVIEWER", tier: "reviewer" },
  reviewer_proof: { env: "EDITORIAL_MODEL_REVIEWER", tier: "reviewer" },
  reviewer_safety: { env: "EDITORIAL_MODEL_REVIEWER", tier: "reviewer" },
  reviewer_dictation: { env: "EDITORIAL_MODEL_REVIEWER", tier: "reviewer" },
  judge_pairwise: { env: "EDITORIAL_MODEL_REVIEWER", tier: "reviewer" },
  editor_in_chief: { env: "EDITORIAL_MODEL_CHIEF", tier: "chief" },
  summarizer: { env: "EDITORIAL_MODEL_SUMMARIZER", tier: "reviewer" },
  auditor: { env: "EDITORIAL_MODEL_AUDITOR", tier: "auditor" },
};

/** USD per million tokens, used only when the provider does not report the cost itself. */
const FALLBACK_PRICING: Record<string, [number, number]> = {
  "anthropic/claude-opus-5.5": [4, 20],
  "anthropic/claude-fable-5.1": [10, 50],
  "anthropic/claude-sonnet-5.5": [2, 10],
  "anthropic/claude-haiku-5.5": [0.1, 0.5],
  "google/gemini-3.8-flash": [0.83, 4.12],
  "openai/gpt-5.4": [2.5, 15],
  "openai/gpt-5.4-mini": [0.75, 4.5],
};

export type LlmCall = { role: EditorialRole; system: string; user: string; json?: boolean; temperature?: number; maxTokens?: number };
export type LlmResult = { text: string; model: string; usage: Usage; latencyMs: number };
export interface EditorialLLM {
  modelFor(role: EditorialRole): string;
  complete(call: LlmCall): Promise<LlmResult>;
}

export class CostCapExceeded extends Error {
  constructor(public readonly spent: number, public readonly cap: number) { super(`cost_cap_exceeded:${spent.toFixed(4)}>${cap}`); }
}

/** Tracks spend for one chapter / library text and refuses calls past the cap. */
export class CostMeter {
  spent = 0;
  inputTokens = 0;
  outputTokens = 0;
  constructor(public readonly cap: number) {}
  assertRoom() { if (this.spent >= this.cap) throw new CostCapExceeded(this.spent, this.cap); }
  record(usage: Usage) { this.spent += usage.costUsd; this.inputTokens += usage.inputTokens; this.outputTokens += usage.outputTokens; }
}

export function resolveRoleModels(env: Record<string, string | undefined> = process.env): Record<EditorialRole, string> {
  let base = "mock-v1";
  let openRouter = false;
  try {
    const config = resolveAIRuntimeConfig(env);
    base = config.model;
    openRouter = config.baseUrl.includes("openrouter.ai");
  } catch { /* unconfigured: mock */ }
  const out = {} as Record<EditorialRole, string>;
  for (const [role, { env: key, tier }] of Object.entries(ROLE_ENV) as Array<[EditorialRole, (typeof ROLE_ENV)[EditorialRole]]>) {
    out[role] = env[key] || (openRouter ? DEFAULT_OPENROUTER_MODELS[tier] : base);
  }
  return out;
}

type ChatResponse = { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number } };

export class OpenAICompatibleEditorialLLM implements EditorialLLM {
  private readonly models: Record<EditorialRole, string>;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  constructor(env: Record<string, string | undefined> = process.env, private readonly fetchImpl: typeof fetch = fetch) {
    const config = resolveAIRuntimeConfig(env);
    if (config.kind === "mock") throw new Error("editorial_llm_unconfigured");
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.models = resolveRoleModels(env);
  }
  modelFor(role: EditorialRole) { return this.models[role]; }

  async complete(call: LlmCall): Promise<LlmResult> {
    const model = this.models[call.role];
    const started = Date.now();
    const body = JSON.stringify({
      model,
      messages: [{ role: "system", content: call.system }, { role: "user", content: call.user }],
      temperature: call.temperature ?? 0.7,
      max_tokens: call.maxTokens ?? 2400,
      ...(call.json ? { response_format: { type: "json_object" } } : {}),
      ...(this.baseUrl.includes("openrouter.ai") ? { usage: { include: true } } : {}),
    });
    const timeoutMs = call.role === "author" || call.role === "line_editor" || call.role === "architect" ? 90_000 : 45_000;
    for (let attempt = 0; ; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` }, body, signal: controller.signal });
        if ((response.status === 429 || response.status >= 500) && attempt < 2) { await new Promise((r) => setTimeout(r, 800 * 2 ** attempt)); continue; }
        if (!response.ok) throw new Error(`editorial_llm_http_${response.status}`);
        const json = (await response.json()) as ChatResponse;
        const text = json.choices?.[0]?.message?.content;
        if (typeof text !== "string" || !text.trim()) throw new Error("editorial_llm_empty");
        const inputTokens = json.usage?.prompt_tokens ?? Math.ceil((call.system.length + call.user.length) / 4);
        const outputTokens = json.usage?.completion_tokens ?? Math.ceil(text.length / 4);
        const price = FALLBACK_PRICING[model] ?? [5, 25];
        const costUsd = typeof json.usage?.cost === "number" ? json.usage.cost : (inputTokens * price[0] + outputTokens * price[1]) / 1_000_000;
        return { text, model, usage: { inputTokens, outputTokens, costUsd }, latencyMs: Date.now() - started };
      } finally {
        clearTimeout(timer);
      }
    }
  }
}

/** Structured call with one repair attempt; the meter refuses calls past the cost cap. */
export async function completeJson<T>(llm: EditorialLLM, call: LlmCall, schema: ZodType<T>, meter?: CostMeter): Promise<{ value: T; result: LlmResult }> {
  let correction = "";
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    meter?.assertRoom();
    const result = await llm.complete({ ...call, json: true, user: `${call.user}${correction}` });
    meter?.record(result.usage);
    try {
      return { value: schema.parse(extractJson(result.text)), result };
    } catch (error) {
      last = error;
      const issue = error instanceof z.ZodError ? error.issues.slice(0, 4).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : "JSON illisible";
      correction = `\n\nTa réponse précédente était invalide (${issue}). Renvoie uniquement l'objet JSON complet et corrigé.`;
    }
  }
  throw last instanceof Error ? last : new Error("editorial_json_invalid");
}

export async function completeText(llm: EditorialLLM, call: LlmCall, meter?: CostMeter): Promise<LlmResult> {
  meter?.assertRoom();
  const result = await llm.complete(call);
  meter?.record(result.usage);
  return result;
}
