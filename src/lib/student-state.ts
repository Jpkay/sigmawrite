import type { DiagnosticResult, ReadingSessionResult } from "@/lib/types";
import type { SkillEstimate } from "@/lib/scoring/skill-estimate";
import type { RetrievalResult } from "@/lib/scoring/retrieval";

export type RetrievalCard = {
  id: string;
  conceptLabel: string;
  promptFr: string;
  keywords: string[];
  sourceTextId: string;
  intervalDays: number;
  ease: number;
  repetitions: number;
  dueAt: string;
  lastResult?: RetrievalResult;
  /** FSRS memory state; absent until the first graded review. */
  stability?: number;
  difficulty?: number;
  lastReviewedAt?: string;
  vocabularyWord?: string;
};

import type { VocabularyEvidence } from "@/lib/vocabulary/learning";

export type VocabState = { exposures: number; lastSeenAt: string; evidence?: VocabularyEvidence; nextReviewAt?: string };

export type DiagnosticSectionProfileKey =
  | "reading_comprehension"
  | "grammar"
  | "spelling"
  | "conjugation";

export type DiagnosticSectionProfile = {
  total: number;
  confirmed: number;
  mastered: number;
  fragile: number;
  missing: number;
  unknown: number;
  meanMastery: number | null;
};

export type StudentState = {
  hydrated: boolean;
  onboarded: boolean;
  grade: number | null;
  frenchBackground: string | null;
  interests: string[];
  diagnostic: DiagnosticResult | null;
  diagnosticProvisional: boolean;
  diagnosticSectionProfile: Partial<Record<DiagnosticSectionProfileKey, DiagnosticSectionProfile>>;
  sessions: ReadingSessionResult[];
  answersByText: Record<string, Record<string, number | string>>;
  skillEstimates: Record<string, SkillEstimate>;
  retrievalCards: RetrievalCard[];
  vocab: Record<string, VocabState>;
};

export function diagnosticSkillsFromDb(
  byKey: Record<string, number>
): DiagnosticResult["skillEstimates"] {
  return {
    literalComprehension: byKey.literal_comprehension ?? 50,
    inference: byKey.inference ?? 50,
    vocabularyInContext: byKey.vocabulary_in_context ?? 50,
    sentenceParsing: byKey.sentence_parsing ?? 50,
    summary: byKey.summarization ?? 50,
    argumentStructure: byKey.argument_structure ?? 50,
    academicConnectors: byKey.academic_connectors ?? 50,
  };
}

export const EMPTY_STUDENT_STATE: StudentState = {
  hydrated: false,
  onboarded: false,
  grade: null,
  frenchBackground: null,
  interests: [],
  diagnostic: null,
  diagnosticProvisional: false,
  diagnosticSectionProfile: {},
  sessions: [],
  answersByText: {},
  skillEstimates: {},
  retrievalCards: [],
  vocab: {},
};

export function diagnosticSectionProfileFromRows(
  rows: Array<{
    sectionKey: DiagnosticSectionProfileKey;
    classification: "mastered" | "fragile" | "missing" | "unknown";
    masteryProbability: number;
    evidenceCoverageConfirmed: boolean;
    evidenceKind: string;
  }>,
  targetCounts: Partial<Record<DiagnosticSectionProfileKey, number>>,
) {
  const keys: DiagnosticSectionProfileKey[] = [
    "reading_comprehension",
    "grammar",
    "spelling",
    "conjugation",
  ];
  return Object.fromEntries(keys.flatMap((key) => {
    const sectionRows = rows.filter((row) => row.sectionKey === key);
    const target = Math.max(targetCounts[key] ?? 0, sectionRows.length);
    if (target === 0) return [];
    const mastered = sectionRows.filter((row) => row.classification === "mastered").length;
    const fragile = sectionRows.filter((row) => row.classification === "fragile").length;
    const missing = sectionRows.filter((row) => row.classification === "missing").length;
    const explicitUnknown = sectionRows.filter((row) => row.classification === "unknown").length;
    const unknown = explicitUnknown + Math.max(0, target - sectionRows.length);
    const meanMastery = sectionRows.length
      ? sectionRows.reduce((sum, row) => sum + row.masteryProbability, 0) / sectionRows.length
      : null;
    return [[key, {
      total: target,
      confirmed: sectionRows.filter((row) =>
        row.evidenceKind === "direct" && row.evidenceCoverageConfirmed
      ).length,
      mastered,
      fragile,
      missing,
      unknown,
      meanMastery,
    } satisfies DiagnosticSectionProfile]];
  })) as Partial<Record<DiagnosticSectionProfileKey, DiagnosticSectionProfile>>;
}
