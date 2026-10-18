/**
 * Shared vocabulary memory types (roadmap 2026-10, Phases A–C).
 *
 * A "word" is a lexical sense (lexical_senses, migration 0037): *bureau*
 * (furniture) and *bureau* (office) are two words with one spelling. Each
 * sense a student learns has two FSRS cards, one per facet.
 */

export const WORD_FACETS = ["spelling", "meaning"] as const;
export type WordFacet = (typeof WORD_FACETS)[number];

/** Matches the vocabulary_learning_evidence.evidence_kind check (migration 0092). */
export const WORD_EVIDENCE_KINDS = [
  "exposure",
  "help_lookup",
  "recognition",
  "meaning_recall",
  "contextual_use",
  "correct_spelling",
] as const;
export type WordEvidenceKind = (typeof WORD_EVIDENCE_KINDS)[number];

/** Where the evidence happened. `embedded` = a due word met inside other content (D.6). */
export const WORD_EVIDENCE_SOURCES = [
  "reading",
  "dictation",
  "practice",
  "diagnostic",
  "writing",
  "story",
  "review",
  "embedded",
  "introduction",
  "legacy_review",
] as const;
export type WordEvidenceSource = (typeof WORD_EVIDENCE_SOURCES)[number];

/**
 * Activity formats. The format decides which trace an answer proves and
 * whether it is recall (full credit) or recognition (weak credit), following
 * the table in roadmap Phase B.
 */
export const WORD_ACTIVITY_FORMATS = [
  // Spelling recall
  "hear_and_type",
  "gap_fill_typed",
  "mini_dictation",
  "dictation",
  "free_writing",
  "practice_item",
  "diagnostic_item",
  // Both traces at once
  "type_from_definition",
  // Meaning recall
  "explain_own_words",
  "judge_usage",
  "synonym_antonym",
  "odd_one_out",
  // Recognition (weak credit)
  "pick_spelling",
  "pick_definition",
  "rebuild_letters",
  // No credit
  "reading_exposure",
  "story_exposure",
  "lookup",
] as const;
export type WordActivityFormat = (typeof WORD_ACTIVITY_FORMATS)[number];

export type FormatCredit = {
  facets: WordFacet[];
  credit: "recall" | "recognition" | "none";
};

export const FORMAT_CREDIT: Record<WordActivityFormat, FormatCredit> = {
  hear_and_type: { facets: ["spelling"], credit: "recall" },
  gap_fill_typed: { facets: ["spelling"], credit: "recall" },
  mini_dictation: { facets: ["spelling"], credit: "recall" },
  dictation: { facets: ["spelling"], credit: "recall" },
  free_writing: { facets: ["spelling"], credit: "recall" },
  practice_item: { facets: ["spelling"], credit: "recall" },
  diagnostic_item: { facets: ["spelling"], credit: "recall" },
  type_from_definition: { facets: ["spelling", "meaning"], credit: "recall" },
  explain_own_words: { facets: ["meaning"], credit: "recall" },
  judge_usage: { facets: ["meaning"], credit: "recall" },
  synonym_antonym: { facets: ["meaning"], credit: "recall" },
  odd_one_out: { facets: ["meaning"], credit: "recall" },
  pick_spelling: { facets: ["spelling"], credit: "recognition" },
  pick_definition: { facets: ["meaning"], credit: "recognition" },
  rebuild_letters: { facets: ["spelling"], credit: "recognition" },
  reading_exposure: { facets: [], credit: "none" },
  story_exposure: { facets: [], credit: "none" },
  lookup: { facets: [], credit: "none" },
};

/** The DB evidence kind recorded for a facet answered in a given format. */
export function evidenceKindFor(format: WordActivityFormat, facet: WordFacet | null): WordEvidenceKind {
  if (format === "lookup") return "help_lookup";
  const credit = FORMAT_CREDIT[format];
  if (credit.credit === "none" || !facet) return "exposure";
  if (credit.credit === "recognition") return "recognition";
  if (facet === "meaning") return "meaning_recall";
  return format === "free_writing" ? "contextual_use" : "correct_spelling";
}

export type FsrsRating = 1 | 2 | 3 | 4;

/** One piece of evidence about one facet of one sense (or a facet-less exposure). */
export type WordEvidence = {
  at: string;
  kind: WordEvidenceKind;
  facet: WordFacet | null;
  /** Exactly right. Accent slips are `successful: false, accentOnly: true` (graded Hard, not a lapse). */
  successful: boolean;
  format?: WordActivityFormat | null;
  source?: WordEvidenceSource | null;
  hintLevel?: number;
  answerRevealed?: boolean;
  accentOnly?: boolean;
  /** The sentence was new to the student (meaning rule B.2). */
  novelContext?: boolean;
  /** FSRS rating applied for this answer, after hint/speed caps (B.4). */
  rating?: FsrsRating | null;
  /** False for in-session retries and same-day repeats (C.4). */
  countsForFsrs?: boolean;
  /** Card stability just before this answer, when it was a card review. */
  stabilityBefore?: number | null;
};

/** The persisted FSRS state of one card (learning_retrieval_schedules row). */
export type WordCardState = {
  facet: WordFacet;
  stability: number | null;
  difficulty: number | null;
  reps: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
  introducedAt: string | null;
};

export type WordCards = Partial<Record<WordFacet, WordCardState | null>>;

/** Internal status keys. `a_revoir` follows a lapse; the five others are the B.3 ladder. */
export const WORD_STATUSES = ["decouvert", "en_route", "presque", "a_revoir", "maitrise", "ancre"] as const;
export type WordStatus = (typeof WORD_STATUSES)[number];
