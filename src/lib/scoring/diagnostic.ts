import type { DiagnosticResult, Confidence } from "@/lib/types";
import { DIAGNOSTIC_ITEMS, type DiagnosticItem } from "@/lib/content/diagnostic";
import { gradeToBand } from "./band";
import { scoreSummary } from "./summary";

export type DiagnosticAnswers = Record<string, number>; // itemId → choiceIndex

const ability = (correct: number, total: number) =>
  total === 0 ? 50 : Math.round((correct / total) * 100);

/** Per-skill correct/total tally across answered items. */
function skillTally(items: DiagnosticItem[], answers: DiagnosticAnswers) {
  const tally: Record<string, { correct: number; total: number }> = {};
  for (const item of items) {
    const t = (tally[item.skillKey] ??= { correct: 0, total: 0 });
    t.total += 1;
    if (answers[item.id] === item.correctIndex) t.correct += 1;
  }
  return tally;
}

const skillAbility = (
  tally: Record<string, { correct: number; total: number }>,
  key: string
) => (tally[key] ? ability(tally[key].correct, tally[key].total) : 50);

/**
 * Estimates a reading grade from leveled items: the highest grade at which
 * the student is still answering the majority correctly (PRD §C). Pure.
 */
export function estimateReadingGrade(
  items: DiagnosticItem[],
  answers: DiagnosticAnswers
): number {
  const grades = [...new Set(items.map((i) => i.grade))].sort((a, b) => a - b);
  let estimate = grades[0] - 1;
  for (const g of grades) {
    const atGrade = items.filter((i) => i.grade === g);
    const correct = atGrade.filter((i) => answers[i.id] === i.correctIndex).length;
    if (correct / atGrade.length >= 0.5) estimate = g;
  }
  return Math.max(grades[0] - 1, estimate);
}

export function scoreDiagnostic(
  studentId: string,
  answers: DiagnosticAnswers,
  summaryText: string
): DiagnosticResult {
  const items = DIAGNOSTIC_ITEMS;
  const tally = skillTally(items, answers);
  const grade = estimateReadingGrade(items, answers);

  const totalCorrect = items.filter((i) => answers[i.id] === i.correctIndex).length;
  const accuracy = totalCorrect / items.length;
  const confidence: Confidence =
    items.length < 6 ? "low" : accuracy >= 0.4 && accuracy <= 0.95 ? "medium" : "low";

  const summary = scoreSummary(summaryText, {
    keywords: ["arbre", "ombre", "rafraich", "agreable", "ete"],
    minWords: 10,
  });

  // Section accuracy → text-type estimates (0–100).
  const sectionAcc = (section: DiagnosticItem["section"]) => {
    const s = items.filter((i) => i.section === section);
    if (!s.length) return 50;
    return ability(s.filter((i) => answers[i.id] === i.correctIndex).length, s.length);
  };
  const expository = Math.round(
    (sectionAcc("expository") + sectionAcc("paragraph_comprehension")) / 2
  );
  const argumentative = sectionAcc("argumentative");

  const skillEstimates = {
    literalComprehension: skillAbility(tally, "literal_comprehension"),
    inference: skillAbility(tally, "inference"),
    vocabularyInContext: skillAbility(tally, "vocabulary_in_context"),
    sentenceParsing: skillAbility(tally, "sentence_parsing"),
    summary: summary.score,
    argumentStructure: skillAbility(tally, "argument_structure"),
    academicConnectors: skillAbility(tally, "academic_connectors"),
  };

  // Foundation gaps: skills scoring below 50 (PRD §K trigger surface).
  const gapLabels: Record<string, string> = {
    inference: "inférence",
    academicConnectors: "connecteurs académiques",
    summary: "qualité du résumé",
    argumentStructure: "structure argumentative",
    vocabularyInContext: "vocabulaire en contexte",
    sentenceParsing: "analyse de phrases",
    literalComprehension: "compréhension littérale",
  };
  const foundationGaps = Object.entries(skillEstimates)
    .filter(([, v]) => v < 50)
    .map(([k]) => gapLabels[k] ?? k);

  return {
    studentId,
    overallReadingBand: { minGrade: grade, maxGrade: grade + 0.6, confidence },
    textTypeEstimates: {
      narrative: Math.min(100, expository + 5),
      expository,
      argumentative,
      sourceBased: Math.max(0, argumentative - 10),
    },
    skillEstimates,
    recommendedStartingLevel: gradeToBand(grade),
    foundationGaps,
  };
}
