import { z } from "zod";

/**
 * Automatic word-definition pipeline (roadmap 2026-10, content for Phases B–D).
 * Bump the version whenever prompts, models or gates change meaningfully:
 * the import keys automatic content by it.
 */
export const LEXICON_DEFINITIONS_PIPELINE_VERSION = "lexicon-defs-v1.0";
export const LEXICON_DEFINITIONS_SENSE_KEY = "auto_core";
export const DEFINITION_MAX_WORDS = 20;
export const EXAMPLE_MAX_WORDS = 28;

/** One lemma of the licensed lexical release, as the pipeline sees it. */
export type ReleaseLemma = {
  id: string;
  lemma: string;
  normalizedLemma: string;
  partOfSpeech?: string;
  frequencyPerMillion: number;
  /** Normalised inflected forms (release forms plus full-lexicon forms when available). */
  forms: string[];
};

export const exampleSchema = z.object({
  text: z.string().min(5).max(400),
  interest: z.string().min(1).max(40).nullable().optional(),
  /** The exact inflected form of the word used in the sentence. */
  form: z.string().min(1).max(60),
});

export const validationSchema = z.object({
  keyIdeas: z.array(z.object({
    idea: z.string().min(2).max(160),
    keywords: z.array(z.string().min(1).max(60)).min(1).max(12),
    required: z.boolean().default(true),
  })).min(1).max(4),
  acceptedParaphrases: z.array(z.string().min(3).max(300)).min(1).max(5),
  misconceptions: z.array(z.string().min(3).max(300)).max(5).default([]),
});

/** What the generator model returns for one lemma (a skipped word needs no content). */
export const generatedDefinitionSchema = z.preprocess((value) => {
  if (value && typeof value === "object" && (value as { teachable?: unknown }).teachable === false) {
    return { ...(value as object), validation: null, examples: [] };
  }
  return value;
}, z.object({
  lemma: z.string().min(1),
  teachable: z.boolean(),
  skipReason: z.string().max(60).nullable().optional(),
  senseGloss: z.string().max(120).nullable().optional(),
  definition: z.string().max(400).nullable().optional(),
  examples: z.array(exampleSchema).default([]),
  validation: validationSchema.nullable().optional(),
  relatedTopics: z.array(z.string()).default([]).transform((keys) => keys.slice(0, 6)),
  family: z.array(z.string()).default([]).transform((words) => words.slice(0, 30)),
  synonyms: z.array(z.string()).default([]).transform((words) => words.slice(0, 8)),
  antonyms: z.array(z.string()).default([]).transform((words) => words.slice(0, 8)),
  semanticNeighbors: z.array(z.string()).default([]).transform((words) => words.slice(0, 10)),
}));
export type GeneratedDefinition = z.infer<typeof generatedDefinitionSchema>;

/** What the independent verifier returns for one lemma. */
export const verifierVerdictSchema = z.object({
  lemma: z.string().min(1),
  senseAccurate: z.boolean(),
  ageAppropriate: z.boolean(),
  nonCircular: z.boolean(),
  examplesCorrect: z.array(z.boolean()).default([]),
  validationSound: z.boolean(),
  badCloseWords: z.union([z.array(z.string()), z.string()]).default([]).transform((words) => (typeof words === "string" ? (words ? [words] : []) : words)),
  verdict: z.enum(["pass", "fail"]),
  issues: z.union([z.array(z.string()), z.string()]).default([])
    .transform((issues) => (typeof issues === "string" ? (issues ? [issues] : []) : issues).slice(0, 8).map((issue) => issue.slice(0, 300))),
});
export type VerifierVerdict = z.infer<typeof verifierVerdictSchema>;

export type GateStatus = "pass" | "fail";
export type GateResult = { gate: string; status: GateStatus; details?: string };

export type DefinitionValidationCriterion =
  | { kind: "key_idea"; idea: string; keywords: string[]; required: boolean }
  | { kind: "accepted_paraphrase"; text: string }
  | { kind: "misconception"; text: string };

export type CloseWords = { synonyms: string[]; antonyms: string[]; semantic: string[]; orthographic: string[] };

export type DefinitionEntryStatus = "accepted" | "discarded" | "skipped";

/** One entry of the committed artifact (generated/lexicon-definitions-v1*). */
export type LexiconDefinitionEntry = {
  lemmaId: string;
  lemma: string;
  /** Display spelling (Lexique "soeur" → "sœur"). */
  displayLemma: string;
  normalizedLemma: string;
  partOfSpeech: string | null;
  frequencyPerMillion: number;
  gradeLevel: number;
  status: DefinitionEntryStatus;
  skipReason?: string;
  senseKey: string;
  senseGloss?: string;
  definitionFr?: string;
  examplesFr?: Array<{ text: string; interest: string | null }>;
  definitionValidation?: DefinitionValidationCriterion[];
  relatedTopics?: string[];
  closeWords?: CloseWords;
  gateResults: {
    passed: boolean;
    attempts: number;
    gates: GateResult[];
    verifier?: { model: string; verdict: "pass" | "fail"; issues: string[] };
    history?: Array<{ attempt: number; failures: string[] }>;
    models?: { generator: string; verifier: string };
  };
  pipelineVersion: string;
};

export type LexiconDefinitionsManifest = {
  schemaVersion: 1;
  pipelineVersion: string;
  release: { key: string; version: string; contentChecksum: string };
  attribution: string;
  models: { generator: string[]; verifier: string[] };
  stats: Record<string, number>;
  usage: Record<string, { calls: number; promptTokens: number; completionTokens: number; costUsd: number }>;
  shards: Array<{ path: string; count: number; checksum: string }>;
  entriesChecksum: string;
};
