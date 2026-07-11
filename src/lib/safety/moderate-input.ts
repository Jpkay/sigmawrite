import type { AIProvider } from "@/lib/ai/provider";
import { getAIProvider } from "@/lib/ai";
import { moderationResultSchema } from "@/lib/ai/schemas";

export type StudentModeration = {
  allowed: boolean;
  categories: string[];
  source: "fallback" | "provider";
};

const RULES: Array<{ category: string; pattern: RegExp }> = [
  { category: "self_harm", pattern: /\b(suicid\w*|me tuer|en finir avec ma vie|kill myself|self[- ]harm)\b/i },
  { category: "sexual_content", pattern: /\b(contenu sexuel|photo nue|nude photo|pornograph\w*)\b/i },
  { category: "violent_threat", pattern: /\b(je vais (te|le|la) tuer|tuer quelqu['’]un|faire exploser|massacre\w*)\b/i },
  { category: "hate_threat", pattern: /\b(exterminer|éliminer) (tous|toutes) les\b/i },
  { category: "personal_contact", pattern: /\b\+?\d[\d .()-]{7,}\d\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { category: "prompt_injection", pattern: /\b(ignore|oublie) (toutes? )?(les )?(instructions|consignes)\b|\b(system prompt|developer message)\b/i },
];

export function fallbackModeration(text: string): StudentModeration {
  const normalized = text.normalize("NFKC").replace(/\s+/g, " ").trim();
  const categories = RULES.filter((rule) => rule.pattern.test(normalized)).map((rule) => rule.category);
  return { allowed: categories.length === 0, categories, source: "fallback" };
}

function providerConfigured(): boolean {
  const provider = process.env.AI_PROVIDER ?? "mock";
  if (provider === "mock") return false;
  return !!(process.env.OPENAI_API_KEY || process.env.LLM_API_KEY);
}

export async function moderateStudentText(
  text: string,
  dependencies: { provider?: AIProvider; forceProvider?: boolean } = {}
): Promise<StudentModeration> {
  const fallback = fallbackModeration(text);
  if (!fallback.allowed) return fallback;
  if (!dependencies.provider && !dependencies.forceProvider && !providerConfigured()) return fallback;
  try {
    const provider = dependencies.provider ?? getAIProvider();
    const result = moderationResultSchema.parse(await provider.moderate({
      content: text,
      context: "student_input",
    }));
    const categories = [...new Set(result.flaggedCategories)];
    return {
      allowed: result.passed && !result.needsHumanReview && categories.length === 0,
      categories,
      source: "provider",
    };
  } catch {
    return fallback;
  }
}
