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
};

export type VocabState = { exposures: number; lastSeenAt: string };

export type StudentState = {
  hydrated: boolean;
  onboarded: boolean;
  grade: number | null;
  frenchBackground: string | null;
  interests: string[];
  diagnostic: DiagnosticResult | null;
  sessions: ReadingSessionResult[];
  answersByText: Record<string, Record<string, number>>;
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
  sessions: [],
  answersByText: {},
  skillEstimates: {},
  retrievalCards: [],
  vocab: {},
};
