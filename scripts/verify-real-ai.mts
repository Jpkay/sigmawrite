import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
process.env.AI_PROVIDER = process.env.REAL_AI_PROVIDER ?? "glm";

const { getAIProvider, getAIProviderInfo } = await import("../src/lib/ai/index.ts");

const provider = getAIProvider();
const candidate = await provider.generateText({
  language: "fr",
  studentGrade: 7,
  targetReadingBand: "Secondary 7A",
  topic: "Comment les volcans transforment les paysages",
  primaryInterest: "science",
  knowledgeDomains: ["earth_science"],
  targetConcepts: ["magma", "érosion"],
  textType: "expository",
  wordCountTarget: 220,
  maxAverageSentenceLength: 18,
  maxNewAcademicWords: 6,
  targetVocabulary: ["magma", "cratère", "érosion"],
  targetSkills: ["literal_comprehension", "inference", "cause_consequence"],
  avoid: ["catastrophisme"],
  tone: "curious_explainer",
});

const info = getAIProviderInfo();
console.log(JSON.stringify({
  ok: true,
  provider: info.provider,
  model: info.model,
  title: candidate.title,
  questionCount: candidate.questions.length,
  factualClaimCount: candidate.factualClaims.length,
}));
