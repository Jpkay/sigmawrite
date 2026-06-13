import type {
  QuestionType,
  DifficultyBand,
  TextType,
} from "@/lib/types";

/** A multiple-choice item attached to a seed text. */
export type SeedQuestion = {
  id: string;
  type: QuestionType;
  skillKey: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanationFr: string;
};

export type SeedVocab = {
  word: string;
  definitionFr: string;
};

/** A manually-authored, human-reviewed reading text (PRD §F, Phase 1 seed). */
export type SeedText = {
  id: string;
  title: string;
  primaryInterest: string;
  primaryDomain: string;
  concepts: string[];
  textType: TextType;
  difficultyBand: DifficultyBand;
  wordCount: number;
  /** Paragraphs of the body, in order. */
  body: string[];
  targetVocabulary: SeedVocab[];
  questions: SeedQuestion[];
  /** Prompt for the written summary step. */
  summaryPrompt: string;
  /** A single retrieval question seeded for spaced review (PRD §L). */
  retrievalPrompt: string;
};
