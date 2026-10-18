import { describe, expect, it } from "vitest";
import { buildEditorialBrief } from "./brief";
import { runLiveChapter } from "./live";
import { runLibraryText } from "./library";
import { getStyleCard } from "./styles";
import { MemoryLogger } from "./team";
import { GOOD_RUBRIC, ScriptedLLM, WEAK_RUBRIC } from "./test-helpers";

const BODY = `Le vestiaire sentait le camphre et la boue sèche. Tu comptas les crampons alignés sous le banc : vingt-deux, pas un de plus. Dehors, la pluie tambourinait sur la tôle comme un millier de doigts impatients.

L'entraîneur entra, son carnet sous le bras, et posa sur la table un ballon dont le cuir avait viré au gris. « Celui-là a joué la finale », dit-il sans sourire. Personne ne le crut, mais tout le monde le regarda.

Tu pris le ballon. Il pesait plus lourd que prévu, gorgé d'eau, et tu sentis sous ton pouce une couture qui avait lâché. Le gardien, un grand intrépide aux genoux couronnés, siffla entre ses dents.

À sept heures douze, la sirène retentit. Tu sortis le premier. La pelouse fumait sous les projecteurs, et quelque part dans les tribunes, un parapluie jaune s'ouvrit tout seul.`;

const brief = { ...buildEditorialBrief({ kind: "chapter", mode: "live", interests: ["football"], grade: 6, gradeBand: "6e-5e", newLemmas: [{ lemma: "intrépide", kind: "new" }], dueLemmas: [{ lemma: "vestiaire", kind: "due" }], targetTenses: ["passe_simple"], styleKey: "verne", narration: "tu" }), lengthWords: { min: 130, max: 220 } };
const author = { title: "Sept heures douze", body: BODY, tenseEvidence: [{ form: "comptas", lemma: "compter", tense: "passe_simple" }], targetUsage: [], choices: [{ label: "Suivre le gardien", intent: "x" }, { label: "Rester au vestiaire", intent: "y" }], chapterSummary: "Le match commence.", questions: [] };
const lineEdit = { body: BODY, tenseEvidence: author.tenseEvidence, changes: [] };
const reviewers = {
  reviewer_targets: [{ naturalness: 5, contextHelpsMeaning: true, notes: [] }],
  reviewer_proof: [{ languageScore: 5, issues: [] }],
  reviewer_safety: [{ safe: true, ageAppropriate: true, concerns: [] }],
};
const gates = { moderate: async () => ({ allowed: true, categories: [] }) };

describe("live orchestrator (H.10)", () => {
  it("publishes a chapter that meets the bar without rewrite, logging every step", async () => {
    const llm = new ScriptedLLM({ author: [author], line_editor: [lineEdit], reviewer_style: [{ rubric: GOOD_RUBRIC, strengths: [], notes: [] }], ...reviewers });
    const logger = new MemoryLogger();
    const outcome = await runLiveChapter({ brief, style: getStyleCard("verne"), context: null, gates }, llm, logger);
    expect(outcome.decision).toBe("publish");
    expect(outcome.rewrites).toBe(0);
    expect(logger.steps.map((s) => s.role)).toEqual(expect.arrayContaining(["author", "line_editor", "code_checks", "reviewer_style", "reviewer_safety", "decision"]));
  });

  it("asks for exactly one rewrite, then falls back if still below the floor", async () => {
    const llm = new ScriptedLLM({ author: [author], line_editor: [lineEdit], reviewer_style: [{ rubric: WEAK_RUBRIC, strengths: [], notes: ["plus concret"] }], editor_in_chief: [{ instructions: ["Plus concret."] }], ...reviewers });
    const outcome = await runLiveChapter({ brief, style: getStyleCard("verne"), context: null, gates }, llm, new MemoryLogger());
    expect(outcome.decision).toBe("fallback");
    expect(outcome.rewrites).toBe(1);
    expect(llm.calls.filter((c) => c.role === "author")).toHaveLength(2);
  });

  it("falls back when a hard gate fails twice (moderation)", async () => {
    const llm = new ScriptedLLM({ author: [author], line_editor: [lineEdit], reviewer_style: [{ rubric: GOOD_RUBRIC, strengths: [], notes: [] }], editor_in_chief: [{ instructions: ["x"] }], ...reviewers });
    const outcome = await runLiveChapter({ brief, style: getStyleCard("verne"), context: null, gates: { moderate: async () => ({ allowed: false, categories: ["violence"] }) } }, llm, new MemoryLogger());
    expect(outcome.decision).toBe("fallback");
  });

  it("respects the cost cap and never throws to the caller", async () => {
    const llm = new ScriptedLLM({ author: [author], line_editor: [lineEdit], reviewer_style: [{ rubric: GOOD_RUBRIC, strengths: [], notes: [] }], ...reviewers }, 1);
    const outcome = await runLiveChapter({ brief, style: getStyleCard("verne"), context: null, gates, costCapUsd: 0.5 }, llm, new MemoryLogger());
    expect(outcome).toMatchObject({ decision: "fallback", reason: "cost_cap" });
  });

  it("falls back on provider errors", async () => {
    const llm = new ScriptedLLM({ author: [new Error("provider down")] });
    const outcome = await runLiveChapter({ brief, style: getStyleCard("verne"), context: null, gates }, llm, new MemoryLogger());
    expect(outcome.decision).toBe("fallback");
  });
});

describe("library mode (H.17)", () => {
  const libraryBrief = { ...brief, mode: "library" as const };
  it("runs best-of-4 with pairwise judging and publishes at ≥ 4.3", async () => {
    const llm = new ScriptedLLM({ author: [author], line_editor: [lineEdit], judge_pairwise: [{ winner: "A", margin: "net", reasons: [] }], reviewer_style: [{ rubric: GOOD_RUBRIC, strengths: [], notes: [] }], ...reviewers });
    const outcome = await runLibraryText({ brief: libraryBrief, style: getStyleCard("verne"), gates }, llm, new MemoryLogger());
    expect(outcome.decision).toBe("publish");
    expect(llm.calls.filter((c) => c.role === "author")).toHaveLength(4);
    expect(llm.calls.filter((c) => c.role === "judge_pairwise")).toHaveLength(6);
  });

  it("discards after 3 rounds below the bar instead of publishing", async () => {
    const llm = new ScriptedLLM({ author: [author], line_editor: [lineEdit], judge_pairwise: [{ winner: "B", margin: "net", reasons: [] }], reviewer_style: [{ rubric: { ...GOOD_RUBRIC, surprise: 3, voice: 3.5, rhythm: 3.5 }, strengths: [], notes: ["x"] }], editor_in_chief: [{ instructions: ["x"] }], ...reviewers });
    const outcome = await runLibraryText({ brief: libraryBrief, style: getStyleCard("verne"), gates }, llm, new MemoryLogger());
    expect(outcome).toMatchObject({ decision: "discard", rounds: 3 });
  });
});
