import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai/mock";
import type { AIProvider } from "@/lib/ai/provider";
import { deterministicProductionScore, priorityIsGrounded, scoreProductionWithAI } from "./production-ai";

const base = { text: "Hier, nous sommes allés au parc et nous avons joué.", genreLabel: "Récit", genreBrief: "Raconte.", nodeLabel: "Employer le passé composé en contexte", rulePattern: "auxiliaire + participe passé", demonstrated: true, grammarErrorCount: 0, words: 60, minimumWords: 60, maximumWords: 120 };

describe("production rubric", () => {
  it("anchors on the deterministic score", () => {
    expect(deterministicProductionScore(base)).toBe(100);
    expect(deterministicProductionScore({ ...base, demonstrated: false, grammarErrorCount: 3 })).toBeLessThan(80);
  });
  it("rejects ungrounded or multi-priority feedback", () => {
    expect(priorityIsGrounded("Une seule priorité : relis l’accord du participe.", base.rulePattern, base.nodeLabel)).toBe(true);
    expect(priorityIsGrounded("Règle : « le COD placé avant le verbe s’accorde ».", base.rulePattern, base.nodeLabel)).toBe(false);
    expect(priorityIsGrounded("Un. Deux. Trois priorités différentes ici.", base.rulePattern, base.nodeLabel)).toBe(false);
  });
  it("clamps the model score and falls back when the priority is not grounded", async () => {
    const provider = { ...new MockAIProvider(), scoreSummary: async () => ({ score: 10, contentScore: 50, structureScore: 50, languageScore: 50, capturedMainIdea: true, keptCauseEffect: true, omittedDetails: false, feedbackFr: "Applique la règle « accord du COD antéposé »." }) } as unknown as AIProvider;
    const rubric = await scoreProductionWithAI({ ...base, provider });
    expect(rubric.modelScore).toBe(10);
    expect(rubric.score).toBeGreaterThanOrEqual(87);
    expect(rubric.priorityFr).not.toContain("COD antéposé");
  });
  it("degrades to deterministic when the provider fails", async () => {
    const provider = { scoreSummary: async () => { throw new Error("down"); } } as unknown as AIProvider;
    const rubric = await scoreProductionWithAI({ ...base, provider });
    expect(rubric.source).toBe("deterministic");
    expect(rubric.score).toBe(100);
  });
});
