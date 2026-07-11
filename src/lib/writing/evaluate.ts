import type { FrenchGrammarChecker, GrammarMatch } from "@/lib/linguistic/types";
import { LanguageToolChecker } from "@/lib/linguistic/languagetool";
import type { AIProvider } from "@/lib/ai/provider";
import { scoreSummaryWithAI } from "@/lib/scoring/summary-ai";

export type ErrorNodeMapping = { ruleId: string; nodeId: string; nodeKey: string; nodeLabel: string; explanationFr: string; evidenceWeight: number };
export type WritingAnnotation = GrammarMatch & { nodeId: string | null; nodeKey: string | null; explanationFr: string };

export async function evaluateWriting(input: {
  textBody: string; studentText: string; keywords: string[]; mappings: ErrorNodeMapping[];
  checker?: FrenchGrammarChecker; provider?: AIProvider; systemPrompt?: string;
}) {
  let matches: GrammarMatch[] = []; let degraded = false;
  try { matches = (await (input.checker ?? new LanguageToolChecker()).check(input.studentText, { language: "fr", level: "picky" })).matches; }
  catch { degraded = true; }
  const mappingByRule = new Map(input.mappings.map((mapping) => [mapping.ruleId, mapping]));
  const annotations: WritingAnnotation[] = matches.map((match) => {
    const mapping = mappingByRule.get(match.ruleId);
    return { ...match, nodeId: mapping?.nodeId ?? null, nodeKey: mapping?.nodeKey ?? null, explanationFr: mapping?.explanationFr ?? match.message };
  });
  const rubric = await scoreSummaryWithAI({ textBody: input.textBody, studentSummary: input.studentText, keywords: input.keywords, provider: input.provider, systemPrompt: input.systemPrompt });
  const mappedCounts = new Map<string, { mapping: ErrorNodeMapping; count: number }>();
  for (const annotation of annotations) { const mapping = annotation.nodeId ? input.mappings.find((item) => item.nodeId === annotation.nodeId) : undefined; if (!mapping) continue; const prior = mappedCounts.get(mapping.nodeId); mappedCounts.set(mapping.nodeId, { mapping, count: (prior?.count ?? 0) + 1 }); }
  const revisionPlan = [...mappedCounts.values()].sort((a,b) => b.count-a.count).slice(0,2).map(({ mapping, count }) => ({ nodeId: mapping.nodeId, nodeKey: mapping.nodeKey, nodeLabel: mapping.nodeLabel, explanationFr: mapping.explanationFr, errorCount: count, evidenceWeight: mapping.evidenceWeight }));
  const errorPenalty = Math.min(30, annotations.length * 3);
  return { segments: input.studentText.split(/(?<=[.!?])\s+/).filter(Boolean), annotations, rubric: { ...rubric, score: Math.max(0, rubric.score - errorPenalty), grammarErrorCount: annotations.length }, revisionPlan, degraded };
}
