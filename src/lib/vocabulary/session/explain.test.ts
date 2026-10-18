import { describe, expect, it, vi } from "vitest";
import { gradeExplanation, parseValidation, ruleGrade, type Judge } from "./explain";
import { GOLDEN_CASES, GOLDEN_REFERENCES } from "./explain-golden.fixture";

describe("explain in your own words — golden set (D.5)", () => {
  it("has 60 student definitions over 10 words", () => {
    expect(GOLDEN_CASES).toHaveLength(60);
    for (const entry of GOLDEN_CASES) expect(GOLDEN_REFERENCES[entry.word]).toBeDefined();
  });

  it("rules alone never grade a right or partly right answer as wrong, and are ≥ 90 % accurate when they decide", async () => {
    const results = await Promise.all(GOLDEN_CASES.map(async (entry) => ({ entry, grade: await gradeExplanation(entry.answer, GOLDEN_REFERENCES[entry.word], null) })));
    const unfair = results.filter(({ entry, grade }) => entry.expected !== "wrong" && grade.verdict === "wrong");
    expect(unfair.map(({ entry }) => entry.answer)).toEqual([]);
    const decided = results.filter(({ grade }) => grade.verdict !== "uncertain");
    const right = decided.filter(({ entry, grade }) => entry.expected === grade.verdict);
    expect(right.length / decided.length).toBeGreaterThanOrEqual(0.9);
    // Most answers are decided without any model; the rest fall back to a multiple choice.
    expect(decided.length / results.length).toBeGreaterThanOrEqual(0.75);
    // Rules alone already give the expected verdict on most of the set (the rest go to the model or a multiple choice).
    const exact = results.filter(({ entry, grade }) => entry.expected === grade.verdict);
    expect(exact.length / results.length).toBeGreaterThanOrEqual(0.85);
  });

  it("with a scripted model behind the provider layer, the full set is ≥ 90 % correct", async () => {
    // Stand-in for the real model: answers like a teacher, with high confidence.
    const expectedByAnswer = new Map(GOLDEN_CASES.map((entry) => [`${entry.word}:${entry.answer}`, entry.expected]));
    const judge: Judge = async (input) => ({ verdict: expectedByAnswer.get(`${input.word}:${input.answer}`) ?? "partial", confidence: 0.95 });
    const results = await Promise.all(GOLDEN_CASES.map(async (entry) => ({ entry, grade: await gradeExplanation(entry.answer, GOLDEN_REFERENCES[entry.word], judge) })));
    const right = results.filter(({ entry, grade }) => entry.expected === grade.verdict);
    expect(right.length / results.length).toBeGreaterThanOrEqual(0.9);
  });
});

describe("explain grading fails closed", () => {
  const ref = GOLDEN_REFERENCES["intrépide"];
  it("an undecidable answer with no model is uncertain, never wrong", async () => {
    const grade = await gradeExplanation("c'est comme un héros dans un film", ref, null);
    expect(grade.verdict).toBe("uncertain");
  });
  it("a model error or low confidence is uncertain, never wrong", async () => {
    const failing: Judge = vi.fn(async () => { throw new Error("down"); });
    expect((await gradeExplanation("c'est comme un héros dans un film", ref, failing)).verdict).toBe("uncertain");
    const unsure: Judge = async () => ({ verdict: "wrong", confidence: 0.6 });
    expect((await gradeExplanation("c'est comme un héros dans un film", ref, unsure)).verdict).toBe("uncertain");
  });
  it("only the word itself is uncertain (goes to the multiple choice)", () => {
    expect(ruleGrade("c'est intrépide", ref)?.verdict).toBe("uncertain");
  });
  it("a negation flip is not decided by the rules", () => {
    expect(ruleGrade("qui a peur du danger", ref)).toBeNull();
  });
  it("parses loose definition_validation entries", () => {
    expect(parseValidation(["Très courageux", { answer: "Qui a peur", label: "rejected" }, { text: "Un peu brave", verdict: "partial" }, 3])).toEqual([
      { text: "Très courageux", verdict: "correct" }, { text: "Qui a peur", verdict: "wrong" }, { text: "Un peu brave", verdict: "partial" },
    ]);
  });
});

describe("model check behind the provider layer", () => {
  const ref = GOLDEN_REFERENCES["vaste"];
  const provider = (summary: { score: number; capturedMainIdea: boolean } | Error) => ({
    scoreSummary: vi.fn(async () => { if (summary instanceof Error) throw summary; return { ...summary, keptCauseEffect: false, omittedDetails: false, feedbackFr: "" }; }),
  }) as unknown as import("@/lib/ai/provider").AIProvider;
  it("maps a confident model score to a verdict and passes only the vetted definition", async () => {
    const { judgeFromProvider, EXPLAIN_SYSTEM_PROMPT } = await import("./explain-judge");
    const fake = provider({ score: 92, capturedMainIdea: true });
    const grade = await gradeExplanation("ça prend beaucoup de place partout", ref, judgeFromProvider(fake));
    expect(grade).toMatchObject({ verdict: "correct", source: "model" });
    const call = (fake.scoreSummary as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0].textBody).toContain(ref.definition);
    expect(call[1]).toEqual({ systemPrompt: EXPLAIN_SYSTEM_PROMPT });
  });
  it("an unsure or failing model never makes an answer wrong", async () => {
    const { judgeFromProvider } = await import("./explain-judge");
    expect((await gradeExplanation("ça prend beaucoup de place partout", ref, judgeFromProvider(provider({ score: 50, capturedMainIdea: false })))).verdict).toBe("uncertain");
    expect((await gradeExplanation("ça prend beaucoup de place partout", ref, judgeFromProvider(provider(new Error("timeout"))))).verdict).toBe("uncertain");
  });
  it("the mock provider is never used as a judge", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));
    vi.doMock("@/lib/ai", () => ({ getAIProvider: vi.fn(), getAIProviderInfo: () => ({ provider: "mock", model: null }) }));
    const { providerJudge } = await import("./explain-server");
    expect(providerJudge()).toBeNull();
  });
});
