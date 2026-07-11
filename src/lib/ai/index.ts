import type { AIProvider } from "./provider";
import { MockAIProvider } from "./mock";
import { OpenAICompatibleAIProvider } from "./openai-compatible-provider";
import { resolveAIRuntimeConfig } from "./runtime-config";

let cached: AIProvider | null = null;

/**
 * Returns the configured AI provider. Defaults to the mock unless
 * AI_PROVIDER=openai and an OPENAI_API_KEY is present. The OpenAI
 * implementation is wired in a later phase; until then we fail loud
 * rather than silently degrade.
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const config = resolveAIRuntimeConfig();
  cached = config.kind === "mock" ? new MockAIProvider() : new OpenAICompatibleAIProvider(config);
  return cached;
}

export function getAIProviderInfo() {
  const config = resolveAIRuntimeConfig();
  return { provider: config.kind, model: config.model };
}

export function getAIEmbeddingInfo() {
  const config = resolveAIRuntimeConfig();
  return { provider: config.kind, model: config.embeddingModel };
}

export type { AIProvider } from "./provider";
