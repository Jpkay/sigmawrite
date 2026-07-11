import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai/mock";
import { evaluateWriting } from "./evaluate";
import type { FrenchGrammarChecker } from "@/lib/linguistic/types";

const checker: FrenchGrammarChecker = { async check(text) { return { text, language: "fr", clean: false, matches: [{ message: "Accord incorrect", offset: 9, length: 4, ruleId: "ETRE_VPPA", category: "AGREEMENT", replacements: ["allée"] }] }; } };

describe("evaluateWriting", () => {
  it("maps a planted être agreement error to a revision node", async () => {
    const result = await evaluateWriting({ textBody: "Elle est allée au marché.", studentText: "Elle est allé au marché et elle a acheté des fruits.", keywords: ["marché"], checker, provider: new MockAIProvider(), mappings: [{ ruleId: "ETRE_VPPA", nodeId: "node-1", nodeKey: "accord_pp_etre", nodeLabel: "Accord du participe passé avec être", explanationFr: "Accorde avec le sujet.", evidenceWeight: 0.35 }] });
    expect(result.annotations[0]).toMatchObject({ nodeKey: "accord_pp_etre", offset: 9 });
    expect(result.revisionPlan[0]).toMatchObject({ nodeId: "node-1", errorCount: 1 });
    expect(result.degraded).toBe(false);
  });
  it("degrades without breaking when LanguageTool is unavailable", async () => {
    const broken: FrenchGrammarChecker = { async check() { throw new Error("down"); } };
    const result = await evaluateWriting({ textBody: "Texte.", studentText: "Un résumé assez long pour être évalué sans service de grammaire.", keywords: [], checker: broken, provider: new MockAIProvider(), mappings: [] });
    expect(result.degraded).toBe(true); expect(result.annotations).toEqual([]);
  });
});
