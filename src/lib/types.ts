/**
 * Core domain types for "Reading to Learn".
 * Mirrors the PRD (roadmap.md §C, §D, §E, §F, §I, §J, §L).
 * These are the application-level shapes; DB rows live in supabase/migrations.
 */

export const ROLES = [
  "student",
  "parent",
  "teacher",
  "school_admin",
  "platform_admin",
  "content_reviewer",
] as const;
export type Role = (typeof ROLES)[number];

/** The dashboard a role lands on after auth. */
export const ROLE_HOME: Record<Role, string> = {
  student: "/student",
  parent: "/parent",
  teacher: "/teacher",
  school_admin: "/admin",
  platform_admin: "/admin",
  content_reviewer: "/review",
};

export type Confidence = "low" | "medium" | "high";

export const FRENCH_BACKGROUNDS = [
  "native",
  "bilingual",
  "french_second_language",
  "returning_learner",
  "struggling_reader",
  "not_sure",
] as const;
export type FrenchBackground = (typeof FRENCH_BACKGROUNDS)[number];

export type TextType =
  | "expository"
  | "biography"
  | "argumentative"
  | "narrative_nonfiction"
  | "source_based";

export type ReviewStatus =
  | "draft"
  | "auto_approved"
  | "needs_human_review"
  | "human_approved"
  | "rejected"
  | "retired"
  | "benchmark_locked";

export type QuestionType =
  | "literal"
  | "vocabulary_in_context"
  | "inference"
  | "main_idea"
  | "cause_consequence"
  | "compare_contrast"
  | "evidence_selection"
  | "summary"
  | "transfer";

export type AnswerFormat = "multiple_choice" | "short_answer" | "written_summary";

export type NextAction =
  | "increase_difficulty"
  | "maintain"
  | "add_scaffolding"
  | "foundation_repair"
  | "reduce_difficulty"
  | "change_topic";

/** Internal difficulty bands — deliberately not fake grade precision (PRD §G). */
export const DIFFICULTY_BANDS = [
  "Foundation 5A",
  "Foundation 5B",
  "Foundation 6A",
  "Foundation 6B",
  "Secondary 7A",
  "Secondary 7B",
  "Secondary 8A",
  "Secondary 8B",
  "Secondary 9A",
  "Secondary 9B",
  "Secondary 10A",
  "Secondary 10B",
  "Advanced 11-12",
] as const;
export type DifficultyBand = (typeof DIFFICULTY_BANDS)[number];

/** The product's operating success zone (PRD §J). */
export const SUCCESS_ZONE = { min: 0.8, max: 0.85 } as const;

export type DiagnosticResult = {
  studentId: string;
  overallReadingBand: { minGrade: number; maxGrade: number; confidence: Confidence };
  textTypeEstimates: {
    narrative: number;
    expository: number;
    argumentative: number;
    sourceBased: number;
  };
  skillEstimates: {
    literalComprehension: number;
    inference: number;
    vocabularyInContext: number;
    sentenceParsing: number;
    summary: number;
    argumentStructure: number;
    academicConnectors: number;
  };
  recommendedStartingLevel: string;
  foundationGaps: string[];
};

export type ReadingSessionResult = {
  studentId: string;
  textVersionId: string;
  startedAt: string;
  completedAt?: string;
  abandoned: boolean;
  successRate: number;
  literalScore: number;
  inferenceScore: number;
  vocabularyScore: number;
  summaryScore: number;
  retrievalScore: number;
  timeOnTaskSeconds: number;
  hintsUsed: number;
  targetSuccessZone: { min: number; max: number };
  recommendedNextAction: NextAction;
};

export type StudentSkillEstimate = {
  studentId: string;
  skillId: string;
  ability: number; // 0–100
  uncertainty: number; // 0–100
  evidenceCount: number;
  lastEvidenceAt: string;
};
