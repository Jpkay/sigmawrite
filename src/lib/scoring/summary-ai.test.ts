import { describe, expect, it } from "vitest";
import type { AIProvider } from "@/lib/ai/provider";
import { MockAIProvider } from "@/lib/ai/mock";
import { scoreSummaryWithAI } from "./summary-ai";

class ExtremeProvider extends MockAIProvider implements AIProvider {
  async scoreSummary() {
    return { score: 100, contentScore: 100, structureScore: 90, languageScore: 95, capturedMainIdea: true, keptCauseEffect: true, omittedDetails: false, feedbackFr: "Retour du modèle." };
  }
}

class BrokenProvider extends MockAIProvider implements AIProvider {
  async scoreSummary(): Promise<never> { throw new Error("provider down"); }
}

describe("scoreSummaryWithAI", () => {
  it("clamps model disagreement to 25 points before blending", async () => {
    const result = await scoreSummaryWithAI({ textBody: "Texte source.", studentSummary: "non", keywords: ["migration"], provider: new ExtremeProvider() });
    expect(result.modelScore).toBe(100);
    expect(result.modelScoreClamped).toBe(result.heuristicScore + 25);
    expect(result.modelFlagged).toBe(true);
    expect(result.score).toBeLessThan(50);
  });
  it("falls back deterministically when the provider fails", async () => {
    const result = await scoreSummaryWithAI({ textBody: "Texte source.", studentSummary: "Un résumé assez long sur la migration et ses causes importantes.", keywords: ["migration"], provider: new BrokenProvider() });
    expect(result.source).toBe("heuristic_fallback");
    expect(result.score).toBe(result.heuristicScore);
  });
});
