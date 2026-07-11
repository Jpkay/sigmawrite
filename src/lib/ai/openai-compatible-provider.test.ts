import { describe, expect, it, vi } from "vitest";
import { OpenAICompatibleAIProvider } from "./openai-compatible-provider";
import { resolveAIRuntimeConfig } from "./runtime-config";

const input = {
  language: "fr" as const, studentGrade: 7, targetReadingBand: "Secondary 7A",
  topic: "Les volcans", primaryInterest: "science", knowledgeDomains: ["science"],
  targetConcepts: ["magma"], textType: "expository" as const, wordCountTarget: 300,
  maxAverageSentenceLength: 18, maxNewAcademicWords: 8, targetVocabulary: ["magma"],
  targetSkills: ["inference"], avoid: [], tone: "curious_explainer" as const,
};

const validCandidate = {
  title: "Les volcans", body: "Le magma remonte et forme parfois un volcan.",
  estimatedReadingBand: "Secondary 7A",
  targetVocabulary: [{ word: "magma", definitionFr: "Roche fondue.", exampleSentenceFr: "Le magma remonte." }],
  knowledgeConcepts: ["magma"], skillsPracticed: ["inference"],
  questions: [{ questionText: "Que remonte-t-il ?", questionType: "literal", answerFormat: "multiple_choice", choices: ["Le magma", "La pluie"], correctAnswer: "Le magma", skillIds: ["inference"], difficulty: 30 }],
  safetyNotes: [], factualClaims: [],
};

function chatResponse(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("OpenAICompatibleAIProvider", () => {
  it("retries one invalid structured output and validates the correction", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(chatResponse('{"title":"incomplet"}'))
      .mockResolvedValueOnce(chatResponse(JSON.stringify(validCandidate)));
    const provider = new OpenAICompatibleAIProvider({
      kind: "glm", baseUrl: "https://example.test/v1", apiKey: "test", model: "test-model",
      embeddingBaseUrl: "", embeddingApiKey: "", embeddingModel: "test-embedding",
    }, fetchImpl as typeof fetch);
    await expect(provider.generateText(input)).resolves.toMatchObject({ title: "Les volcans" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("uses the official moderation and embeddings endpoints for OpenAI", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [{ flagged: true, categories: { hate: true, violence: false } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ embedding: [0.1, 0.2] }] }), { status: 200 }));
    const provider = new OpenAICompatibleAIProvider({
      kind: "openai", baseUrl: "https://api.openai.com/v1", apiKey: "test", model: "gpt-test",
      embeddingBaseUrl: "https://api.openai.com/v1", embeddingApiKey: "test", embeddingModel: "text-embedding-3-small",
    }, fetchImpl as typeof fetch);
    await expect(provider.moderate({ content: "test", context: "student_input" })).resolves.toMatchObject({ passed: false, flaggedCategories: ["hate"] });
    await expect(provider.embed({ text: "test" })).resolves.toEqual([0.1, 0.2]);
    expect(String(fetchImpl.mock.calls[0][0])).toContain("/moderations");
    expect(String(fetchImpl.mock.calls[1][0])).toContain("/embeddings");
  });
});

describe("resolveAIRuntimeConfig", () => {
  it("fails loudly when a selected provider has no credentials", () => {
    expect(() => resolveAIRuntimeConfig({ AI_PROVIDER: "openai" })).toThrow("OPENAI_API_KEY");
  });
  it("prefers OpenRouter for GLM when configured", () => {
    expect(resolveAIRuntimeConfig({ AI_PROVIDER: "glm", OPENROUTER_API_KEY: "test" })).toMatchObject({
      baseUrl: "https://openrouter.ai/api/v1", model: "z-ai/glm-5.2",
    });
  });
});
