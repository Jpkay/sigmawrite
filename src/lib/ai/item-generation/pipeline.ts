/**
 * Competency-item generation pipeline — the 6 QC gates (Roadmap Phase 9).
 *
 *   Gate 0  don't trust the LLM for computable content — recompute conjugations
 *   Gate 1  schema + graph invariants (valid node/misconception refs, MCQ shape)
 *   Gate 2  answer-key self-consistency — the correct answer must verify true
 *           (and, where checkable, distractors false). Safety-critical hard gate.
 *   Gate 3  cross-model ensemble agreement (independent judge)
 *   Gate 4  verdict: route low-consensus / unverifiable / sensitive to review
 *   Gate 5  production psychometrics — not here; runs on live attempt data.
 *
 * Pure orchestration over injected deps, so the whole thing is unit-tested with
 * the mock generator/judge and no API key.
 */

import { conjugate, type Person, type Tense } from "@/lib/linguistic/conjugation";
import { validateAnswer } from "@/lib/linguistic/validator";
import type { FrenchGrammarChecker } from "@/lib/linguistic/types";
import {
  generatedItemSchema,
  type GateResults,
  type GeneratedItem,
  type ItemGenerationResult,
  type ItemGenSpec,
} from "./schemas";
import type { ItemGenerator, ItemJudge } from "./generator";

export type GateContext = {
  knownNodeKeys: Set<string>;
  knownMisconceptionKeys: Set<string>;
  judge: ItemJudge;
  grammarChecker?: FrenchGrammarChecker;
  ensembleThreshold?: number; // default 0.7
  sensitiveStrands?: Set<string>;
};

export type PipelineContext = GateContext & { generator: ItemGenerator };

function rejected(raw: unknown, gates: Partial<GateResults>, reason: string): ItemGenerationResult {
  return {
    item: null,
    raw,
    gates: {
      gate1_schema: true,
      gate1_invariants: { ok: true, violations: [] },
      gate0_computed: { applied: false },
      gate2_answer_key: { ok: true },
      gate3_ensemble: { agreement: 0, agrees: false },
      verdict: "rejected",
      rejectionReason: reason,
      ...gates,
    },
  };
}

/** Run one raw candidate through every gate. */
export async function runGates(
  raw: unknown,
  ctx: GateContext
): Promise<ItemGenerationResult> {
  // ── Gate 1: schema ──
  const parsed = generatedItemSchema.safeParse(raw);
  if (!parsed.success) {
    return rejected(raw, {
      gate1_schema: false,
      gate2_answer_key: { ok: false, reason: "schema" },
    }, "schema validation failed");
  }
  let item: GeneratedItem = parsed.data;

  // ── Gate 1: graph invariants ──
  // Node ref and MCQ shape are hard (structural integrity); an invented
  // misconception tag is repaired (stripped), not rejected — it's metadata, not
  // correctness, and a good item shouldn't die for a bad label.
  const violations: string[] = [];
  if (!ctx.knownNodeKeys.has(item.nodeKey)) violations.push(`unknown node ${item.nodeKey}`);
  if (item.choices?.some((c) => c.misconceptionKey && !ctx.knownMisconceptionKeys.has(c.misconceptionKey))) {
    item = {
      ...item,
      choices: item.choices.map((c) =>
        c.misconceptionKey && !ctx.knownMisconceptionKeys.has(c.misconceptionKey)
          ? { ...c, misconceptionKey: undefined }
          : c
      ),
    };
  }
  if (item.responseType === "mcq") {
    const choices = item.choices ?? [];
    const correct = choices.filter((c) => c.correct).length;
    if (choices.length < 2) violations.push("mcq needs >= 2 choices");
    if (correct !== 1) violations.push(`mcq must have exactly 1 correct choice (has ${correct})`);
  }
  if (violations.length) {
    return rejected(raw, {
      gate1_invariants: { ok: false, violations },
    }, `graph invariants: ${violations.join("; ")}`);
  }

  // ── Gate 0: recompute computable content (conjugation) ──
  let gate0: GateResults["gate0_computed"] = { applied: false };
  const cfg = item.validatorConfig ?? {};
  if (item.validatorType === "conjugator" && cfg.verb && cfg.tense && cfg.person) {
    try {
      const computed = conjugate(
        String(cfg.verb),
        cfg.tense as Tense,
        cfg.person as Person,
        {
          gender: cfg.gender as "m" | "f" | undefined,
          codBefore: cfg.codBefore as { gender?: "m" | "f"; number?: "s" | "p" } | undefined,
        }
      );
      gate0 = { applied: true, correctedAnswer: computed };
      item = { ...item, correctAnswer: computed }; // authoritative override
    } catch (e) {
      return rejected(raw, {
        gate0_computed: { applied: false },
      }, `uncomputable conjugation: ${(e as Error).message}`);
    }
  }

  // ── Gate 2: answer-key self-consistency ──
  const g2 = await checkAnswerKey(item, ctx);
  if (!g2.ok && g2.hard) {
    return rejected(raw, {
      gate0_computed: gate0,
      gate2_answer_key: { ok: false, reason: g2.reason },
    }, `answer key: ${g2.reason}`);
  }

  // ── Gate 3: cross-model ensemble ──
  const j = await ctx.judge.judge(item);
  const threshold = ctx.ensembleThreshold ?? 0.7;
  const agrees = j.valid && j.confidence >= threshold;

  // ── Gate 4: verdict ──
  const needsReview =
    !agrees || g2.softReview || (ctx.sensitiveStrands?.has(item.strand) ?? false);

  return {
    item,
    raw,
    gates: {
      gate1_schema: true,
      gate1_invariants: { ok: true, violations: [] },
      gate0_computed: gate0,
      gate2_answer_key: { ok: g2.ok, reason: g2.reason },
      gate3_ensemble: { agreement: j.confidence, agrees },
      verdict: needsReview ? "needs_human_review" : "auto_approved",
    },
  };
}

type AnswerKeyCheck = { ok: boolean; hard: boolean; softReview: boolean; reason?: string };

async function checkAnswerKey(
  item: GeneratedItem,
  ctx: GateContext
): Promise<AnswerKeyCheck> {
  const deps = { grammarChecker: ctx.grammarChecker };

  // Conjugator: the (now Gate-0-computed) answer must verify true.
  if (item.validatorType === "conjugator") {
    if (!item.correctAnswer) return { ok: false, hard: true, softReview: false, reason: "no correct answer" };
    const r = await validateAnswer(item.correctAnswer, {
      validatorType: "conjugator",
      config: item.validatorConfig,
    });
    return { ok: r.pass, hard: !r.pass, softReview: false, reason: r.reason };
  }

  // Grammar/agreement: the correct answer must be clean per the grammar service.
  if (item.validatorType === "grammalecte" || item.validatorType === "agreement") {
    if (!item.correctAnswer) return { ok: false, hard: true, softReview: false, reason: "no correct answer" };
    if (!ctx.grammarChecker) {
      return { ok: true, hard: false, softReview: true, reason: "grammar checker unavailable — needs review" };
    }
    const r = await validateAnswer(item.correctAnswer, { validatorType: item.validatorType }, deps);
    return { ok: r.pass, hard: !r.pass, softReview: false, reason: r.reason };
  }

  // MCQ: structure is verified in Gate 1. If a deterministic validator config is
  // attached, confirm the correct choice validates true; else defer correctness
  // to the ensemble/human (soft review only when the ensemble also doubts it).
  if (item.responseType === "mcq") {
    const correctChoice = (item.choices ?? []).find((c) => c.correct);
    if (item.validatorConfig?.verb && correctChoice) {
      const r = await validateAnswer(correctChoice.text, {
        validatorType: "conjugator",
        config: item.validatorConfig,
      });
      return { ok: r.pass, hard: !r.pass, softReview: false, reason: r.reason };
    }
    return { ok: true, hard: false, softReview: false };
  }

  // exact/regex short-answer family: require a correct answer to exist.
  if (!item.correctAnswer) {
    return { ok: false, hard: true, softReview: false, reason: "no correct answer" };
  }
  return { ok: true, hard: false, softReview: false };
}

/** Generate `spec.count` items and run each through the gates. */
export async function runItemGenerationPipeline(
  spec: ItemGenSpec,
  ctx: PipelineContext
): Promise<ItemGenerationResult[]> {
  const raws = await ctx.generator.generateItems(spec);
  const out: ItemGenerationResult[] = [];
  for (const raw of raws) out.push(await runGates(raw, ctx));
  return out;
}

/** QC yield metrics over a batch — the read on "does generation actually work". */
export function yieldReport(results: ItemGenerationResult[]) {
  const counts = { auto_approved: 0, needs_human_review: 0, rejected: 0 };
  let schemaFail = 0, invariantFail = 0, answerKeyFail = 0, ensembleFlag = 0, gate0Applied = 0;
  for (const r of results) {
    counts[r.gates.verdict]++;
    if (!r.gates.gate1_schema) schemaFail++;
    else if (!r.gates.gate1_invariants.ok) invariantFail++;
    if (!r.gates.gate2_answer_key.ok) answerKeyFail++;
    if (!r.gates.gate3_ensemble.agrees) ensembleFlag++;
    if (r.gates.gate0_computed.applied) gate0Applied++;
  }
  const total = results.length;
  const usable = counts.auto_approved + counts.needs_human_review;
  return {
    total,
    ...counts,
    usable,
    yieldRate: total ? usable / total : 0,
    autoApproveRate: total ? counts.auto_approved / total : 0,
    schemaFail,
    invariantFail,
    answerKeyFail,
    ensembleFlag,
    gate0Applied,
  };
}
