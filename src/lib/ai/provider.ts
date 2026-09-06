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
  /** Render French speech for dictée segments. Must throw when no speech backend is configured. */
  synthesizeSpeech(input: SpeechInput): Promise<SpeechResult>;
  /**
   * Render a dictée plan: text chunks, phoneme-spelled words and exact silences.
   * Backends without phoneme or silence control fall back to the plan's text form.
   */
  synthesizeSpeechPlan(parts: SpeechPart[], input?: Omit<SpeechInput, "text">): Promise<SpeechResult>;
}

export type SpeechPart =
  | { kind: "text"; text: string }
  | { kind: "phonemes"; phonemes: string; text: string }
  | { kind: "silence"; seconds: number };

export type SpeechInput = { text: string; voice?: string; speed?: number };

/** Text-only rendering of a speech plan for backends without phoneme or silence control. */
export function planToText(parts: SpeechPart[]): string {
  return parts.map((part) => (part.kind === "silence" ? (part.seconds >= 0.4 ? "…" : ",") : part.text)).join(" ").replace(/\s+([,…])/gu, "$1").replace(/,\s*,/gu, ",").replace(/\s{2,}/gu, " ").trim();
}
export type SpeechResult = { audio: Uint8Array; mimeType: string; provider: string; model: string; voice: string };
