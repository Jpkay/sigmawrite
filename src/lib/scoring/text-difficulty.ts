import type { DifficultyBand } from "@/lib/types";
import { gradeToBand } from "./band";
import { analyzeConstructions } from "@/lib/linguistic/construction-features";

/**
 * Deterministic text difficulty engine (PRD §G). GenAI writes; this engine
 * judges. The scores are not "true" readability — they are a *consistent,
 * reproducible* ordering so the adaptive engine can take one-step-harder
 * decisions, recalibrated by student data later. Pure → unit-tested (§26).
 */

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// French academic connectors (PRD §K). Presence makes relations explicit.
const CONNECTORS = [
  "parce que", "puisque", "car", "donc", "ainsi", "par conséquent",
  "en raison de", "à cause de", "grâce à", "mais", "pourtant", "cependant",
  "néanmoins", "en revanche", "alors que", "malgré", "bien que", "de plus",
  "en effet", "par exemple", "c'est pourquoi", "tandis que", "afin de",
];

const SUBORDINATORS = [
  "que", "qui", "dont", "où", "lorsque", "quand", "bien que", "afin que",
  "pour que", "comme", "puisque", "tandis que",
];

const ABSTRACT_SUFFIXES = ["tion", "sion", "ité", "isme", "ence", "ance", "ment", "té"];

export type TextFeatures = {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  maxSentenceLength: number;
  paragraphCount: number;
  avgWordLength: number;
  longWordRatio: number;
  connectorCount: number;
  subordinateCount: number;
  abstractDensity: number;
  constructionCount: number;
  constructionVariety: number;
  constructionComplexity: number;
};

export type TextDifficulty = {
  features: TextFeatures;
  lexical: number;
  syntax: number;
  knowledge: number;
  inference: number;
  stamina: number;
  overall: number;
  band: DifficultyBand;
  estimatedGradeMin: number;
  estimatedGradeMax: number;
};

export type DifficultyMeta = {
  /** Number of knowledge concepts the text introduces. */
  conceptCount?: number;
  /** Number of new target-vocabulary words. */
  newVocabCount?: number;
  /** Number of inference-type questions attached. */
  inferenceQuestionCount?: number;
};

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    count += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return count;
}

export function extractFeatures(paragraphs: string[]): TextFeatures {
  const body = paragraphs.join("\n\n");
  const lower = body.toLowerCase();
  const words = body.match(/[\p{L}'-]+/gu) ?? [];
  const wordCount = words.length || 1;
  const sentences = body.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const sentenceCount = sentences.length || 1;
  const sentenceLengths = sentences.map(
    (s) => (s.match(/[\p{L}'-]+/gu) ?? []).length
  );

  const avgWordLength =
    words.reduce((sum, w) => sum + w.length, 0) / wordCount;
  const longWordRatio = words.filter((w) => w.length >= 9).length / wordCount;
  const connectorCount = CONNECTORS.reduce(
    (sum, c) => sum + countOccurrences(lower, c),
    0
  );
  const subordinateCount = SUBORDINATORS.reduce(
    (sum, s) => sum + countOccurrences(lower, ` ${s} `),
    0
  );
  const abstractCount = words.filter((w) => {
    const lw = w.toLowerCase();
    return ABSTRACT_SUFFIXES.some((suf) => lw.length > suf.length + 2 && lw.endsWith(suf));
  }).length;
  const constructions = analyzeConstructions(body);

  return {
    wordCount: words.length,
    sentenceCount,
    avgSentenceLength: Math.round((wordCount / sentenceCount) * 10) / 10,
    maxSentenceLength: Math.max(...sentenceLengths, 0),
    paragraphCount: paragraphs.length,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    longWordRatio: Math.round(longWordRatio * 1000) / 1000,
    connectorCount,
    subordinateCount,
    abstractDensity: Math.round((abstractCount / wordCount) * 1000) / 1000,
    constructionCount: constructions.totalCount,
    constructionVariety: constructions.distinctCount,
    constructionComplexity: constructions.complexityScore,
  };
}

export function scoreTextDifficulty(
  paragraphs: string[],
  meta: DifficultyMeta = {}
): TextDifficulty {
  const f = extractFeatures(paragraphs);
  const connectorDensity = f.connectorCount / f.sentenceCount;

  const lexical = clamp(
    (f.avgWordLength - 4) * 12 + f.longWordRatio * 120 + f.abstractDensity * 160
  );
  const syntax = clamp(
    (f.avgSentenceLength - 8) * 4 +
      (f.maxSentenceLength - 15) * 1.5 +
      (f.subordinateCount / f.sentenceCount) * 32 +
      f.constructionComplexity * 0.3
  );
  const stamina = clamp((f.wordCount - 200) / 8);
  const knowledge = clamp(
    (meta.conceptCount ?? 2) * 16 + (meta.newVocabCount ?? 4) * 4
  );
  const inference = clamp(
    35 +
      (f.avgSentenceLength - 10) * 2 -
      connectorDensity * 12 +
      (meta.inferenceQuestionCount ?? 0) * 4
  );

  const overall = Math.round(
    lexical * 0.25 + syntax * 0.25 + knowledge * 0.2 + inference * 0.15 + stamina * 0.15
  );

  // Map 0–100 onto grades 5–11 (PRD §G bands, not fake precision).
  const grade = 5 + (overall / 100) * 6;

  return {
    features: f,
    lexical: Math.round(lexical),
    syntax: Math.round(syntax),
    knowledge: Math.round(knowledge),
    inference: Math.round(inference),
    stamina: Math.round(stamina),
    overall,
    band: gradeToBand(grade),
    estimatedGradeMin: Math.round(grade * 10) / 10,
    estimatedGradeMax: Math.round((grade + 0.6) * 10) / 10,
  };
}
