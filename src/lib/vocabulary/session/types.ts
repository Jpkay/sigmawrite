/**
 * Word session items (roadmap 2026-10 Phase D). An item is what the student
 * sees for one word (or a few words, for the mini-dictée). The client view
 * never contains the answer of a typed recall item: grading happens on the
 * server from the signed token (token.ts).
 */
import type { WordFacet } from "../types";

export type SessionFormat =
  | "introduce"
  | "hear_and_type"
  | "type_from_definition"
  | "gap_fill_typed"
  | "mini_dictation"
  | "judge_usage"
  | "synonym_antonym"
  | "odd_one_out"
  | "explain_own_words"
  | "pick_definition"
  | "rebuild_letters";

/** A sentence split around the word so the UI can highlight it or blank it. */
export type SplitSentence = { before: string; word: string; after: string };

export type ChoiceOption = { id: string; label: string };

type Base = {
  /** Stable within a session (React key, occurrence key). */
  id: string;
  token: string;
  senseId: string;
  /** Interest the context sentence comes from, if any (shown as an emoji cue). */
  interest: string | null;
};

export type IntroduceItem = Base & {
  format: "introduce";
  word: string;
  definition: string;
  context: SplitSentence | null;
  example: { text: string; interest: string | null } | null;
  /** Letters of the word, shuffled, for the very easy first recall. */
  letters: string[];
};
export type HearItem = Base & { format: "hear_and_type"; audioUrl: string; length: number; firstLetter: string };
export type DefinitionItem = Base & { format: "type_from_definition"; definition: string; length: number; firstLetter: string };
export type GapItem = Base & { format: "gap_fill_typed"; sentence: SplitSentence; definition: string | null; length: number; firstLetter: string };
export type MiniDictationItem = Base & {
  format: "mini_dictation";
  words: Array<{ id: string; token: string; senseId: string; audioUrl: string; length: number; retry?: WordItemCore }>;
};
export type JudgeItem = Base & { format: "judge_usage"; word: string; options: ChoiceOption[] };
export type RelationItem = Base & { format: "synonym_antonym"; word: string; relation: "synonym" | "antonym"; sentence: SplitSentence | null; options: ChoiceOption[] };
export type OddItem = Base & { format: "odd_one_out"; options: ChoiceOption[] };
export type ExplainItem = Base & { format: "explain_own_words"; word: string; sentence: SplitSentence | null };
export type PickItem = Base & { format: "pick_definition"; word: string; options: ChoiceOption[] };
export type RebuildItem = Base & { format: "rebuild_letters"; letters: string[]; definition: string | null };

export type WordItemCore =
  | IntroduceItem
  | HearItem
  | DefinitionItem
  | GapItem
  | MiniDictationItem
  | JudgeItem
  | RelationItem
  | OddItem
  | ExplainItem
  | PickItem
  | RebuildItem;

/**
 * One planned word item with its variants:
 *  - `retry`: a different recall format for in-session relearning (C.4);
 *  - `rescue`: a recognition format that is very likely to succeed, used for
 *    a second miss and to end the session on a win (rule 3);
 *  - `harder`: offered when the session is too easy (rule 1, > 90 %).
 */
export type WordItem = WordItemCore & { retry?: WordItemCore; rescue?: WordItemCore; harder?: WordItemCore };

/** Server-only part of an item, sealed into its token. */
export type ItemSecret = {
  senseId: string;
  format: SessionFormat;
  facets: WordFacet[];
  /** Expected typed answer (typed formats, rebuild). */
  expected?: string;
  /** Correct option id (choice formats). */
  correct?: string;
  novelContext: boolean;
  /** The word was lapsed or nearly forgotten: a success is a "repêché" moment. */
  rescue: boolean;
  /** Display word for feedback and celebrations. */
  word: string;
  /** First-met sentence and interest, for introductions. */
  context?: { sentence: string | null; interest: string | null };
};

export type WordAnswerOutcome = "correct" | "accent" | "near" | "wrong";

/** Expected word split for feedback: the wrong part is highlighted. */
export type FeedbackSegment = { text: string; kind: "ok" | "wrong" | "accent" | "missing" };
