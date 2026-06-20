/**
 * Competency-item generation — contract (Roadmap Phase 9).
 *
 * The LLM proposes items against this Zod schema; the pipeline (pipeline.ts)
 * runs them through the 6 QC gates. Validation happens at the schema layer so a
 * malformed proposal is caught before any gate logic runs. This is the item
 * analogue of ai/schemas.ts (which covers reading texts).
 */

import { z } from "zod";

export const generatedChoiceSchema = z.object({
  text: z.string().min(1),
  correct: z.boolean(),
  misconceptionKey: z.string().optional(),
  feedbackFr: z.string().optional(),
});

export const generatedItemSchema = z.object({
  nodeKey: z.string().min(1),
  strand: z.string().min(1),
  modality: z.enum([
    "reading", "writing", "listening", "speaking", "grammar_analysis", "dictee",
  ]),
  learnerMode: z.enum([
    "native", "fsl", "heritage", "allophone", "immersion", "shared",
  ]),
  responseType: z.enum(["mcq", "short_answer", "cloze", "transform"]),
  promptFr: z.string().min(5),
  instructionsFr: z.string().optional(),
  correctAnswer: z.string().optional(),
  acceptableAnswers: z.array(z.string()).default([]),
  validatorType: z.enum([
    "exact", "regex", "conjugator", "agreement", "grammalecte", "rubric", "llm_assisted",
  ]),
  validatorConfig: z.record(z.string(), z.unknown()).optional(),
  choices: z.array(generatedChoiceSchema).optional(),
  cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  difficulty: z.number().min(0).max(100).optional(),
});

export type GeneratedItem = z.infer<typeof generatedItemSchema>;

/** What the caller asks the generator to produce. */
export type ItemGenSpec = {
  nodeKey: string;
  strand: string;
  labelFr: string;
  cefrLevel?: string;
  modality: GeneratedItem["modality"];
  learnerMode: GeneratedItem["learnerMode"];
  count: number;
  /** Misconception keys available for distractor tagging on this node. */
  misconceptionKeys?: string[];
  /** Optional generation hint, e.g. {verb, tense, person} for conjugation. */
  hint?: Record<string, unknown>;
};

export type GateVerdict = "auto_approved" | "needs_human_review" | "rejected";

export type GateResults = {
  gate1_schema: boolean;
  gate1_invariants: { ok: boolean; violations: string[] };
  gate0_computed: { applied: boolean; correctedAnswer?: string };
  gate2_answer_key: { ok: boolean; reason?: string };
  gate3_ensemble: { agreement: number; agrees: boolean };
  verdict: GateVerdict;
  rejectionReason?: string;
};

export type ItemGenerationResult = {
  item: GeneratedItem | null; // null when schema-rejected
  raw: unknown;
  gates: GateResults;
};
