import type { AIProvider } from "./provider";
import { MockAIProvider } from "./mock";

let cached: AIProvider | null = null;

/**
 * Returns the configured AI provider. Defaults to the mock unless
 * AI_PROVIDER=openai and an OPENAI_API_KEY is present. The OpenAI
 * implementation is wired in a later phase; until then we fail loud
 * rather than silently degrade.
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const provider = process.env.AI_PROVIDER ?? "mock";
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("AI_PROVIDER=openai but OPENAI_API_KEY is not set");
    }
    throw new Error(
      "OpenAI provider not implemented yet (Phase 2). Set AI_PROVIDER=mock for now."
    );
  }

  cached = new MockAIProvider();
  return cached;
}

export type { AIProvider } from "./provider";
