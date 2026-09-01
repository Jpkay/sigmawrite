import { describe, expect, it } from "vitest";
import { MISCONCEPTIONS, NODES } from "@/lib/content/slices/past-narration";
import type { FrenchGrammarChecker, GrammarCheckResult } from "@/lib/linguistic/types";
import { MockItemGenerator, MockItemJudge } from "./generator";
import {
  runGates,
  runItemGenerationPipeline,
  yieldReport,
  type GateContext,
  type PipelineContext,
} from "./pipeline";
import type { GeneratedItem } from "./schemas";

const knownNodeKeys = new Set(NODES.map((n) => n.key));
const knownMisconceptionKeys = new Set(MISCONCEPTIONS.map((m) => m.key));

const baseCtx = (over: Partial<GateContext> = {}): GateContext => ({
  knownNodeKeys,
  knownMisconceptionKeys,
  judge: new MockItemJudge(),
  ...over,
});

const goodConjItem = (over: Partial<GeneratedItem> = {}): GeneratedItem => ({
  nodeKey: "present_indicatif",
  strand: "conjugaison",
  modality: "grammar_analysis",
  learnerMode: "shared",
  responseType: "short_answer",
  promptFr: "Conjugue « parler » (présent, tu).",
  correctAnswer: "parles",
  acceptableAnswers: [],
  validatorType: "conjugator",
  validatorConfig: { verb: "parler", tense: "present", person: "2s" },
  ...over,
});

/** Grammar stub: flags any text containing a bad pattern. */
const stubChecker = (bad: RegExp[]): FrenchGrammarChecker => ({
  async check(text): Promise<GrammarCheckResult> {
    const hit = bad.find((b) => b.test(text));
    return {
      text, language: "fr", clean: !hit,
      matches: hit ? [{ message: "x", offset: 0, length: 0, ruleId: "FR_X", category: "GRAMMAR", replacements: [] }] : [],
    };
  },
});

describe("Gate 1 — schema + invariants", () => {
  it("rejects a schema-invalid candidate", async () => {
    const r = await runGates({ nope: true }, baseCtx());
    expect(r.gates.gate1_schema).toBe(false);
    expect(r.gates.verdict).toBe("rejected");
    expect(r.item).toBeNull();
  });

  it("rejects an unknown node reference", async () => {
    const r = await runGates(goodConjItem({ nodeKey: "ghost_node" }), baseCtx());
    expect(r.gates.gate1_invariants.ok).toBe(false);
    expect(r.gates.verdict).toBe("rejected");
  });

  it("repairs (strips) an unknown misconception tag instead of rejecting", async () => {
    const item = goodConjItem({
      responseType: "mcq", validatorType: "exact", correctAnswer: undefined,
      validatorConfig: undefined,
      choices: [
        { text: "a", correct: true },
        { text: "b", correct: false, misconceptionKey: "not_a_real_misconception" },
      ],
    });
    const r = await runGates(item, baseCtx());
    expect(r.gates.verdict).toBe("auto_approved");
    // the invalid tag is stripped, the good item survives
    expect(r.item?.choices?.find((c) => c.text === "b")?.misconceptionKey).toBeUndefined();
  });

  it("rejects an MCQ without exactly one correct choice", async () => {
    const item = goodConjItem({
      responseType: "mcq", validatorType: "exact", correctAnswer: undefined, validatorConfig: undefined,
      choices: [
        { text: "a", correct: true },
        { text: "b", correct: true },
      ],
    });
    const r = await runGates(item, baseCtx());
    expect(r.gates.verdict).toBe("rejected");
    expect(r.gates.gate1_invariants.violations.join()).toMatch(/exactly 1 correct/);
  });
});

describe("Gate 0 — recompute computable content", () => {
  it("overrides a wrong LLM conjugation with the deterministic one", async () => {
    const r = await runGates(goodConjItem({ correctAnswer: "parlez (wrong)" }), baseCtx());
    expect(r.gates.gate0_computed.applied).toBe(true);
    expect(r.gates.gate0_computed.correctedAnswer).toBe("parles");
    expect(r.item?.correctAnswer).toBe("parles"); // authoritative
    expect(r.gates.verdict).toBe("auto_approved");
  });

  it("rejects an uncomputable conjugation", async () => {
    const r = await runGates(
      goodConjItem({ validatorConfig: { verb: "xyzzre", tense: "present", person: "1s" } }),
      baseCtx()
    );
    expect(r.gates.verdict).toBe("rejected");
    expect(r.gates.rejectionReason).toMatch(/uncomputable/);
  });
});

describe("Gate 2 — answer-key self-consistency", () => {
  it("passes a clean grammar/agreement answer", async () => {
    const item = goodConjItem({
      nodeKey: "accord_pp_etre", strand: "orthographe_grammaticale",
      validatorType: "agreement", correctAnswer: "Elle est allée au marché.", validatorConfig: undefined,
    });
    const r = await runGates(item, baseCtx({ grammarChecker: stubChecker([/est allé[ .]/]) }));
    expect(r.gates.gate2_answer_key.ok).toBe(true);
    expect(r.gates.verdict).toBe("auto_approved");
  });

  it("rejects a grammar/agreement answer that fails the checker", async () => {
    const item = goodConjItem({
      nodeKey: "accord_pp_etre", strand: "orthographe_grammaticale",
      validatorType: "agreement", correctAnswer: "Elle est allé au marché.", validatorConfig: undefined,
    });
    const r = await runGates(item, baseCtx({ grammarChecker: stubChecker([/est allé[ .]/]) }));
    expect(r.gates.gate2_answer_key.ok).toBe(false);
    expect(r.gates.verdict).toBe("rejected");
  });

  it("flags grammar items for review when no checker is available", async () => {
    const item = goodConjItem({
      nodeKey: "accord_pp_etre", strand: "orthographe_grammaticale",
      validatorType: "agreement", correctAnswer: "Elle est allée.", validatorConfig: undefined,
    });
    const r = await runGates(item, baseCtx()); // no grammarChecker
    expect(r.gates.verdict).toBe("needs_human_review");
  });

  it("rejects an MCQ whose 'correct' choice is actually wrong (conjugator-backed)", async () => {
    const item = goodConjItem({
      nodeKey: "passe_compose_etre", strand: "conjugaison", responseType: "mcq",
      validatorType: "exact", correctAnswer: undefined,
      validatorConfig: { verb: "aller", tense: "passe_compose", person: "3s", gender: "f" },
      choices: [
        { text: "est allé", correct: true }, // wrong: should be "est allée"
        { text: "est allée", correct: false },
      ],
    });
    const r = await runGates(item, baseCtx());
    expect(r.gates.verdict).toBe("rejected");
  });
});

describe("Gate 3/4 — ensemble + verdict", () => {
  it("routes low-confidence judgements to human review", async () => {
    const r = await runGates(goodConjItem(), baseCtx({ judge: new MockItemJudge({ confidence: 0.5 }) }));
    expect(r.gates.gate3_ensemble.agrees).toBe(false);
    expect(r.gates.verdict).toBe("needs_human_review");
  });

  it("routes a disagreeing judge to human review", async () => {
    const r = await runGates(goodConjItem(), baseCtx({ judge: new MockItemJudge({ valid: false, confidence: 0.95 }) }));
    expect(r.gates.verdict).toBe("needs_human_review");
  });

  it("routes sensitive strands to human review even when all gates pass", async () => {
    const r = await runGates(goodConjItem(), baseCtx({ sensitiveStrands: new Set(["conjugaison"]) }));
    expect(r.gates.verdict).toBe("needs_human_review");
  });
});

describe("full pipeline + yield report", () => {
  it("generates and auto-approves good conjugation items", async () => {
    const ctx: PipelineContext = { ...baseCtx(), generator: new MockItemGenerator() };
    const results = await runItemGenerationPipeline(
      {
        nodeKey: "present_indicatif", strand: "conjugaison", labelFr: "Le présent",
        modality: "grammar_analysis", learnerMode: "shared", count: 5,
        hint: { verb: "parler", tense: "present", person: "2s" },
      },
      ctx
    );
    const report = yieldReport(results);
    expect(report.total).toBe(5);
    expect(report.auto_approved).toBe(5);
    expect(report.gate0Applied).toBe(5); // conjugations recomputed
    expect(report.yieldRate).toBe(1);
  });

  it("rejects a model response that drifts away from the requested node or modality", async () => {
    const ctx: PipelineContext = {
      ...baseCtx(),
      generator: { generateItems: async () => [goodConjItem({ nodeKey: "accord_pp_etre", modality: "writing" })] },
    };
    const [result] = await runItemGenerationPipeline({
      nodeKey: "present_indicatif",
      strand: "conjugaison",
      labelFr: "Le présent",
      modality: "grammar_analysis",
      learnerMode: "shared",
      count: 1,
    }, ctx);
    expect(result.gates.verdict).toBe("rejected");
    expect(result.gates.rejectionReason).toMatch(/generation contract mismatch/);
  });

  it("rejects an MCQ pretending to provide controlled-production evidence", async () => {
    const item = goodConjItem({
      nodeKey: "accord_pp_etre",
      strand: "orthographe_grammaticale",
      modality: "writing",
      responseType: "mcq",
      validatorType: "exact",
      validatorConfig: undefined,
      correctAnswer: undefined,
      choices: [
        { text: "est allée", correct: true },
        { text: "est allé", correct: false },
      ],
    });
    const ctx: PipelineContext = {
      ...baseCtx(),
      generator: { generateItems: async () => [item] },
    };
    const [result] = await runItemGenerationPipeline({
      nodeKey: item.nodeKey,
      strand: item.strand,
      labelFr: "Accord du participe passé",
      modality: "writing",
      learnerMode: "shared",
      count: 1,
      hint: { expectation: "controlled_production", evidenceKey: "production" },
    }, ctx);
    expect(result.gates.verdict).toBe("rejected");
    expect(result.gates.rejectionReason).toContain("controlled production cannot use a multiple-choice response");
  });

  it("yieldReport tallies a mixed batch", () => {
    const mk = (verdict: "auto_approved" | "needs_human_review" | "rejected") => ({
      item: null, raw: {}, gates: {
        gate1_schema: true, gate1_invariants: { ok: true, violations: [] },
        gate0_computed: { applied: false }, gate2_answer_key: { ok: verdict !== "rejected" },
        gate3_ensemble: { agreement: 0.9, agrees: verdict === "auto_approved" }, verdict,
      },
    });
    const report = yieldReport([mk("auto_approved"), mk("needs_human_review"), mk("rejected")]);
    expect(report.usable).toBe(2);
    expect(report.rejected).toBe(1);
    expect(report.yieldRate).toBeCloseTo(2 / 3);
  });
});
