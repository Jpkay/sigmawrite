import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAIEmbeddingInfo, getAIProvider } from "@/lib/ai";
import type { PassageEmbedder } from "./passage-publisher";
import { resolveAIRuntimeConfig } from "@/lib/ai/runtime-config";
import { LanguageToolChecker } from "@/lib/linguistic/languagetool";
import type { GateDeps } from "./gates";
import { liveFlagEnabled, resolveLiveGeneration } from "./kill-switch";
import { OpenAICompatibleEditorialLLM, type EditorialLLM } from "./llm";
import { loadClassSwitches, loadEditorialSettings } from "./store";
import type { StoryDeps } from "./story-service";

/** Wires the editorial pipeline to the configured providers. Missing keys fail closed to library/fallback content. */

export function editorialProviderConfigured(env: Record<string, string | undefined> = process.env): boolean {
  try { return resolveAIRuntimeConfig(env).kind !== "mock"; } catch { return false; }
}

export function editorialLLM(): EditorialLLM | null {
  if (!editorialProviderConfigured()) return null;
  try { return new OpenAICompatibleEditorialLLM(); } catch { return null; }
}

export function editorialGateDeps(): Omit<GateDeps, "forbiddenNames" | "allowedNames"> {
  const grammar = process.env.LANGUAGETOOL_URL ? new LanguageToolChecker() : null;
  return {
    grammar,
    moderate: editorialProviderConfigured()
      ? async (text) => {
        const result = await getAIProvider().moderate({ content: text, context: "generated_content" });
        return { allowed: result.passed && !result.needsHumanReview && result.flaggedCategories.length === 0, categories: result.flaggedCategories };
      }
      : undefined,
  };
}

/** Embeddings for published passages (semantic duplicate checks); null without a provider. */
export function editorialEmbedder(): PassageEmbedder | null {
  if (!editorialProviderConfigured()) return null;
  try { return { embed: (text) => getAIProvider().embed({ text }), model: getAIEmbeddingInfo().model }; } catch { return null; }
}

export function storyDeps(db: SupabaseClient): StoryDeps {
  const llm = editorialLLM();
  return {
    db,
    llm,
    gates: editorialGateDeps(),
    liveDecision: async (studentId) => resolveLiveGeneration({
      settings: await loadEditorialSettings(db),
      classSwitches: await loadClassSwitches(db, studentId),
      providerConfigured: Boolean(llm),
      flagEnabled: liveFlagEnabled(),
    }),
  };
}
