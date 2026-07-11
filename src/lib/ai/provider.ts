import type {
  GenerateTextInput,
  GeneratedTextCandidate,
  GenerateQuestionInput,
  GeneratedQuestion,
  ScoreSummaryInput,
  SummaryScore,
  TagTextInput,
  TextTagResult,
  ModerationInput,
  ModerationResult,
  EmbeddingInput,
} from "./schemas";

/**
 * Provider-agnostic AI interface (PRD §17). The app depends on this, not
 * on OpenAI directly, so the real provider can be swapped for the mock in
 * dev/tests. AI is used to generate, explain, and assist — never as the
 * sole source of level decisions, final difficulty, or placement.
 */
export interface AIProvider {
  generateText(input: GenerateTextInput, context?: { systemPrompt?: string }): Promise<GeneratedTextCandidate>;
  generateQuestions(input: GenerateQuestionInput, context?: { systemPrompt?: string }): Promise<GeneratedQuestion[]>;
  scoreSummary(input: ScoreSummaryInput, context?: { systemPrompt?: string }): Promise<SummaryScore>;
  tagText(input: TagTextInput, context?: { systemPrompt?: string }): Promise<TextTagResult>;
  moderate(input: ModerationInput): Promise<ModerationResult>;
  embed(input: EmbeddingInput): Promise<number[]>;
}
