/**
 * Item generator + judge interfaces (Roadmap Phase 9).
 *
 * Provider-agnostic, mirroring src/lib/ai/index.ts: the pipeline depends on these
 * interfaces, not on any model. MockItemGenerator/MockItemJudge let the whole
 * 6-gate pipeline run and be unit-tested with no API key. The real (Claude)
 * implementations wire in once ANTHROPIC_API_KEY is set — flip the factory, no
 * pipeline changes.
 */

import { conjugate, type Person, type Tense } from "@/lib/linguistic/conjugation";
import type { GeneratedItem, ItemGenSpec } from "./schemas";

export interface ItemGenerator {
  generateItems(spec: ItemGenSpec): Promise<GeneratedItem[]>;
}

/** Gate-3 second opinion: an independent model judges an item's validity. */
export interface ItemJudge {
  judge(item: GeneratedItem): Promise<{ valid: boolean; confidence: number; note?: string }>;
}

/**
 * Deterministic, key-free generator producing shape-valid items. Models a
 * *competent* generator (good content) so the happy path + yield can be tested;
 * tests craft deliberately-bad candidates to exercise the gates.
 */
export class MockItemGenerator implements ItemGenerator {
  async generateItems(spec: ItemGenSpec): Promise<GeneratedItem[]> {
    return Array.from({ length: spec.count }, (_, i) => this.one(spec, i));
  }

  private one(spec: ItemGenSpec, i: number): GeneratedItem {
    const hint = spec.hint ?? {};
    const isConj =
      spec.strand === "conjugaison" && hint.verb && hint.tense && hint.person;

    if (isConj) {
      const answer = conjugate(
        String(hint.verb),
        hint.tense as Tense,
        hint.person as Person,
        { gender: hint.gender as "m" | "f" | undefined }
      );
      return {
        nodeKey: spec.nodeKey,
        strand: spec.strand,
        modality: spec.modality,
        learnerMode: spec.learnerMode,
        responseType: "short_answer",
        promptFr: `Conjugue « ${hint.verb} » (${hint.tense}, ${hint.person}).`,
        correctAnswer: answer,
        acceptableAnswers: [],
        validatorType: "conjugator",
        validatorConfig: { ...hint },
        cefrLevel: spec.cefrLevel as GeneratedItem["cefrLevel"],
        difficulty: 50,
      };
    }

    // Default: a 3-choice MCQ with a misconception-tagged distractor.
    const mis = spec.misconceptionKeys?.[0];
    return {
      nodeKey: spec.nodeKey,
      strand: spec.strand,
      modality: spec.modality,
      learnerMode: spec.learnerMode,
      responseType: "mcq",
      promptFr: `[mock] Question ${i + 1} sur « ${spec.labelFr} » ?`,
      acceptableAnswers: [],
      validatorType: "exact",
      choices: [
        { text: "bonne réponse", correct: true, feedbackFr: "Correct." },
        { text: "distracteur A", correct: false, misconceptionKey: mis },
        { text: "distracteur B", correct: false },
      ],
      cefrLevel: spec.cefrLevel as GeneratedItem["cefrLevel"],
      difficulty: 50,
    };
  }
}

/** Always-agree judge (high confidence) for happy-path tests. */
export class MockItemJudge implements ItemJudge {
  constructor(private readonly opts: { valid?: boolean; confidence?: number } = {}) {}
  async judge() {
    return { valid: this.opts.valid ?? true, confidence: this.opts.confidence ?? 0.9 };
  }
}

let cachedGenerator: ItemGenerator | null = null;

export function getItemGenerator(): ItemGenerator {
  if (cachedGenerator) return cachedGenerator;
  const provider = process.env.AI_PROVIDER ?? "mock";
  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set");
    }
    // Real Claude generator wires here once the key is provided.
    throw new Error("Anthropic item generator not yet wired; set AI_PROVIDER=mock.");
  }
  cachedGenerator = new MockItemGenerator();
  return cachedGenerator;
}
